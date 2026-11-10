import * as repo from './repository.js';
import { pgPool } from '../../config/db.js';
import { createExamScheduleSchema, bulkGradesSchema, coScholasticSchema } from './validation.js';

export async function listGradingScales(tenantId) {
  return await repo.getGradingScales(tenantId);
}

export async function addGradingScale(tenantId, data) {
  return await repo.createGradingScale(tenantId, data);
}

export async function editGradingScale(tenantId, id, data) {
  return await repo.updateGradingScale(tenantId, id, data);
}

export async function removeGradingScale(tenantId, id) {
  return await repo.deleteGradingScale(tenantId, id);
}

export async function getAggregatedResults(tenantId) {
  const raw = await repo.getAggregatedResults(tenantId);
  const gradingScales = await repo.getGradingScales(tenantId);

  const grouped = new Map();

  for (const r of raw) {
    const key = `${r.student_id}_${r.exam_title || 'Term 1'}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        studentId: r.student_id,
        student_id: r.student_id,
        studentName: r.student_name,
        student_name: r.student_name,
        admissionNumber: r.admission_number || '--',
        admission_number: r.admission_number || '--',
        roll_number: r.roll_number || '--',
        dob: r.dob,
        father_name: r.father_name,
        mother_name: r.mother_name,
        avatar_url: r.avatar_url,
        class_id: r.class_id,
        class: r.class_name,
        class_name: r.class_name,
        section: r.class_section,
        class_section: r.class_section,
        term: r.exam_title || 'Term 1',
        academic_year: '2026-27',
        totalMarksObtained: 0,
        totalMaxMarks: 0,
        subjects: []
      });
    }

    const item = grouped.get(key);
    const marks = Number(r.marks) || 0;
    const maxMarks = Number(r.max_marks) || 100;
    item.totalMarksObtained += marks;
    item.totalMaxMarks += maxMarks;
    item.subjects.push({
      subject: r.subject,
      marks,
      max_marks: maxMarks,
      component_scores: r.component_scores || null
    });
  }

  const results = Array.from(grouped.values()).map(r => {
    const percentage = r.totalMaxMarks > 0 ? (r.totalMarksObtained / r.totalMaxMarks) * 100 : 0;
    let grade = 'N/A';
    let gradeColor = '#10b981';

    if (gradingScales.length > 0) {
      const matched = gradingScales.find(
        s => percentage >= Number(s.min_percentage) && percentage <= Number(s.max_percentage)
      ) || gradingScales[gradingScales.length - 1];
      if (matched) {
        grade = matched.grade;
      }
    } else {
      if (percentage >= 90) grade = 'A1';
      else if (percentage >= 80) grade = 'A2';
      else if (percentage >= 70) grade = 'B1';
      else if (percentage >= 60) grade = 'B2';
      else if (percentage >= 50) grade = 'C1';
      else if (percentage >= 40) grade = 'C2';
      else if (percentage >= 33) grade = 'D';
      else grade = 'E';
    }

    return {
      ...r,
      totalMarksObtained: Math.round(r.totalMarksObtained * 10) / 10,
      totalMaxMarks: Math.round(r.totalMaxMarks * 10) / 10,
      percentage: Math.round(percentage * 10) / 10,
      grade,
      gradeColor,
      cbseGrade: grade
    };
  });

  results.sort((a, b) => b.percentage - a.percentage);
  const classRanks = {};
  results.forEach(r => {
    const classKey = `${r.class_id}_${r.term}`;
    classRanks[classKey] = (classRanks[classKey] || 0) + 1;
    r.rank = classRanks[classKey];
  });

  return results;
}

export async function getExams(tenantId, classId, user = null) {
  const userId = user?.id || user?.sub || null;
  const userRole = user?.role || user?.type || null;
  return await repo.listExams(tenantId, classId, userId, userRole);
}

export async function cloneDateSheet(tenantId, payload) {
  return await repo.cloneDateSheet(tenantId, payload);
}

export async function addExam(tenantId, rawData) {
  const payload = rawData?.data || rawData;
  const validated = createExamScheduleSchema.parse(payload);

  // Case A: Batch / DateSheet format (contains subjects array)
  if (validated.subjects && Array.isArray(validated.subjects) && validated.subjects.length > 0) {
    const title = validated.title || 'Date Sheet';
    const sectionsData = validated.sectionsData || {};
    let targetClassIds = [];

    // 1. If sectionsData has keys, those are class IDs
    const sectionClassIds = Object.keys(sectionsData).filter(k => k && k.length > 10);
    if (sectionClassIds.length > 0) {
      targetClassIds = sectionClassIds;
    }

    // 2. If classes array is provided
    if (validated.classes && Array.isArray(validated.classes) && validated.classes.length > 0) {
      for (const item of validated.classes) {
        const str = String(item).trim();
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
          if (!targetClassIds.includes(str)) targetClassIds.push(str);
        } else {
          const { rows } = await pgPool.query(
            `SELECT id FROM class WHERE tenant_id = $1 AND (name = $2 OR CONCAT('Class ', name) = $2 OR name = REPLACE($2, 'Class ', ''))`,
            [tenantId, str]
          );
          rows.forEach(r => {
            if (!targetClassIds.includes(r.id)) targetClassIds.push(r.id);
          });
        }
      }
    }

    // 3. If class / className is provided
    const singleClassParam = validated.class || validated.className || validated.class_id;
    if (targetClassIds.length === 0 && singleClassParam) {
      const str = String(singleClassParam).trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
        targetClassIds.push(str);
      } else {
        const { rows } = await pgPool.query(
          `SELECT id FROM class WHERE tenant_id = $1 AND (name = $2 OR CONCAT('Class ', name) = $2 OR name = REPLACE($2, 'Class ', ''))`,
          [tenantId, str]
        );
        rows.forEach(r => {
          if (!targetClassIds.includes(r.id)) targetClassIds.push(r.id);
        });
      }
    }

    if (targetClassIds.length === 0) {
      const error = new Error('No valid class selected for date sheet');
      error.status = 400;
      throw error;
    }

    const createdExams = [];
    for (const classId of targetClassIds) {
      const secDetails = sectionsData[classId] || {};
      for (const sub of validated.subjects) {
        // Enforce subject-to-class mapping validation
        const mapCheck = await pgPool.query(
          `SELECT cs.id 
           FROM class_subjects cs
           JOIN subject s ON cs.subject_id = s.id
           WHERE cs.tenant_id = $1 AND cs.class_id = $2 AND LOWER(TRIM(s.name)) = LOWER(TRIM($3))
           LIMIT 1`,
          [tenantId, classId, sub.subject]
        );
        if (mapCheck.rows.length === 0) {
          const clsInfo = await pgPool.query(`SELECT name, section FROM class WHERE tenant_id = $1 AND id = $2`, [tenantId, classId]);
          const clsName = clsInfo.rows[0] ? `Class ${clsInfo.rows[0].name} ${clsInfo.rows[0].section || ''}`.trim() : 'selected class';
          const error = new Error(`Subject "${sub.subject}" is not mapped to ${clsName}. Please map this subject under Subject Management first.`);
          error.status = 400;
          throw error;
        }

        const examRecord = {
          title,
          class_id: classId,
          subject: sub.subject,
          date: sub.date || validated.date || null,
          time: sub.time || validated.time || '09:00',
          duration: sub.duration || validated.duration || 120,
          marks: sub.marks || validated.marks || 100,
          room_number: secDetails.room_number || sub.room_number || null,
          invigilator_id: (secDetails.invigilator_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(secDetails.invigilator_id))
            ? secDetails.invigilator_id
            : null
        };

        if (secDetails.exam_id) {
          const updated = await repo.updateExam(tenantId, secDetails.exam_id, examRecord);
          if (updated) createdExams.push(updated);
        } else {
          const existing = await pgPool.query(
            `SELECT id FROM exams WHERE tenant_id = $1 AND class_id = $2 AND title = $3 AND subject = $4 LIMIT 1`,
            [tenantId, classId, title, sub.subject]
          );
          if (existing.rows.length > 0) {
            const updated = await repo.updateExam(tenantId, existing.rows[0].id, examRecord);
            if (updated) createdExams.push(updated);
          } else {
            const inserted = await repo.createExam(tenantId, examRecord);
            if (inserted) createdExams.push(inserted);
          }
        }
      }
    }
    return createdExams[0] || { count: createdExams.length };
  }

  // Case B: Single Exam format
  let targetClassId = validated.class_id;
  if (!targetClassId && (validated.class || validated.className)) {
    const str = String(validated.class || validated.className).trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      targetClassId = str;
    } else {
      const { rows } = await pgPool.query(
        `SELECT id FROM class WHERE tenant_id = $1 AND (name = $2 OR CONCAT('Class ', name) = $2 OR name = REPLACE($2, 'Class ', '')) LIMIT 1`,
        [tenantId, str]
      );
      targetClassId = rows[0]?.id;
    }
  }

  if (!targetClassId) {
    const error = new Error('Class ID is required');
    error.status = 400;
    throw error;
  }

  // Enforce subject-to-class mapping validation
  const mapCheck = await pgPool.query(
    `SELECT cs.id 
     FROM class_subjects cs
     JOIN subject s ON cs.subject_id = s.id
     WHERE cs.tenant_id = $1 AND cs.class_id = $2 AND LOWER(TRIM(s.name)) = LOWER(TRIM($3))
     LIMIT 1`,
    [tenantId, targetClassId, validated.subject]
  );
  if (mapCheck.rows.length === 0) {
    const clsInfo = await pgPool.query(`SELECT name, section FROM class WHERE tenant_id = $1 AND id = $2`, [tenantId, targetClassId]);
    const clsName = clsInfo.rows[0] ? `Class ${clsInfo.rows[0].name} ${clsInfo.rows[0].section || ''}`.trim() : 'selected class';
    const error = new Error(`Subject "${validated.subject}" is not mapped to ${clsName}. Please map this subject under Subject Management first.`);
    error.status = 400;
    throw error;
  }

  return await repo.createExam(tenantId, {
    title: validated.title,
    class_id: targetClassId,
    subject: validated.subject,
    date: validated.date || null,
    time: validated.time || null,
    duration: validated.duration || 120,
    marks: validated.marks || 100,
    room_number: validated.room_number || null,
    invigilator_id: (validated.invigilator_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.invigilator_id))
      ? validated.invigilator_id
      : null
  });
}

export async function getExamMarks(tenantId, examId) {
  return await repo.getExamGrades(tenantId, examId);
}

export async function editExam(tenantId, examId, rawData) {
  const payload = rawData?.data || rawData;
  return await repo.updateExam(tenantId, examId, payload);
}

export async function removeExam(tenantId, examId) {
  return await repo.deleteExam(tenantId, examId);
}

export async function getStudentOrExamGrades(tenantId, { examId, studentId }) {
  const rawGrades = await repo.getGradesQuery(tenantId, { examId, studentId });
  const gradingScales = await repo.getGradingScales(tenantId);

  return rawGrades.map(g => {
    let percentage = 0;
    let grade = 'N/A';
    let gradeColor = '#ef4444';

    const maxMarks = Number(g.max_marks) || 100;
    if (maxMarks > 0 && g.marks !== null) {
      percentage = (Number(g.marks) / maxMarks) * 100;
      const matched = gradingScales.find(
        s => percentage >= Number(s.min_percentage) && percentage <= Number(s.max_percentage)
      ) || gradingScales[gradingScales.length - 1];

      grade = matched?.grade || 'N/A';
      gradeColor = matched?.color_hex || '#ef4444';
    }

    return {
      marks: g.marks !== null ? Number(g.marks) : null,
      component_scores: g.component_scores || null,
      exam_id: g.exam_id,
      student_id: g.student_id,
      title: g.title,
      subject: g.subject,
      maxMarks,
      date: g.date,
      grade,
      gradeColor
    };
  });
}

export async function getExamDistribution(tenantId, examId) {
  const exam = await repo.getExamById(tenantId, examId);
  if (!exam) {
    const error = new Error('Exam not found');
    error.status = 404;
    throw error;
  }

  const distribution = await repo.getSubjectDistribution(tenantId, exam.class_id, exam.subject, exam.title);
  const gradingScales = await repo.getGradingScales(tenantId);

  return {
    distribution,
    grading_scales: gradingScales,
    exam
  };
}

export async function getDateSheetGrades(tenantId, title, classId) {
  return await repo.getDateSheetGrades(tenantId, title, classId);
}

export async function saveExamMarksBulk(tenantId, rawData, user = null) {
  let list = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (Array.isArray(rawData?.grades)) {
    list = rawData.grades;
  } else if (Array.isArray(rawData?.marks) && rawData?.exam_id) {
    list = rawData.marks.map(m => ({ exam_id: rawData.exam_id, student_id: m.student_id, marks: m.marks }));
  }

  if (list.length === 0) {
    return [];
  }

  // Strict Academic Governance: Only assigned Subject Teacher or Admin can submit grades
  if (user) {
    const userRole = user.role || user.type || '';
    const userId = user.id || user.sub;
    const isAdmin = ['admin', 'superadmin', 'super_admin', 'principal', 'academic_manager'].includes(userRole);

    if (!isAdmin && userId) {
      const examId = list[0]?.exam_id;
      if (examId) {
        const exam = await repo.getExamById(tenantId, examId, userId, userRole);
        if (exam && exam.can_grade === false) {
          const teacherHint = exam.subject_teacher_name ? ` (${exam.subject_teacher_name})` : '';
          const err = new Error(
            `Permission Denied: Only the assigned Subject Teacher${teacherHint} can enter or update marks for ${exam.subject}. Class Teachers have read-only visibility.`
          );
          err.status = 403;
          err.statusCode = 403;
          err.code = 'FORBIDDEN_NOT_SUBJECT_TEACHER';
          throw err;
        }
      }
    }
  }

  return await repo.saveBulkGradesAny(tenantId, list);
}

export async function getCoScholastic(tenantId, classId, term, academicYear = '2026-27', user = {}) {
  const rows = await repo.getCoScholasticGrades(tenantId, classId, term, academicYear);

  let allowedActivities = [];
  let isClassTeacher = false;

  const isAdminOrManager = !user.type || ['admin', 'academic_manager', 'super_admin', 'principal'].includes(user.type);

  if (isAdminOrManager) {
    allowedActivities = ['physical_education', 'discipline', 'work_education', 'art_education', 'gk'];
    isClassTeacher = true;
  } else {
    const { isClassTeacher: isCT, subjectNames } = await repo.getTeacherRoleAndSubjects(
      tenantId,
      user.id || user.sub,
      classId
    );
    isClassTeacher = isCT;

    if (subjectNames.some(s => s.includes('physical') || s.includes('pt') || s.includes('sport') || s.includes('yoga') || s.includes('khel'))) {
      allowedActivities.push('physical_education');
    }
    if (subjectNames.some(s => s.includes('art') || s.includes('drawing') || s.includes('dance') || s.includes('music'))) {
      allowedActivities.push('art_education');
    }
    if (subjectNames.some(s => s.includes('gk') || s.includes('general knowledge'))) {
      allowedActivities.push('gk');
    }
    if (subjectNames.some(s => s.includes('computer') || s.includes('it') || s.includes('work') || s.includes('craft'))) {
      allowedActivities.push('work_education');
    }
    if (isClassTeacher) {
      if (!allowedActivities.includes('discipline')) allowedActivities.push('discipline');
      if (!allowedActivities.includes('work_education')) allowedActivities.push('work_education');
    }
    if (allowedActivities.length === 0) {
      allowedActivities = ['physical_education', 'discipline', 'work_education', 'art_education', 'gk'];
    }
  }

  const students = rows.map((r, idx) => ({
    student_id: r.student_id,
    name: r.name || r.student_name,
    student_name: r.name || r.student_name,
    admission_number: r.admission_number,
    roll_number: r.roll_number || (idx + 1),
    avatar_url: r.avatar_url,
    physical_education: r.physical_education || 'A',
    discipline: r.discipline || 'A',
    work_education: r.work_education || 'A',
    art_education: r.art_education || 'A',
    gk: r.gk || 'A',
    remarks: r.remarks || '',
    is_persisted: !!r.grade_id,
    updated_at: r.updated_at || null,
  }));

  return {
    students,
    allowed_activities: allowedActivities,
    is_class_teacher: isClassTeacher,
  };
}

export async function saveCoScholasticBulk(tenantId, gradedBy, rawData) {
  const validated = coScholasticSchema.parse(rawData);
  return await repo.batchSaveCoScholastic(
    tenantId,
    validated.class_id,
    validated.term,
    validated.academic_year,
    gradedBy,
    validated.grades
  );
}

