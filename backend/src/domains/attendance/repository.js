import { pgPool } from '../../config/db.js';

/**
 * Attendance & Annual Planner Repository (ADO)
 * Directly operates on the partitioned `attendance` tables and `annual_planner`.
 */

// ============================================================================
// 1. ATTENDANCE (Partition-aware)
// ============================================================================

export async function getClassAttendanceSheet(tenantId, classId, date) {
  const query = `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.admission_number,
      u.house,
      u.avatar_url,
      COALESCE(a.status, 'Present') as status,
      a.id as attendance_id,
      a.date
    FROM class_students cs
    INNER JOIN "user" u ON cs.student_id = u.id AND u.tenant_id = $1
    LEFT JOIN attendance a ON a.user_id = u.id AND a.date = $3::date AND a.tenant_id = $1
    WHERE cs.class_id = $2 AND cs.tenant_id = $1
    ORDER BY u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId, date]);
  return rows;
}

export async function getDailyAttendanceOverview(tenantId, date) {
  const query = `
    SELECT 
      c.id as class_id,
      c.name as class_name,
      c.section as class_section,
      COUNT(DISTINCT cs.student_id)::int as total_students,
      COUNT(DISTINCT CASE WHEN a.status = 'Present' THEN a.user_id END)::int as present_count,
      COUNT(DISTINCT CASE WHEN a.status = 'Absent' THEN a.user_id END)::int as absent_count,
      COUNT(DISTINCT CASE WHEN a.status = 'Leave' THEN a.user_id END)::int as leave_count,
      CASE 
        WHEN COUNT(DISTINCT a.id) > 0 THEN TRUE 
        ELSE FALSE 
      END as is_marked
    FROM class c
    LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.tenant_id = c.tenant_id
    LEFT JOIN attendance a ON cs.student_id = a.user_id AND a.date = $2::date AND a.tenant_id = c.tenant_id
    WHERE c.tenant_id = $1
    GROUP BY c.id, c.name, c.section
    ORDER BY c.name ASC, c.section ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, date]);
  return rows;
}

export async function getSchoolAbsenteesToday(tenantId, date) {
  const query = `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.admission_number,
      u.phone as student_phone,
      p.father_name,
      p.phone as father_phone,
      c.name as class_name,
      c.section as class_section,
      a.status,
      a.date
    FROM attendance a
    INNER JOIN "user" u ON a.user_id = u.id AND u.tenant_id = a.tenant_id
    LEFT JOIN class_students cs ON u.id = cs.student_id AND cs.tenant_id = a.tenant_id
    LEFT JOIN class c ON cs.class_id = c.id AND c.tenant_id = a.tenant_id
    LEFT JOIN student_parents sp ON u.id = sp.student_id AND sp.tenant_id = a.tenant_id
    LEFT JOIN parents p ON sp.parent_id = p.id AND p.tenant_id = a.tenant_id
    WHERE a.tenant_id = $1 AND a.date = $2::date AND a.status = 'Absent'
    ORDER BY c.name ASC, u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, date]);
  return rows;
}

export async function getMonthlyClassMatrix(tenantId, classId, month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const query = `
    SELECT 
      u.id as student_id,
      u.name as student_name,
      u.admission_number,
      json_object_agg(TO_CHAR(a.date, 'YYYY-MM-DD'), a.status) as attendance_map
    FROM class_students cs
    INNER JOIN "user" u ON cs.student_id = u.id AND u.tenant_id = $1
    LEFT JOIN attendance a ON a.user_id = u.id 
      AND a.tenant_id = $1 
      AND a.date >= $3::date 
      AND a.date < ($3::date + INTERVAL '1 month')
    WHERE cs.class_id = $2 AND cs.tenant_id = $1
    GROUP BY u.id, u.name, u.admission_number
    ORDER BY u.name ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId, startDate]);
  return rows;
}

export async function getAttendanceRecords(tenantId, { startDate, endDate, classId, studentId, date } = {}) {
  let query = `
    SELECT 
      a.id,
      a.user_id,
      a.user_id as student_id,
      TO_CHAR(a.date, 'YYYY-MM-DD') as date,
      LOWER(a.status) as status,
      a.marked_by,
      u.name as teacher_name
    FROM attendance a
    LEFT JOIN "user" u ON a.marked_by = u.id AND u.tenant_id = a.tenant_id
  `;
  const conditions = ['a.tenant_id = $1'];
  const values = [tenantId];
  let paramIdx = 2;

  if (startDate) {
    conditions.push(`a.date >= $${paramIdx++}::date`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`a.date <= $${paramIdx++}::date`);
    values.push(endDate);
  }
  if (date && !startDate && !endDate) {
    conditions.push(`a.date = $${paramIdx++}::date`);
    values.push(date);
  }

  if (studentId) {
    conditions.push(`a.user_id = $${paramIdx++}`);
    values.push(studentId);
  } else if (classId) {
    conditions.push(`a.user_id IN (SELECT student_id FROM class_students WHERE tenant_id = $1 AND class_id = $${paramIdx++})`);
    values.push(classId);
  }

  query += ` WHERE ${conditions.join(' AND ')} ORDER BY a.date ASC, a.created_at ASC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

/**
 * High-performance UNNEST batch upsert directly into partitioned `attendance`
 */
export async function batchSaveAttendance(tenantId, markedBy, records) {
  if (!records || records.length === 0) return [];
  const studentIds = records.map(r => r.student_id);
  const dates = records.map(r => r.date);
  const statuses = records.map(r => r.status);

  const query = `
    INSERT INTO attendance (tenant_id, user_id, date, status, marked_by)
    SELECT $1, t.student_id, t.date::date, t.status, $2
    FROM UNNEST($3::uuid[], $4::date[], $5::text[]) AS t(student_id, date, status)
    ON CONFLICT (tenant_id, user_id, date) 
    DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
    RETURNING id, tenant_id, user_id, user_id as student_id, TO_CHAR(date, 'YYYY-MM-DD') as date, LOWER(status) as status;
  `;
  const { rows } = await pgPool.query(query, [tenantId, markedBy || null, studentIds, dates, statuses]);
  return rows;
}

export async function upsertSingleAttendance(tenantId, userId, date, status, markedBy) {
  const query = `
    INSERT INTO attendance (tenant_id, user_id, date, status, marked_by)
    VALUES ($1, $2, $3::date, $4, $5)
    ON CONFLICT (tenant_id, user_id, date)
    DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
    RETURNING id, tenant_id, user_id, user_id as student_id, TO_CHAR(date, 'YYYY-MM-DD') as date, LOWER(status) as status;
  `;
  const { rows } = await pgPool.query(query, [tenantId, userId, date, status, markedBy || null]);
  return rows[0];
}

export async function deleteSingleAttendance(tenantId, userId, date) {
  const query = `
    DELETE FROM attendance
    WHERE tenant_id = $1 AND user_id = $2 AND date = $3::date
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [tenantId, userId, date]);
  return rows[0] || null;
}

// ============================================================================
// 2. ANNUAL PLANNER CALENDAR
// ============================================================================

export async function listPlannerEvents(tenantId, startDate = null, endDate = null) {
  let query = `
    SELECT id, title, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, description, target_classes, requires_consent, created_at
    FROM annual_planner
    WHERE tenant_id = $1
  `;
  const values = [tenantId];

  if (startDate && endDate) {
    query += ` AND start_date >= $2 AND start_date <= $3`;
    values.push(startDate, endDate);
  }

  query += ` ORDER BY start_date ASC`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function createPlannerEvent(tenantId, data) {
  const query = `
    INSERT INTO annual_planner (
      tenant_id, title, start_date, end_date, category,
      description, target_classes, requires_consent
    ) VALUES (
      $1, $2, $3::date, $4::date, $5,
      $6, $7::jsonb, $8
    )
    RETURNING id, title, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, description, target_classes, requires_consent, created_at;
  `;
  const values = [
    tenantId,
    data.title,
    data.start_date,
    data.end_date || null,
    data.category || 'EVENT',
    data.description || null,
    JSON.stringify(data.target_classes || ['All']),
    data.requires_consent || false
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deletePlannerEvent(tenantId, eventId) {
  const query = `
    DELETE FROM annual_planner
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [eventId, tenantId]);
  return rows[0] || null;
}

export async function updatePlannerEvent(tenantId, eventId, data) {
  const query = `
    UPDATE annual_planner
    SET title = COALESCE($3, title),
        start_date = COALESCE($4::date, start_date),
        end_date = COALESCE($5::date, end_date),
        category = COALESCE($6, category),
        description = COALESCE($7, description)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, title, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, category, description, target_classes, requires_consent, created_at;
  `;
  const { rows } = await pgPool.query(query, [
    eventId,
    tenantId,
    data.title,
    data.start_date,
    data.end_date,
    data.category,
    data.description
  ]);
  return rows[0] || null;
}

export async function getEventConsents(tenantId, eventId) {
  const query = `
    SELECT 
      ec.id,
      ec.status,
      ec.student_id,
      u.name as student_name
    FROM event_consents ec
    LEFT JOIN "user" u ON ec.student_id = u.id AND u.tenant_id = ec.tenant_id
    WHERE ec.tenant_id = $1 AND ec.event_id = $2;
  `;
  const { rows } = await pgPool.query(query, [tenantId, eventId]);
  return rows;
}

export async function updateEventConsent(tenantId, consentId, status) {
  const query = `
    UPDATE event_consents
    SET status = $3
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, consentId, status]);
  return rows[0] || null;
}

