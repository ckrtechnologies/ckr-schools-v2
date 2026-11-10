import { pgPool } from '../../config/db.js';

export async function getTeacherUser(tenantId, teacherId) {
  const query = `
    SELECT id, name, email, phone, avatar_url, type as role, tenant_id
    FROM public."user"
    WHERE tenant_id = $1 AND id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, teacherId]);
  return rows[0] || null;
}

export async function getTeacherClasses(tenantId, teacherId) {
  const query = `
    SELECT ct.class_id, c.name as class_name, c.section
    FROM public.class_teachers ct
    JOIN public.class c ON ct.class_id = c.id AND c.tenant_id = ct.tenant_id
    WHERE ct.tenant_id = $1 AND ct.teacher_id = $2;
  `;
  const { rows } = await pgPool.query(query, [tenantId, teacherId]);
  return rows;
}

export async function getTeacherSubjects(tenantId, teacherId) {
  const query = `
    SELECT st.id, st.subject_id, s.name as subject_name, st.class_id, c.name as class_name, c.section
    FROM public.subject_teachers st
    JOIN public.subject s ON st.subject_id = s.id AND s.tenant_id = st.tenant_id
    JOIN public.class c ON st.class_id = c.id AND c.tenant_id = st.tenant_id
    WHERE st.tenant_id = $1 AND st.teacher_id = $2;
  `;
  const { rows } = await pgPool.query(query, [tenantId, teacherId]);
  return rows;
}

export async function getClassStudents(tenantId, classId) {
  const query = `
    SELECT 
      u.id, u.name, u.admission_number, u.email, u.phone, 
      u.father_name, u.mother_name, u.address, u.dob, u.house, 
      u.admission_date, u.avatar_url, cs.roll_number
    FROM public.class_students cs
    JOIN public."user" u ON cs.student_id = u.id AND u.tenant_id = cs.tenant_id
    WHERE cs.tenant_id = $1 AND cs.class_id = $2
    ORDER BY cs.roll_number ASC NULLS LAST, u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId]);
  return rows;
}

export async function getClassPerformance(tenantId, classId) {
  // 1. Students
  const students = await getClassStudents(tenantId, classId);
  if (students.length === 0) return [];

  const studentIds = students.map(s => s.id);

  // 2. Grades
  const gradesQuery = `
    SELECT g.student_id, g.marks, e.marks as total_marks
    FROM public.grades g
    JOIN public.exams e ON g.exam_id = e.id AND e.tenant_id = g.tenant_id
    WHERE g.tenant_id = $1 AND e.class_id = $2 AND g.student_id = ANY($3);
  `;
  const { rows: grades } = await pgPool.query(gradesQuery, [tenantId, classId, studentIds]);

  // 3. Attendance
  const attQuery = `
    SELECT user_id, status
    FROM public.attendance
    WHERE tenant_id = $1 AND user_id = ANY($2);
  `;
  const { rows: attendance } = await pgPool.query(attQuery, [tenantId, studentIds]);

  // Aggregate per student
  const statsMap = {};
  students.forEach(s => {
    statsMap[s.id] = {
      ...s,
      totalObtained: 0,
      totalMax: 0,
      daysPresent: 0,
      daysTotal: 0,
      totalDays: 0,
    };
  });

  grades.forEach(g => {
    if (statsMap[g.student_id]) {
      statsMap[g.student_id].totalObtained += Number(g.marks) || 0;
      statsMap[g.student_id].totalMax += Number(g.total_marks) || 0;
    }
  });

  attendance.forEach(a => {
    if (statsMap[a.user_id]) {
      statsMap[a.user_id].daysTotal += 1;
      statsMap[a.user_id].totalDays += 1;
      if (a.status?.toLowerCase() === 'present') {
        statsMap[a.user_id].daysPresent += 1;
      }
    }
  });

  const performanceList = Object.values(statsMap).map(st => {
    const gradePerc = st.totalMax > 0 ? (st.totalObtained / st.totalMax) * 100 : null;
    const attPerc = st.daysTotal > 0 ? (st.daysPresent / st.daysTotal) * 100 : null;

    // Calculate an overall score: Weighted 70% Grades, 30% Attendance
    let overallScore = 0;
    if (gradePerc !== null && attPerc !== null) {
      overallScore = (gradePerc * 0.7) + (attPerc * 0.3);
    } else if (gradePerc !== null) {
      overallScore = gradePerc;
    } else if (attPerc !== null) {
      overallScore = attPerc;
    }

    return {
      ...st,
      gradePercentage: gradePerc,
      academicAverage: gradePerc !== null ? Math.round(gradePerc) : 0,
      attendancePercentage: attPerc !== null ? Math.round(attPerc) : 0,
      overallScore: Math.round(overallScore * 100) / 100,
    };
  });

  // Sort by overallScore descending
  performanceList.sort((a, b) => b.overallScore - a.overallScore);

  return performanceList;
}

export async function getTeacherTimetable(tenantId, teacherId, classId = null) {
  let query = `
    SELECT 
      t.id,
      t.class_id,
      t.teacher_id,
      TO_CHAR(t.date, 'YYYY-MM-DD') as date,
      t.day_of_week,
      t.time_slot,
      t.subject,
      COALESCE(t.is_break, false) as is_break,
      t.room_number,
      c.name as class_name,
      c.section,
      u.name as teacher_name
    FROM public.timetable t
    LEFT JOIN public.class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
    LEFT JOIN public."user" u ON t.teacher_id = u.id AND u.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1
  `;
  const values = [tenantId];

  if (classId) {
    query += ` AND t.class_id = $2`;
    values.push(classId);
  } else {
    query += ` AND t.teacher_id = $2`;
    values.push(teacherId);
  }

  query += ` ORDER BY t.date ASC, t.time_slot ASC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

