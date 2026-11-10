import { pgPool } from '../../config/db.js';

/**
 * Admissions & Transfer Certificates Repository (ADO)
 */

// ============================================================================
// 1. INQUIRIES & LEADS (Vision "newUsers" table)
// ============================================================================

export async function listEnquiries(tenantId, { status, search }) {
  let query = `
    SELECT 
      nu.*,
      c.name as class_name, c.section as class_section
    FROM "newUsers" nu
    LEFT JOIN class c ON nu.class_id = c.id AND c.tenant_id = nu.tenant_id
    WHERE nu.tenant_id = $1
  `;
  const values = [tenantId];
  let idx = 2;

  if (status && status !== 'all') {
    query += ` AND nu.status = $${idx++}`;
    values.push(status);
  }

  if (search) {
    query += ` AND (nu.name ILIKE $${idx} OR nu.parent ILIKE $${idx} OR nu.phone ILIKE $${idx})`;
    values.push(`%${search.trim()}%`);
    idx++;
  }

  query += ` ORDER BY nu.created_at DESC`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function getEnquiryById(tenantId, enquiryId) {
  const query = `
    SELECT nu.*, c.name as class_name, c.section as class_section
    FROM "newUsers" nu
    LEFT JOIN class c ON nu.class_id = c.id AND c.tenant_id = nu.tenant_id
    WHERE nu.id = $1 AND nu.tenant_id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [enquiryId, tenantId]);
  return rows[0] || null;
}

export async function createEnquiry(tenantId, data) {
  const query = `
    INSERT INTO "newUsers" (
      tenant_id, name, parent, phone, email, gender, dob,
      class_id, academic_year, referral_source, enquiry_remarks, status,
      assigned_to, father_name, father_occupation, father_mobile,
      mother_name, mother_occupation, mother_mobile, alternate_phone,
      address, prev_school, prev_board, preferred_visit_date, documents, "parentEmail"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::date,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19, $20,
      $21, $22, $23, $24::date, $25::jsonb, $26
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.name,
    data.parent,
    data.phone,
    data.email || null,
    data.gender || null,
    data.dob || null,
    data.class_id || null,
    data.academic_year || '2026-2027',
    data.referral_source || 'Walk-in',
    data.enquiry_remarks || null,
    data.status || 'pending',
    data.assigned_to || null,
    data.father_name || null,
    data.father_occupation || null,
    data.father_mobile || null,
    data.mother_name || null,
    data.mother_occupation || null,
    data.mother_mobile || null,
    data.alternate_phone || null,
    data.address || null,
    data.prev_school || null,
    data.prev_board || null,
    data.preferred_visit_date || null,
    JSON.stringify(data.documents || []),
    data.parentEmail || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteEnquiry(tenantId, id) {
  const query = `DELETE FROM "newUsers" WHERE id = $1 AND tenant_id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  return rows[0] || null;
}

export async function updateEnquiry(tenantId, id, data) {
  const query = `
    UPDATE "newUsers"
    SET name = COALESCE($3, name),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        gender = COALESCE($6, gender),
        dob = COALESCE($7::date, dob),
        class_id = COALESCE($8, class_id),
        status = COALESCE($9, status),
        enquiry_remarks = COALESCE($10, enquiry_remarks),
        parent = COALESCE($11, parent),
        "parentEmail" = COALESCE($12, "parentEmail"),
        assigned_to = COALESCE($13, assigned_to),
        documents = COALESCE($14::jsonb, documents),
        monthly_fee = COALESCE($15, monthly_fee),
        bus_fee = COALESCE($16, bus_fee)
    WHERE id = $1 AND tenant_id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [
    id, tenantId,
    data.name || null,
    data.phone || null,
    data.email || null,
    data.gender || null,
    data.dob || null,
    data.class_id || null,
    data.status ? data.status.toLowerCase() : null,
    data.enquiry_remarks || null,
    data.parent || data.father_name || null,
    data.parentEmail || data.parent_email || null,
    data.assigned_to || null,
    data.documents ? JSON.stringify(data.documents) : null,
    data.monthly_fee ? Number(data.monthly_fee) : null,
    data.bus_fee ? Number(data.bus_fee) : null
  ]);
  return rows[0] || null;
}

export async function updateEnquiryStatus(tenantId, enquiryId, data) {
  const query = `
    UPDATE "newUsers"
    SET status = $1,
        school_tour_status = COALESCE($2, school_tour_status),
        principal_meet_status = COALESCE($3, principal_meet_status),
        follow_up_date = $4::date,
        office_remarks = COALESCE($5, office_remarks)
    WHERE id = $6 AND tenant_id = $7
    RETURNING *;
  `;
  const values = [
    data.status,
    data.school_tour_status || null,
    data.principal_meet_status || null,
    data.follow_up_date || null,
    data.office_remarks || null,
    enquiryId,
    tenantId
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}

/**
 * Converts enquiry to enrolled student in "user" and maps to "class_students"
 */
export async function enrollStudentFromEnquiry(tenantId, enquiryId, data) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch enquiry
    const { rows: eqRows } = await client.query(
      `SELECT * FROM "newUsers" WHERE id = $1 AND tenant_id = $2 FOR UPDATE;`,
      [enquiryId, tenantId]
    );
    const enquiry = eqRows[0];
    if (!enquiry) throw new Error('Enquiry not found');

    // 2. Insert into "user"
    const insertUserQuery = `
      INSERT INTO "user" (
        tenant_id, name, email, phone, type, gender, dob,
        admission_number, house, father_name, monthly_fee, bus_fee,
        admission_date, status
      ) VALUES (
        $1, $2, $3, $4, 'student', $5, $6,
        $7, $8, $9, $10, $11,
        $12::date, 'active'
      )
      RETURNING id, name, admission_number, type;
    `;
    const userValues = [
      tenantId,
      enquiry.name,
      enquiry.email || null,
      enquiry.phone || null,
      enquiry.gender || null,
      enquiry.dob || null,
      data.admission_number,
      data.house || 'Yellow',
      enquiry.parent || null,
      data.monthly_fee || 0,
      data.bus_fee || 0,
      data.admission_date
    ];
    const { rows: userRows } = await client.query(insertUserQuery, userValues);
    const student = userRows[0];

    // 3. Map to class_students if class is assigned
    const targetClassId = data.class_id || enquiry.class_id || null;
    if (targetClassId) {
      await client.query(
        `INSERT INTO class_students (tenant_id, class_id, student_id) VALUES ($1, $2, $3);`,
        [tenantId, targetClassId, student.id]
      );
    }

    // 4. Update enquiry status to 'approved'
    await client.query(
      `UPDATE "newUsers" SET status = 'approved' WHERE id = $1 AND tenant_id = $2;`,
      [enquiryId, tenantId]
    );

    await client.query('COMMIT');
    return student;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================================
// 2. TRANSFER CERTIFICATES (Vision 003 table)
// ============================================================================

export async function listTransferCertificates(tenantId) {
  const query = `
    SELECT 
      tc.id, tc.tc_number, tc.pupil_name, tc.father_name, tc.mother_name,
      tc.last_studied_class_figure, tc.issue_date, tc.status, tc.created_at,
      c.name as class_name, c.section as class_section
    FROM transfer_certificates tc
    LEFT JOIN class c ON tc.class_id = c.id AND c.tenant_id = tc.tenant_id
    WHERE tc.tenant_id = $1
    ORDER BY tc.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function getTcByNumber(tenantId, tcNumber) {
  const query = `
    SELECT tc.*, t.name as school_name, t.logo_url as school_logo, t.board_affiliation_number
    FROM transfer_certificates tc
    INNER JOIN tenants t ON tc.tenant_id = t.id
    WHERE tc.tc_number = $1 AND tc.tenant_id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tcNumber, tenantId]);
  return rows[0] || null;
}

export async function createTransferCertificate(tenantId, issuedBy, data) {
  const query = `
    INSERT INTO transfer_certificates (
      tenant_id, tc_number, student_id, class_id, issued_by,
      pupil_name, mother_name, father_name, dob, dob_words,
      nationality, category, last_studied_class_figure, last_studied_class_words,
      annual_exam_result, qualified_for_promotion, dues_paid_month,
      general_conduct, reason_for_leaving, remarks, status
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9::date, $10,
      $11, $12, $13, $14,
      $15, $16, $17,
      $18, $19, $20, 'ISSUED'
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.tc_number,
    data.student_id,
    data.class_id || null,
    issuedBy || null,
    data.pupil_name,
    data.mother_name || null,
    data.father_name || null,
    data.dob || null,
    data.dob_words || null,
    data.nationality || 'Indian',
    data.category || 'General',
    data.last_studied_class_figure || null,
    data.last_studied_class_words || null,
    data.annual_exam_result || null,
    data.qualified_for_promotion || 'Yes',
    data.dues_paid_month || null,
    data.general_conduct || 'Good',
    data.reason_for_leaving || null,
    data.remarks || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

