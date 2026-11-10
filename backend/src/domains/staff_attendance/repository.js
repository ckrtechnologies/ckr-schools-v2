import { pgPool } from '../../config/db.js';

export async function getTodayAttendance(tenantId, staffId, dateStr) {
  const query = `
    SELECT 
      id, tenant_id, staff_id, date::text as date, status, 
      check_in_time, check_out_time, source, marked_by, remarks, ip_address, 
      created_at, updated_at
    FROM public.staff_attendance
    WHERE tenant_id = $1 AND staff_id = $2 AND date = $3::date
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, dateStr]);
  return rows[0] || null;
}

export async function checkIn(tenantId, staffId, dateStr, remarks = null, ipAddress = null) {
  const query = `
    INSERT INTO public.staff_attendance (
      tenant_id, staff_id, date, status, check_in_time, source, remarks, ip_address, updated_at
    )
    VALUES (
      $1, $2, $3::date, 'Present', NOW(), 'self_app', $4, $5, NOW()
    )
    ON CONFLICT (tenant_id, staff_id, date)
    DO UPDATE SET 
      check_in_time = COALESCE(public.staff_attendance.check_in_time, NOW()),
      status = CASE 
        WHEN public.staff_attendance.status = 'Absent' THEN 'Present' 
        ELSE public.staff_attendance.status 
      END,
      remarks = COALESCE($4, public.staff_attendance.remarks),
      ip_address = COALESCE($5, public.staff_attendance.ip_address),
      updated_at = NOW()
    RETURNING 
      id, tenant_id, staff_id, date::text as date, status, 
      check_in_time, check_out_time, source, marked_by, remarks, ip_address, 
      created_at, updated_at;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, dateStr, remarks, ipAddress]);
  return rows[0];
}

export async function checkOut(tenantId, staffId, dateStr, remarks = null) {
  const query = `
    INSERT INTO public.staff_attendance (
      tenant_id, staff_id, date, status, check_out_time, source, remarks, updated_at
    )
    VALUES (
      $1, $2, $3::date, 'Present', NOW(), 'self_app', $4, NOW()
    )
    ON CONFLICT (tenant_id, staff_id, date)
    DO UPDATE SET 
      check_out_time = NOW(),
      remarks = COALESCE($4, public.staff_attendance.remarks),
      updated_at = NOW()
    RETURNING 
      id, tenant_id, staff_id, date::text as date, status, 
      check_in_time, check_out_time, source, marked_by, remarks, ip_address, 
      created_at, updated_at;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, dateStr, remarks]);
  return rows[0];
}

export async function getStaffHistory(tenantId, staffId, startDate, endDate) {
  const query = `
    SELECT 
      id, tenant_id, staff_id, date::text as date, status, 
      check_in_time, check_out_time, source, marked_by, remarks, 
      created_at, updated_at
    FROM public.staff_attendance
    WHERE tenant_id = $1 AND staff_id = $2 
      AND date >= $3::date AND date <= $4::date
    ORDER BY date ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, startDate, endDate]);
  return rows;
}

export async function getRoster(tenantId, dateStr, role = null, search = null) {
  let query = `
    SELECT 
      u.id as staff_id,
      u.name,
      u.email,
      u.phone,
      u.avatar_url,
      u.type as role,
      sa.id as attendance_id,
      sa.date::text as date,
      COALESCE(sa.status, 'Unmarked') as status,
      sa.check_in_time,
      sa.check_out_time,
      sa.source,
      sa.marked_by,
      mb.name as marked_by_name,
      sa.remarks
    FROM public."user" u
    LEFT JOIN public.staff_attendance sa 
      ON sa.staff_id = u.id AND sa.tenant_id = u.tenant_id AND sa.date = $2::date
    LEFT JOIN public."user" mb 
      ON sa.marked_by = mb.id
    WHERE u.tenant_id = $1
      AND u.type NOT IN ('student', 'parent', 'super_admin', 'admin')
      AND u.status = 'active'
  `;

  const values = [tenantId, dateStr];

  if (role && role !== 'all') {
    values.push(role);
    query += ` AND u.type = $${values.length}`;
  }

  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    query += ` AND (u.name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.phone ILIKE $${values.length})`;
  }

  query += ` ORDER BY u.name ASC;`;

  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function upsertOverride(tenantId, staffId, dateStr, status, markedBy, remarks = null, checkIn = null, checkOut = null) {
  const query = `
    INSERT INTO public.staff_attendance (
      tenant_id, staff_id, date, status, marked_by, remarks, 
      check_in_time, check_out_time, source, updated_at
    )
    VALUES (
      $1, $2, $3::date, $4, $5, $6, $7, $8, 'admin_override', NOW()
    )
    ON CONFLICT (tenant_id, staff_id, date)
    DO UPDATE SET 
      status = EXCLUDED.status,
      marked_by = EXCLUDED.marked_by,
      remarks = COALESCE(EXCLUDED.remarks, public.staff_attendance.remarks),
      check_in_time = COALESCE(EXCLUDED.check_in_time, public.staff_attendance.check_in_time),
      check_out_time = COALESCE(EXCLUDED.check_out_time, public.staff_attendance.check_out_time),
      source = 'admin_override',
      updated_at = NOW()
    RETURNING 
      id, tenant_id, staff_id, date::text as date, status, 
      check_in_time, check_out_time, source, marked_by, remarks, ip_address, 
      created_at, updated_at;
  `;
  const { rows } = await pgPool.query(query, [
    tenantId, staffId, dateStr, status, markedBy, remarks, checkIn, checkOut
  ]);
  return rows[0];
}

export async function getMonthlyMatrix(tenantId, startDate, endDate) {
  const staffQuery = `
    SELECT id, name, email, avatar_url, type as role
    FROM public."user"
    WHERE tenant_id = $1 
      AND type NOT IN ('student', 'parent', 'super_admin', 'admin') 
      AND status = 'active'
    ORDER BY name ASC;
  `;
  const recordsQuery = `
    SELECT 
      staff_id, date::text as date, status, check_in_time, check_out_time
    FROM public.staff_attendance
    WHERE tenant_id = $1 AND date >= $2::date AND date <= $3::date
    ORDER BY date ASC;
  `;

  const [staffRes, recordsRes] = await Promise.all([
    pgPool.query(staffQuery, [tenantId]),
    pgPool.query(recordsQuery, [tenantId, startDate, endDate])
  ]);

  return {
    staff: staffRes.rows,
    records: recordsRes.rows
  };
}

