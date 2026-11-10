import { pgPool } from '../../config/db.js';

/**
 * Examinations & Results Repository (ADO)
 */

export async function listExams(tenantId, classId = null, userId = null, userRole = null) {
  let query = `
    SELECT 
      e.id, e.title, e.class_id, TO_CHAR(e.date, 'YYYY-MM-DD') as date, e."time", e.subject,
      e.duration, e.marks, e.room_number, e.invigilator_id, e.created_at,
      c.name as class_name, c.section as class_section,
      c.name as class, c.section as section,
      u.name as invigilator_name,
      st.teacher_id as subject_teacher_id,
      stu.name as subject_teacher_name,
      stu.email as subject_teacher_email,
      EXISTS (
        SELECT 1 FROM class_teachers ct 
        WHERE ct.tenant_id = e.tenant_id AND ct.class_id = e.class_id AND ct.teacher_id = $2
      ) as is_class_teacher
    FROM exams e
    INNER JOIN class c ON e.class_id = c.id AND c.tenant_id = e.tenant_id
    LEFT JOIN "user" u ON e.invigilator_id = u.id AND u.tenant_id = e.tenant_id
    LEFT JOIN subject s ON LOWER(TRIM(s.name)) = LOWER(TRIM(e.subject)) AND s.tenant_id = e.tenant_id
    LEFT JOIN subject_teachers st ON st.class_id = e.class_id AND st.subject_id = s.id AND st.tenant_id = e.tenant_id
    LEFT JOIN "user" stu ON st.teacher_id = stu.id AND stu.tenant_id = e.tenant_id
    WHERE e.tenant_id = $1
  `;
  const values = [tenantId, userId || null];

  if (classId) {
    query += ` AND e.class_id = $3`;
    values.push(classId);
  }

  query += ` ORDER BY e.date ASC, e."time" ASC;`;
  const { rows } = await pgPool.query(query, values);

  const isAdmin = !userRole || ['admin', 'superadmin', 'super_admin', 'principal', 'academic_manager'].includes(userRole);

  return rows.map(row => {
    const isSubjectTeacher = Boolean(row.subject_teacher_id && userId && row.subject_teacher_id === userId);
    const isClassTeacher = Boolean(row.is_class_teacher);
    let canGrade = false;
    if (isAdmin) {
      canGrade = true;
    } else if (isSubjectTeacher) {
      canGrade = true;
    } else if (!row.subject_teacher_id && isClassTeacher) {
      canGrade = true;
    } else {
      canGrade = false;
    }

    return {
      ...row,
      subject_teacher_id: row.subject_teacher_id || null,
      subject_teacher_name: row.subject_teacher_name || null,
      is_subject_teacher: isSubjectTeacher,
      is_class_teacher: isClassTeacher,
      can_grade: canGrade,
    };
  });
}

export async function createExam(tenantId, data) {
  const query = `
    INSERT INTO exams (
      tenant_id, title, class_id, subject, date, "time", duration, marks, room_number, invigilator_id
    ) VALUES (
      $1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10
    )
    ON CONFLICT ON CONSTRAINT exams_tenant_class_title_subject_key DO UPDATE
    SET date = EXCLUDED.date,
        "time" = EXCLUDED."time",
        duration = EXCLUDED.duration,
        marks = EXCLUDED.marks,
        room_number = EXCLUDED.room_number,
        invigilator_id = EXCLUDED.invigilator_id
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.title,
    data.class_id,
    data.subject,
    data.date || null,
    data.time || null,
    data.duration ? Number(data.duration) : null,
    data.marks ? Number(data.marks) : 100,
    data.room_number || null,
    data.invigilator_id || null
  ];
  try {
    const { rows } = await pgPool.query(query, values);
    return rows[0];
  } catch (err) {
    // If constraint name differs or doesn't exist, fall back to standard insert or check-then-insert
    const fallbackQuery = `
      INSERT INTO exams (
        tenant_id, title, class_id, subject, date, "time", duration, marks, room_number, invigilator_id
      ) VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const { rows } = await pgPool.query(fallbackQuery, values);
    return rows[0];
  }
}

export async function getExamById(tenantId, examId, userId = null, userRole = null) {
  const query = `
    SELECT 
      e.id, e.class_id, e.subject, e.title, e.marks, e.duration, e.room_number, e.invigilator_id, 
      TO_CHAR(e.date, 'YYYY-MM-DD') as date, e."time",
      c.name as class_name, c.section as class_section,
      st.teacher_id as subject_teacher_id,
      stu.name as subject_teacher_name,
      stu.email as subject_teacher_email,
      EXISTS (
        SELECT 1 FROM class_teachers ct 
        WHERE ct.tenant_id = e.tenant_id AND ct.class_id = e.class_id AND ct.teacher_id = $3
      ) as is_class_teacher
    FROM exams e
    LEFT JOIN class c ON e.class_id = c.id AND c.tenant_id = e.tenant_id
    LEFT JOIN subject s ON LOWER(TRIM(s.name)) = LOWER(TRIM(e.subject)) AND s.tenant_id = e.tenant_id
    LEFT JOIN subject_teachers st ON st.class_id = e.class_id AND st.subject_id = s.id AND st.tenant_id = e.tenant_id
    LEFT JOIN "user" stu ON st.teacher_id = stu.id AND stu.tenant_id = e.tenant_id
    WHERE e.tenant_id = $1 AND e.id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, examId, userId || null]);
  if (!rows[0]) return null;

  const row = rows[0];
  const isAdmin = !userRole || ['admin', 'superadmin', 'super_admin', 'principal', 'academic_manager'].includes(userRole);
  const isSubjectTeacher = Boolean(row.subject_teacher_id && userId && row.subject_teacher_id === userId);
  const isClassTeacher = Boolean(row.is_class_teacher);
  let canGrade = false;
  if (isAdmin) {
    canGrade = true;
  } else if (isSubjectTeacher) {
    canGrade = true;
  } else if (!row.subject_teacher_id && isClassTeacher) {
    canGrade = true;
  } else {
    canGrade = false;
  }

  return {
    ...row,
    subject_teacher_id: row.subject_teacher_id || null,
    subject_teacher_name: row.subject_teacher_name || null,
    is_subject_teacher: isSubjectTeacher,
    is_class_teacher: isClassTeacher,
    can_grade: canGrade,
  };
}

export async function updateExam(tenantId, examId, data) {
  const query = `
    UPDATE exams
    SET title = COALESCE($3, title),
        subject = COALESCE($4, subject),
        date = COALESCE($5::date, date),
        "time" = COALESCE($6, "time"),
        duration = COALESCE($7, duration),
        marks = COALESCE($8, marks),
        room_number = COALESCE($9, room_number),
        invigilator_id = COALESCE($10, invigilator_id)
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const values = [
    tenantId,
    examId,
    data.title !== undefined ? data.title : null,
    data.subject !== undefined ? data.subject : null,
    data.date !== undefined ? data.date : null,
    data.time !== undefined ? data.time : null,
    data.duration !== undefined ? (data.duration ? Number(data.duration) : null) : null,
    data.marks !== undefined ? (data.marks ? Number(data.marks) : 100) : null,
    data.room_number !== undefined ? data.room_number : null,
    data.invigilator_id !== undefined ? (data.invigilator_id || null) : null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}

export async function deleteExam(tenantId, examId) {
  const query = `DELETE FROM exams WHERE tenant_id = $1 AND id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [tenantId, examId]);
  return rows[0] || null;
}

export async function getGradingScales(tenantId) {
  const query = `
    SELECT id, grade, min_percentage, max_percentage, color_hex
    FROM grading_scales
    WHERE tenant_id = $1
    ORDER BY min_percentage DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  if (rows.length === 0) {
    return [
      { id: 1, grade: 'A+', min_percentage: 90, max_percentage: 100, color_hex: '#16a34a' },
      { id: 2, grade: 'A', min_percentage: 80, max_percentage: 89.99, color_hex: '#16a34a' },
      { id: 3, grade: 'B', min_percentage: 70, max_percentage: 79.99, color_hex: '#3b82f6' },
      { id: 4, grade: 'C', min_percentage: 60, max_percentage: 69.99, color_hex: '#eab308' },
      { id: 5, grade: 'D', min_percentage: 50, max_percentage: 59.99, color_hex: '#f97316' },
      { id: 6, grade: 'F', min_percentage: 0, max_percentage: 49.99, color_hex: '#ef4444' }
    ];
  }
  return rows;
}

export async function createGradingScale(tenantId, data) {
  const query = `
    INSERT INTO grading_scales (tenant_id, grade, min_percentage, max_percentage, color_hex)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [
    tenantId,
    data.grade,
    data.min_percentage,
    data.max_percentage,
    data.color_hex || '#3b82f6'
  ]);
  return rows[0];
}

export async function updateGradingScale(tenantId, id, data) {
  const query = `
    UPDATE grading_scales
    SET grade = COALESCE($3, grade),
        min_percentage = COALESCE($4, min_percentage),
        max_percentage = COALESCE($5, max_percentage),
        color_hex = COALESCE($6, color_hex)
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [
    tenantId,
    id,
    data.grade,
    data.min_percentage,
    data.max_percentage,
    data.color_hex
  ]);
  return rows[0];
}

export async function deleteGradingScale(tenantId, id) {
  const query = `DELETE FROM grading_scales WHERE tenant_id = $1 AND id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [tenantId, id]);
  return rows[0] || null;
}

export async function getAggregatedResults(tenantId) {
  const query = `
    SELECT 
      g.id as grade_id,
      g.marks,
      g.component_scores,
      g.student_id,
      e.id as exam_id,
      e.title as exam_title,
      e.subject,
      e.marks as max_marks,
      e.date as exam_date,
      e.class_id,
      u.name as student_name,
      u.admission_number,
      u.dob,
      u.father_name,
      u.mother_name,
      u.avatar_url,
      c.name as class_name,
      c.section as class_section
    FROM grades g
    JOIN exams e ON g.exam_id = e.id AND e.tenant_id = g.tenant_id
    JOIN "user" u ON g.student_id = u.id AND u.tenant_id = g.tenant_id
    LEFT JOIN class c ON e.class_id = c.id AND c.tenant_id = e.tenant_id
    WHERE g.tenant_id = $1
    ORDER BY u.name ASC, e.date ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function getGradesQuery(tenantId, { examId, studentId } = {}) {
  let query = `
    SELECT 
      g.id,
      g.student_id,
      g.exam_id,
      g.marks,
      g.component_scores,
      e.title,
      e.subject,
      e.marks as max_marks,
      TO_CHAR(e.date, 'YYYY-MM-DD') as date,
      e.class_id
    FROM grades g
    INNER JOIN exams e ON g.exam_id = e.id AND e.tenant_id = g.tenant_id
    WHERE g.tenant_id = $1
  `;
  const values = [tenantId];
  let idx = 2;
  if (examId) {
    query += ` AND g.exam_id = $${idx++}`;
    values.push(examId);
  }
  if (studentId) {
    query += ` AND g.student_id = $${idx++}`;
    values.push(studentId);
  }
  query += ` ORDER BY g.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function getSubjectDistribution(tenantId, classId, subjectName, examTitle) {
  const subRes = await pgPool.query(
    `SELECT id FROM subject WHERE tenant_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1;`,
    [tenantId, subjectName]
  );
  const subjectId = subRes.rows[0]?.id;
  if (!subjectId) return null;

  const distRes = await pgPool.query(
    `SELECT * FROM subject_marks_distribution WHERE tenant_id = $1 AND class_id = $2 AND subject_id = $3;`,
    [tenantId, classId, subjectId]
  );
  if (distRes.rows.length === 0) return null;

  const examTitleUpper = (examTitle || '').toUpperCase();
  const matched = distRes.rows.find(d => examTitleUpper.includes((d.term || '').toUpperCase())) || distRes.rows[0];
  return matched || null;
}

export async function saveBulkGradesAny(tenantId, gradesList) {
  if (!gradesList || gradesList.length === 0) return [];
  const studentIds = gradesList.map(g => g.student_id);
  const examIds = gradesList.map(g => g.exam_id);
  const marks = gradesList.map(g => g.marks !== null && g.marks !== undefined ? Number(g.marks) : 0);
  const compScores = gradesList.map(g => JSON.stringify(g.component_scores || null));

  const query = `
    INSERT INTO grades (tenant_id, student_id, exam_id, marks, component_scores)
    SELECT $1, t.student_id, t.exam_id, t.marks, t.component_scores::jsonb
    FROM UNNEST($2::uuid[], $3::bigint[], $4::numeric[], $5::text[]) AS t(student_id, exam_id, marks, component_scores)
    ON CONFLICT (tenant_id, student_id, exam_id)
    DO UPDATE SET marks = EXCLUDED.marks, component_scores = EXCLUDED.component_scores
    RETURNING id, student_id, exam_id, marks, component_scores;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentIds, examIds, marks, compScores]);
  return rows;
}

export async function getDateSheetGrades(tenantId, title, classId) {
  const decodedTitle = decodeURIComponent(title);
  const examsRes = await pgPool.query(
    `SELECT id, subject, marks, class_id FROM exams WHERE tenant_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) AND class_id = $3;`,
    [tenantId, decodedTitle, classId]
  );
  const exams = examsRes.rows;
  if (exams.length === 0) return { subjects: [], results: [] };

  const examIds = exams.map(e => e.id);

  const classInfoRes = await pgPool.query(`SELECT id, section FROM class WHERE tenant_id = $1 AND id = $2;`, [tenantId, classId]);
  const section = classInfoRes.rows[0]?.section || '';

  const studentsRes = await pgPool.query(
    `SELECT u.id, u.name, u.admission_number, cs.roll_number
     FROM class_students cs
     JOIN public."user" u ON cs.student_id = u.id AND u.tenant_id = cs.tenant_id
     WHERE cs.tenant_id = $1 AND cs.class_id = $2
     ORDER BY cs.roll_number ASC NULLS LAST, u.name ASC;`,
    [tenantId, classId]
  );
  const students = studentsRes.rows;

  const gradesRes = await pgPool.query(
    `SELECT student_id, exam_id, marks, component_scores FROM grades WHERE tenant_id = $1 AND exam_id = ANY($2::bigint[]);`,
    [tenantId, examIds]
  );
  const grades = gradesRes.rows;

  const uniqueSubjects = [];
  const seen = new Set();
  exams.forEach(ex => {
    if (!seen.has(ex.subject)) {
      seen.add(ex.subject);
      uniqueSubjects.push({ subject: ex.subject, maxMarks: ex.marks });
    }
  });

  const results = students.map(st => {
    const studentGrades = {};
    exams.forEach(ex => {
      const g = grades.find(gr => gr.student_id === st.id && gr.exam_id == ex.id);
      studentGrades[ex.subject] = {
        exam_id: ex.id,
        marksObtained: g ? Number(g.marks) : null,
        component_scores: g?.component_scores || null,
        maxMarks: ex.marks
      };
    });
    return {
      student_id: st.id,
      name: st.name,
      admission_number: st.admission_number,
      section,
      grades: studentGrades
    };
  });

  return { subjects: uniqueSubjects, results };
}

export async function getExamGrades(tenantId, examId) {
  const query = `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.admission_number,
      u.house,
      g.id as grade_id,
      g.marks,
      g.max_marks
    FROM exams e
    INNER JOIN class_students cs ON e.class_id = cs.class_id AND cs.tenant_id = e.tenant_id
    INNER JOIN "user" u ON cs.student_id = u.id AND u.tenant_id = e.tenant_id
    LEFT JOIN grades g ON g.exam_id = e.id AND g.student_id = u.id AND g.tenant_id = e.tenant_id
    WHERE e.id = $1 AND e.tenant_id = $2
    ORDER BY u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [examId, tenantId]);
  return rows;
}

export async function batchSaveGrades(tenantId, examId, gradesList) {
  const studentIds = gradesList.map(g => g.student_id);
  const marks = gradesList.map(g => g.marks);
  const maxMarks = gradesList.map(g => g.max_marks || 100);

  const query = `
    INSERT INTO grades (tenant_id, exam_id, student_id, marks, max_marks)
    SELECT $1, $2, t.student_id, t.marks, t.max_marks
    FROM UNNEST($3::uuid[], $4::numeric[], $5::numeric[]) AS t(student_id, marks, max_marks)
    ON CONFLICT (tenant_id, student_id, exam_id)
    DO UPDATE SET marks = EXCLUDED.marks, max_marks = EXCLUDED.max_marks
    RETURNING id, student_id, exam_id, marks;
  `;
  const { rows } = await pgPool.query(query, [tenantId, examId, studentIds, marks, maxMarks]);
  return rows;
}

// Co-Scholastic Grades
export async function getTeacherRoleAndSubjects(tenantId, teacherId, classId) {
  let isClassTeacher = false;
  let subjectNames = [];

  try {
    const ctQuery = `
      SELECT id FROM class_teachers 
      WHERE tenant_id = $1 AND class_id = $2 AND teacher_id = $3
      LIMIT 1;
    `;
    const { rows: ctRows } = await pgPool.query(ctQuery, [tenantId, classId, teacherId]);
    isClassTeacher = ctRows.length > 0;
  } catch (err) {
    // ignore
  }

  try {
    const stQuery = `
      SELECT s.name 
      FROM subject_teachers st
      INNER JOIN subjects s ON st.subject_id = s.id AND s.tenant_id = $1
      WHERE st.tenant_id = $1 AND st.class_id = $2 AND st.teacher_id = $3;
    `;
    const { rows: stRows } = await pgPool.query(stQuery, [tenantId, classId, teacherId]);
    subjectNames = stRows.map(r => (r.name || '').toLowerCase());
  } catch (err) {
    // fallback if subjects table not populated
  }

  return { isClassTeacher, subjectNames };
}

export async function getCoScholasticGrades(tenantId, classId, term, academicYear = '2026-27') {
  const query = `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.name,
      u.admission_number,
      u.avatar_url,
      cs.roll_number,
      csg.id as grade_id,
      csg.physical_education,
      csg.discipline,
      csg.work_education,
      csg.art_education,
      csg.gk,
      csg.remarks,
      csg.updated_at
    FROM class_students cs
    INNER JOIN "user" u ON cs.student_id = u.id AND u.tenant_id = $1
    LEFT JOIN co_scholastic_grades csg ON csg.student_id = u.id 
      AND csg.class_id = $2 
      AND csg.term = $3 
      AND csg.academic_year = $4
      AND csg.tenant_id = $1
    WHERE cs.class_id = $2 AND cs.tenant_id = $1
    ORDER BY u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId, term, academicYear]);
  return rows;
}

export async function batchSaveCoScholastic(tenantId, classId, term, academicYear, gradedBy, gradesList) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO co_scholastic_grades (
        tenant_id, student_id, class_id, term, academic_year,
        physical_education, discipline, work_education, art_education, gk,
        remarks, graded_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        COALESCE($6, 'A'), COALESCE($7, 'A'), COALESCE($8, 'A'), COALESCE($9, 'A'), COALESCE($10, 'A'),
        $11, $12
      )
      ON CONFLICT (tenant_id, student_id, term, academic_year)
      DO UPDATE SET 
        physical_education = CASE WHEN $6 IS NOT NULL THEN $6 ELSE co_scholastic_grades.physical_education END,
        discipline = CASE WHEN $7 IS NOT NULL THEN $7 ELSE co_scholastic_grades.discipline END,
        work_education = CASE WHEN $8 IS NOT NULL THEN $8 ELSE co_scholastic_grades.work_education END,
        art_education = CASE WHEN $9 IS NOT NULL THEN $9 ELSE co_scholastic_grades.art_education END,
        gk = CASE WHEN $10 IS NOT NULL THEN $10 ELSE co_scholastic_grades.gk END,
        remarks = CASE WHEN $11 IS NOT NULL THEN $11 ELSE co_scholastic_grades.remarks END,
        graded_by = CASE WHEN $12 IS NOT NULL THEN $12 ELSE co_scholastic_grades.graded_by END,
        updated_at = NOW();
    `;

    for (const g of gradesList) {
      await client.query(query, [
        tenantId,
        g.student_id,
        classId,
        term,
        academicYear,
        g.physical_education !== undefined ? g.physical_education : null,
        g.discipline !== undefined ? g.discipline : null,
        g.work_education !== undefined ? g.work_education : null,
        g.art_education !== undefined ? g.art_education : null,
        g.gk !== undefined ? g.gk : null,
        g.remarks !== undefined ? g.remarks : null,
        gradedBy || null
      ]);
    }

    await client.query('COMMIT');
    return { success: true, count: gradesList.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function cloneDateSheet(tenantId, { sourceClassId, targetClassIds, examTitle }) {
  if (!sourceClassId || !Array.isArray(targetClassIds) || targetClassIds.length === 0) {
    throw new Error('sourceClassId and targetClassIds are required');
  }

  let query = `SELECT * FROM public.exams WHERE tenant_id = $1 AND class_id = $2`;
  const params = [tenantId, sourceClassId];
  if (examTitle) {
    params.push(examTitle);
    query += ` AND title = $${params.length}`;
  }
  const { rows: sourceExams } = await pgPool.query(query, params);
  if (sourceExams.length === 0) {
    const error = new Error('No source exams found to clone');
    error.status = 400;
    error.code = 'NOT_FOUND';
    throw error;
  }

  let insertedCount = 0;
  for (const targetClassId of targetClassIds) {
    for (const ex of sourceExams) {
      const existing = await pgPool.query(
        `SELECT id FROM public.exams WHERE tenant_id = $1 AND class_id = $2 AND title = $3 AND subject = $4`,
        [tenantId, targetClassId, ex.title, ex.subject]
      );
      if (existing.rows.length === 0) {
        await pgPool.query(
          `INSERT INTO public.exams (
            tenant_id, title, class_id, date, time, subject, duration, marks, room_number, invigilator_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            tenantId, ex.title, targetClassId, ex.date, ex.time, ex.subject,
            ex.duration || 60, ex.marks || 100, ex.room_number || null, ex.invigilator_id || null
          ]
        );
        insertedCount++;
      }
    }
  }

  return { success: true, count: insertedCount, message: `Cloned ${insertedCount} exam datesheet entries successfully.` };
}

