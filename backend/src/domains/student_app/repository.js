import { pgPool } from '../../config/db.js';

export async function getStudentProfile(tenantId, studentId) {
  const query = `
    SELECT id, name, admission_number, dob, avatar_url, house
    FROM public."user"
    WHERE tenant_id = $1 AND id = $2;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows[0] || null;
}

export async function getStudentClass(tenantId, studentId) {
  const query = `
    SELECT cs.class_id, cs.roll_number, c.name, c.section
    FROM public.class_students cs
    JOIN public.class c ON cs.class_id = c.id AND c.tenant_id = cs.tenant_id
    WHERE cs.tenant_id = $1 AND cs.student_id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows[0] || null;
}

export async function getTodaySchedule(tenantId, classId, todayName) {
  const query = `
    SELECT 
      t.id, t.time_slot, t.time_slot as time, t.subject, t.is_break, t.room_number,
      u.name as teacher_name, t.teacher
    FROM public.timetable t
    LEFT JOIN public."user" u ON t.teacher_id = u.id AND u.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.class_id = $2 AND LOWER(t.day_of_week) = LOWER($3)
    ORDER BY t.time_slot ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId, todayName]);
  return rows;
}

export async function getStudentGrades(tenantId, studentId) {
  const query = `
    SELECT g.marks, e.title as exam_name, e.marks as total_marks
    FROM public.grades g
    JOIN public.exams e ON g.exam_id = e.id AND e.tenant_id = g.tenant_id
    WHERE g.tenant_id = $1 AND g.student_id = $2
    ORDER BY g.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows;
}

export async function getAttendanceStats(tenantId, studentId) {
  const query = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(CASE WHEN LOWER(status) = 'present' THEN 1 END)::int as present
    FROM public.attendance
    WHERE tenant_id = $1 AND user_id = $2;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows[0] || { total: 0, present: 0 };
}

export async function getUpcomingEvents(tenantId, todayStr) {
  const query = `
    SELECT id, title, description, TO_CHAR(start_date, 'YYYY-MM-DD') as date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category as type
    FROM public.annual_planner
    WHERE tenant_id = $1 AND start_date >= $2::date
    ORDER BY start_date ASC LIMIT 5;
  `;
  const { rows } = await pgPool.query(query, [tenantId, todayStr]);
  return rows;
}

export async function getPendingCourseCount(tenantId) {
  const query = `SELECT COUNT(*)::int as count FROM public.course WHERE tenant_id = $1;`;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows[0]?.count || 0;
}

export async function getStudentTimetableRows(tenantId, classId) {
  const query = `
    SELECT 
      t.id, t.class_id, t.teacher_id, 
      TO_CHAR(t.date, 'YYYY-MM-DD') as date,
      t.day_of_week, t.time_slot, t.subject,
      COALESCE(t.is_break, false) as is_break,
      t.room_number,
      c.name as class_name, c.section,
      u.name as teacher_name
    FROM public.timetable t
    LEFT JOIN public.class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
    LEFT JOIN public."user" u ON t.teacher_id = u.id AND u.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.class_id = $2
    ORDER BY t.date ASC, t.time_slot ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId]);
  return rows;
}

export async function getStudentGradesWithDetails(tenantId, studentId) {
  const query = `
    SELECT 
      g.id, g.marks, g.component_scores,
      e.id as exam_id, e.title, e.subject, 
      TO_CHAR(e.date, 'YYYY-MM-DD') as date, 
      e.marks as max_marks
    FROM public.grades g
    JOIN public.exams e ON g.exam_id = e.id AND e.tenant_id = g.tenant_id
    WHERE g.tenant_id = $1 AND g.student_id = $2
    ORDER BY e.date DESC, g.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows;
}

export async function getClassDateSheets(tenantId, classId, startDate = null, endDate = null) {
  let query = `
    SELECT 
      e.id, e.title, e.subject, 
      TO_CHAR(e.date, 'YYYY-MM-DD') as date,
      e.time, e.duration, e.marks, e.room_number,
      c.name as class_name, c.section,
      u.name as invigilator
    FROM public.exams e
    LEFT JOIN public.class c ON e.class_id = c.id AND c.tenant_id = e.tenant_id
    LEFT JOIN public."user" u ON e.invigilator_id = u.id AND u.tenant_id = e.tenant_id
    WHERE e.tenant_id = $1 AND e.class_id = $2
  `;
  const values = [tenantId, classId];

  if (startDate && endDate) {
    query += ` AND e.date >= $3::date AND e.date <= $4::date`;
    values.push(startDate, endDate);
  }

  query += ` ORDER BY e.date ASC;`;
  const { rows } = await pgPool.query(query, values);
  return rows.map(r => ({
    ...r,
    className: r.class_name,
    section: r.section,
    invigilator: r.invigilator || null
  }));
}

export async function getThoughtOfTheDay(tenantId) {
  const query = `
    SELECT id, thought, author, date 
    FROM public.thought_of_the_day 
    WHERE tenant_id = $1 
    ORDER BY date DESC LIMIT 1;
  `;
  try {
    const { rows } = await pgPool.query(query, [tenantId]);
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function getLinkedSiblings(tenantId, userId) {
  const query = `
    WITH user_context AS (
      SELECT id, type, phone, father_name, mother_name 
      FROM public."user" 
      WHERE tenant_id = $1 AND id = $2
      UNION ALL
      SELECT id, 'parent' as type, phone, father_name, mother_name 
      FROM public.parents 
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    )
    SELECT DISTINCT
      u.id,
      u.name,
      u.admission_number,
      u.avatar_url,
      u.dob,
      u.gender,
      cs.class_id,
      cs.roll_number,
      c.name as class_name,
      c.section as class_section
    FROM public."user" u
    LEFT JOIN public.class_students cs ON u.id = cs.student_id AND cs.tenant_id = u.tenant_id
    LEFT JOIN public.class c ON cs.class_id = c.id AND c.tenant_id = u.tenant_id
    LEFT JOIN public.student_parents sp_student ON u.id = sp_student.student_id AND sp_student.tenant_id = u.tenant_id
    CROSS JOIN user_context uc
    WHERE u.tenant_id = $1
      AND u.type = 'student'
      AND (
        u.id = uc.id
        OR
        (uc.type = 'parent' AND sp_student.parent_id = uc.id)
        OR
        sp_student.parent_id IN (
          SELECT parent_id FROM public.student_parents WHERE tenant_id = $1 AND student_id = uc.id
        )
        OR
        (uc.phone IS NOT NULL AND length(trim(uc.phone)) >= 10 AND u.phone = uc.phone)
      )
    ORDER BY c.name ASC NULLS LAST, cs.roll_number ASC NULLS LAST;
  `;
  const { rows } = await pgPool.query(query, [tenantId, userId]);
  return rows;
}


