import { pgPool } from '../../config/db.js';

export async function getLeavePolicy(tenantId, academicYear = '2026-27') {
  const query = `
    SELECT 
      id, tenant_id, academic_year,
      casual_leave_annual, sick_leave_annual, earned_leave_annual,
      max_consecutive_days, require_doc_for_sick_days, notice_days_casual,
      created_at, updated_at
    FROM public.staff_leave_policies
    WHERE tenant_id = $1 AND academic_year = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, academicYear]);
  if (rows[0]) return rows[0];

  return {
    tenant_id: tenantId,
    academic_year: academicYear,
    casual_leave_annual: 12,
    sick_leave_annual: 10,
    earned_leave_annual: 15,
    max_consecutive_days: 3,
    require_doc_for_sick_days: 2,
    notice_days_casual: 1,
    is_default: true
  };
}

export async function upsertLeavePolicy(tenantId, data) {
  const query = `
    INSERT INTO public.staff_leave_policies (
      tenant_id, academic_year,
      casual_leave_annual, sick_leave_annual, earned_leave_annual,
      max_consecutive_days, require_doc_for_sick_days, notice_days_casual,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, NOW()
    )
    ON CONFLICT (tenant_id, academic_year)
    DO UPDATE SET
      casual_leave_annual = EXCLUDED.casual_leave_annual,
      sick_leave_annual = EXCLUDED.sick_leave_annual,
      earned_leave_annual = EXCLUDED.earned_leave_annual,
      max_consecutive_days = EXCLUDED.max_consecutive_days,
      require_doc_for_sick_days = EXCLUDED.require_doc_for_sick_days,
      notice_days_casual = EXCLUDED.notice_days_casual,
      updated_at = NOW()
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.academic_year || '2026-27',
    data.casual_leave_annual,
    data.sick_leave_annual,
    data.earned_leave_annual,
    data.max_consecutive_days || 3,
    data.require_doc_for_sick_days || 2,
    data.notice_days_casual || 1
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function bulkUpdateStaffBalances(tenantId, academicYear, quotas) {
  const query = `
    UPDATE public.staff_leave_balances
    SET 
      casual_leave_total = $3,
      sick_leave_total = $4,
      earned_leave_total = $5,
      updated_at = NOW()
    WHERE tenant_id = $1 AND academic_year = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [
    tenantId,
    academicYear,
    quotas.casual_leave_annual,
    quotas.sick_leave_annual,
    quotas.earned_leave_annual
  ]);
  return rows.length;
}

export async function getOrCreateLeaveBalance(tenantId, staffId, academicYear = '2026-27') {
  // First attempt to fetch
  const selectQuery = `
    SELECT 
      id, tenant_id, staff_id, academic_year,
      casual_leave_total::numeric, casual_leave_used::numeric,
      sick_leave_total::numeric, sick_leave_used::numeric,
      earned_leave_total::numeric, earned_leave_used::numeric,
      unpaid_leave_used::numeric,
      created_at, updated_at
    FROM public.staff_leave_balances
    WHERE tenant_id = $1 AND staff_id = $2 AND academic_year = $3
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(selectQuery, [tenantId, staffId, academicYear]);
  if (rows[0]) return rows[0];

  // Retrieve current policy for school, or fallback to 12, 10, 15
  const policy = await getLeavePolicy(tenantId, academicYear);
  const cl = policy.casual_leave_annual || 12;
  const sl = policy.sick_leave_annual || 10;
  const el = policy.earned_leave_annual || 15;

  const insertQuery = `
    INSERT INTO public.staff_leave_balances (
      tenant_id, staff_id, academic_year,
      casual_leave_total, casual_leave_used,
      sick_leave_total, sick_leave_used,
      earned_leave_total, earned_leave_used,
      unpaid_leave_used
    )
    VALUES (
      $1, $2, $3, $4, 0, $5, 0, $6, 0, 0
    )
    ON CONFLICT (tenant_id, staff_id, academic_year)
    DO UPDATE SET updated_at = NOW()
    RETURNING 
      id, tenant_id, staff_id, academic_year,
      casual_leave_total::numeric, casual_leave_used::numeric,
      sick_leave_total::numeric, sick_leave_used::numeric,
      earned_leave_total::numeric, earned_leave_used::numeric,
      unpaid_leave_used::numeric,
      created_at, updated_at;
  `;
  const insertRes = await pgPool.query(insertQuery, [tenantId, staffId, academicYear, cl, sl, el]);
  return insertRes.rows[0];
}

export async function getMyApplications(tenantId, staffId) {
  const query = `
    SELECT 
      sla.id, sla.tenant_id, sla.staff_id, sla.leave_type,
      sla.start_date::text as start_date, sla.end_date::text as end_date,
      sla.days_count::numeric as days_count, sla.reason, sla.attachment_url,
      sla.status, sla.admin_remarks, sla.reviewed_at,
      u.name as staff_name, u.avatar_url,
      rb.name as reviewed_by_name,
      sla.created_at, sla.updated_at
    FROM public.staff_leave_applications sla
    JOIN public."user" u ON u.id = sla.staff_id
    LEFT JOIN public."user" rb ON rb.id = sla.reviewed_by
    WHERE sla.tenant_id = $1 AND sla.staff_id = $2
    ORDER BY sla.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId]);
  return rows;
}

export async function createLeaveApplication(tenantId, staffId, { leave_type, start_date, end_date, days_count, reason, attachment_url }) {
  const query = `
    INSERT INTO public.staff_leave_applications (
      tenant_id, staff_id, leave_type, start_date, end_date, days_count, reason, attachment_url, status
    )
    VALUES (
      $1, $2, $3, $4::date, $5::date, $6, $7, $8, 'Pending'
    )
    RETURNING 
      id, tenant_id, staff_id, leave_type,
      start_date::text as start_date, end_date::text as end_date,
      days_count::numeric as days_count, reason, attachment_url,
      status, admin_remarks, created_at, updated_at;
  `;
  const { rows } = await pgPool.query(query, [
    tenantId, staffId, leave_type, start_date, end_date, days_count, reason, attachment_url || null
  ]);
  return rows[0];
}

export async function getApplicationById(tenantId, applicationId) {
  const query = `
    SELECT 
      sla.id, sla.tenant_id, sla.staff_id, sla.leave_type,
      sla.start_date::text as start_date, sla.end_date::text as end_date,
      sla.days_count::numeric as days_count, sla.reason, sla.attachment_url,
      sla.status, sla.admin_remarks, sla.reviewed_at,
      u.name as staff_name, u.email as staff_email, u.avatar_url, u.type as staff_role
    FROM public.staff_leave_applications sla
    JOIN public."user" u ON u.id = sla.staff_id
    WHERE sla.tenant_id = $1 AND sla.id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, applicationId]);
  return rows[0] || null;
}

export async function cancelApplication(tenantId, applicationId, staffId) {
  const query = `
    UPDATE public.staff_leave_applications
    SET status = 'Cancelled', updated_at = NOW()
    WHERE tenant_id = $1 AND id = $2 AND staff_id = $3 AND status = 'Pending'
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, applicationId, staffId]);
  return rows[0] || null;
}

export async function getAllApplications(tenantId, status = 'All') {
  let query = `
    SELECT 
      sla.id, sla.tenant_id, sla.staff_id, sla.leave_type,
      sla.start_date::text as start_date, sla.end_date::text as end_date,
      sla.days_count::numeric as days_count, sla.reason, sla.attachment_url,
      sla.status, sla.admin_remarks, sla.reviewed_at,
      u.name as staff_name, u.email as staff_email, u.avatar_url, u.type as staff_role,
      rb.name as reviewed_by_name,
      sla.created_at, sla.updated_at
    FROM public.staff_leave_applications sla
    JOIN public."user" u ON u.id = sla.staff_id
    LEFT JOIN public."user" rb ON rb.id = sla.reviewed_by
    WHERE sla.tenant_id = $1
  `;
  const values = [tenantId];

  if (status && status !== 'All') {
    values.push(status);
    query += ` AND sla.status = $${values.length}`;
  }

  query += ` ORDER BY sla.created_at DESC;`;

  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function updateApplicationStatus(tenantId, applicationId, status, reviewedBy, adminRemarks = null) {
  const query = `
    UPDATE public.staff_leave_applications
    SET 
      status = $3,
      reviewed_by = $4,
      reviewed_at = NOW(),
      admin_remarks = COALESCE($5, admin_remarks),
      updated_at = NOW()
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, applicationId, status, reviewedBy, adminRemarks]);
  return rows[0] || null;
}

export async function deductLeaveBalance(tenantId, staffId, leaveType, daysCount, academicYear = '2026-27') {
  let columnToIncrement = 'unpaid_leave_used';
  const lt = (leaveType || '').toLowerCase();

  if (lt.includes('casual')) {
    columnToIncrement = 'casual_leave_used';
  } else if (lt.includes('sick')) {
    columnToIncrement = 'sick_leave_used';
  } else if (lt.includes('earned')) {
    columnToIncrement = 'earned_leave_used';
  }

  const query = `
    UPDATE public.staff_leave_balances
    SET 
      ${columnToIncrement} = ${columnToIncrement} + $4,
      updated_at = NOW()
    WHERE tenant_id = $1 AND staff_id = $2 AND academic_year = $3
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, academicYear, daysCount]);
  return rows[0] || null;
}

export async function batchMarkAttendanceLeave(tenantId, staffId, startDate, endDate, adminRemarks = 'Approved Leave', markedBy = null) {
  const query = `
    INSERT INTO public.staff_attendance (
      tenant_id, staff_id, date, status, source, marked_by, remarks, updated_at
    )
    SELECT 
      $1, $2, d::date, 'Leave', 'system_leave', $3, $4, NOW()
    FROM generate_series($5::date, $6::date, '1 day'::interval) d
    ON CONFLICT (tenant_id, staff_id, date)
    DO UPDATE SET 
      status = 'Leave',
      source = 'system_leave',
      marked_by = EXCLUDED.marked_by,
      remarks = COALESCE(EXCLUDED.remarks, public.staff_attendance.remarks),
      updated_at = NOW()
    RETURNING id, date::text as date, status;
  `;
  const { rows } = await pgPool.query(query, [tenantId, staffId, markedBy, adminRemarks, startDate, endDate]);
  return rows;
}

