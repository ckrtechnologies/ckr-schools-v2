import { pgPool } from '../../config/db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/env.js';
import { provisionSchoolDirectories } from '../upload/controller.js';

export async function getPlatformStats() {
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM public.tenants) AS total_schools,
      (SELECT COUNT(*)::int FROM public.tenants WHERE is_active = TRUE) AS active_schools,
      (SELECT COUNT(*)::int FROM public."user" WHERE type = 'student' AND status = 'active') AS total_students,
      (SELECT COUNT(*)::int FROM public."user" WHERE type = 'teacher' AND status = 'active') AS total_teachers,
      (SELECT COUNT(*)::int FROM public."user" WHERE type IN ('admin', 'principal') AND status = 'active') AS total_admins
  `;
  const { rows } = await pgPool.query(query);
  const stats = rows[0] || {
    total_schools: 0,
    active_schools: 0,
    total_students: 0,
    total_teachers: 0,
    total_admins: 0
  };

  // Plan tier distribution
  const planQuery = `
    SELECT plan_tier, COUNT(*)::int AS count
    FROM public.tenants
    WHERE is_active = TRUE
    GROUP BY plan_tier
  `;
  const { rows: planRows } = await pgPool.query(planQuery);

  const planTiers = {
    FREE_TRIAL: 0,
    GROWTH_CAMPUS: 0,
    PRO_CAMPUS: 0,
    ENTERPRISE_AI: 0
  };

  const pricingMap = {
    FREE_TRIAL: 0,
    GROWTH_CAMPUS: 999900, // ₹9,999 in paise
    PRO_CAMPUS: 2499900,   // ₹24,999 in paise
    ENTERPRISE_AI: 4999900 // ₹49,999 in paise
  };

  let estimatedMRRPaise = 0;

  for (const r of planRows) {
    if (planTiers[r.plan_tier] !== undefined) {
      planTiers[r.plan_tier] = r.count;
      estimatedMRRPaise += (pricingMap[r.plan_tier] || 0) * r.count;
    }
  }

  return {
    ...stats,
    planTiers,
    estimatedMRRPaise
  };
}

export async function listTenants({ search, planTier, isActive, page, limit, sortBy, sortOrder }) {
  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];
  let paramIdx = 1;

  if (search) {
    whereClauses.push(`(t.name ILIKE $${paramIdx} OR t.slug ILIKE $${paramIdx} OR t.city ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (planTier && planTier !== 'all') {
    whereClauses.push(`t.plan_tier = $${paramIdx}`);
    params.push(planTier);
    paramIdx++;
  }

  if (isActive === 'true') {
    whereClauses.push(`t.is_active = TRUE`);
  } else if (isActive === 'false') {
    whereClauses.push(`t.is_active = FALSE`);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Allowed sort columns
  const validSortCols = {
    name: 't.name',
    created_at: 't.created_at',
    plan_tier: 't.plan_tier',
    slug: 't.slug'
  };
  const sortCol = validSortCols[sortBy] || 't.created_at';
  const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM public.tenants t
    ${whereStr}
  `;
  const { rows: countRows } = await pgPool.query(countQuery, params);
  const total = countRows[0]?.total || 0;

  const dataQuery = `
    SELECT 
      t.id,
      t.slug,
      t.name,
      t.affiliation_board,
      t.board_affiliation_number,
      t.school_code,
      t.official_email,
      t.official_phone,
      t.website,
      t.address,
      t.city,
      t.state,
      t.pincode,
      t.motto,
      t.logo_url,
      t.theme_color,
      t.accent_color,
      t.plan_tier,
      t.is_active,
      t.created_at,
      COALESCE(mp.is_featured, FALSE) AS is_featured,
      COALESCE(mp.avg_rating, 0) AS avg_rating,
      COALESCE(mp.review_count, 0) AS review_count,
      COALESCE((SELECT COUNT(*)::int FROM public."user" u WHERE u.tenant_id = t.id AND u.type = 'student'), 0) AS student_count,
      COALESCE((SELECT COUNT(*)::int FROM public."user" u WHERE u.tenant_id = t.id AND u.type = 'teacher'), 0) AS teacher_count,
      (
        SELECT json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone)
        FROM public."user" u
        WHERE u.tenant_id = t.id AND u.type IN ('admin', 'principal')
        ORDER BY u.created_at ASC
        LIMIT 1
      ) AS primary_admin
    FROM public.tenants t
    LEFT JOIN public.marketplace_school_profiles mp ON mp.tenant_id = t.id
    ${whereStr}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);
  const { rows } = await pgPool.query(dataQuery, params);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getTenantById(id) {
  const query = `
    SELECT 
      t.*,
      COALESCE((SELECT COUNT(*)::int FROM public."user" u WHERE u.tenant_id = t.id AND u.type = 'student'), 0) AS student_count,
      COALESCE((SELECT COUNT(*)::int FROM public."user" u WHERE u.tenant_id = t.id AND u.type = 'teacher'), 0) AS teacher_count,
      (
        SELECT json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'phone', u.phone, 'created_at', u.created_at)
        FROM public."user" u
        WHERE u.tenant_id = t.id AND u.type IN ('admin', 'principal')
        ORDER BY u.created_at ASC
        LIMIT 1
      ) AS primary_admin
    FROM public.tenants t
    WHERE t.id = $1
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [id]);
  return rows[0] || null;
}

export async function createTenantWithAdmin(data) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Check slug uniqueness
    const checkSlug = await client.query('SELECT id FROM public.tenants WHERE slug = $1', [data.slug]);
    if (checkSlug.rows.length > 0) {
      const err = new Error(`A school with slug '${data.slug}' already exists.`);
      err.status = 409;
      err.code = 'SLUG_ALREADY_EXISTS';
      throw err;
    }

    // Insert tenant
    const insertTenantQuery = `
      INSERT INTO public.tenants (
        slug, name, affiliation_board, board_affiliation_number, school_code,
        official_email, official_phone, website, address, city, state, pincode,
        logo_url, theme_color, accent_color, motto, plan_tier, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, TRUE
      )
      RETURNING *;
    `;
    const tenantValues = [
      data.slug,
      data.name,
      data.affiliationBoard,
      data.boardAffiliationNumber || null,
      data.schoolCode || null,
      data.officialEmail,
      data.officialPhone,
      data.website || null,
      data.address || null,
      data.city,
      data.state,
      data.pincode,
      data.logoUrl || null,
      data.themeColor || '#1e40af',
      data.accentColor || '#3b82f6',
      data.motto || null,
      data.planTier || 'GROWTH_CAMPUS'
    ];
    const { rows: tenantRows } = await client.query(insertTenantQuery, tenantValues);
    const tenant = tenantRows[0];

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.adminPassword, salt);

    // Insert admin user
    const insertAdminQuery = `
      INSERT INTO public."user" (
        tenant_id, name, email, phone, password_hash, type, status
      ) VALUES (
        $1, $2, $3, $4, $5, 'admin', 'active'
      )
      RETURNING id, name, email, phone, type, status, created_at;
    `;
    const adminValues = [
      tenant.id,
      data.adminName,
      data.adminEmail.toLowerCase(),
      data.adminPhone,
      passwordHash
    ];
    const { rows: adminRows } = await client.query(insertAdminQuery, adminValues);
    const adminUser = adminRows[0];

    await client.query('COMMIT');

    // Automatically provision all structured CDN directories for this school tenant
    try {
      provisionSchoolDirectories(tenant.slug, tenant.id);
    } catch (fsErr) {
      console.error('Failed to pre-provision CDN folders for tenant:', fsErr);
    }

    return {
      tenant,
      admin: adminUser
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenant(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  const mapping = {
    name: 'name',
    affiliationBoard: 'affiliation_board',
    boardAffiliationNumber: 'board_affiliation_number',
    schoolCode: 'school_code',
    officialEmail: 'official_email',
    officialPhone: 'official_phone',
    website: 'website',
    address: 'address',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    themeColor: 'theme_color',
    accentColor: 'accent_color',
    motto: 'motto',
    logoUrl: 'logo_url',
    planTier: 'plan_tier',
    isActive: 'is_active'
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    return getTenantById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE public.tenants
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `;

  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}

export async function deleteTenantCascade(id) {
  const tenant = await getTenantById(id);
  if (!tenant) return null;

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // CASCADE delete all records belonging to this school tenant
    const deleteQuery = `
      DELETE FROM public.tenants
      WHERE id = $1
      RETURNING id, slug, name;
    `;
    const { rows } = await client.query(deleteQuery, [id]);

    await client.query('COMMIT');

    // Cascade delete all physical asset and CDN folders for this tenant
    const uploadBase = config.cdn?.uploadDir || path.resolve(process.cwd(), './uploads');
    const targetDirs = [
      path.join(uploadBase, `${tenant.slug}-${tenant.id}`),
      path.join(uploadBase, tenant.slug),
      path.join('/srv/cdn', `${tenant.slug}-${tenant.id}`),
      path.join('/srv/cdn', tenant.slug)
    ];

    const purgedFolders = [];
    for (const dir of targetDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        purgedFolders.push(dir);
      }
    }

    return {
      ...(rows[0] || tenant),
      purgedFolders,
      deleted: true
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Super Admin Centralized Marketplace Leads Desk
 */
export async function listMarketplaceLeads({ tenantId, status, leadType, search, page = 1, limit = 50 }) {
  const offset = (Number(page) - 1) * Number(limit);
  const values = [];
  let whereClauses = ['1=1'];
  let idx = 1;

  if (tenantId) {
    whereClauses.push(`ml.tenant_id = $${idx++}`);
    values.push(tenantId);
  }
  if (status) {
    whereClauses.push(`ml.status = $${idx++}`);
    values.push(status);
  }
  if (leadType) {
    whereClauses.push(`ml.lead_type = $${idx++}`);
    values.push(leadType);
  }
  if (search) {
    whereClauses.push(`(
      ml.parent_name ILIKE $${idx} OR
      ml.student_name ILIKE $${idx} OR
      ml.phone ILIKE $${idx} OR
      ml.email ILIKE $${idx} OR
      t.name ILIKE $${idx}
    )`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  const whereStr = whereClauses.join(' AND ');

  // Total count
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM public.marketplace_leads ml
    INNER JOIN public.tenants t ON t.id = ml.tenant_id
    WHERE ${whereStr}
  `;
  const countRes = await pgPool.query(countQuery, values);
  const total = countRes.rows[0]?.total || 0;

  // Aggregate Stats
  const statsQuery = `
    SELECT
      COUNT(*)::int AS total_leads,
      COUNT(*) FILTER (WHERE ml.status = 'new')::int AS new_leads,
      COUNT(*) FILTER (WHERE ml.status = 'qualified')::int AS qualified_leads,
      COUNT(*) FILTER (WHERE ml.status = 'transferred')::int AS transferred_leads,
      COUNT(*) FILTER (WHERE ml.lead_type = 'brochure_download')::int AS brochure_downloads,
      COUNT(*) FILTER (WHERE ml.lead_type = 'enquiry' OR ml.lead_type = 'multi_enquiry')::int AS admission_enquiries,
      COALESCE(SUM(ml.monetization_fee_paise), 0)::bigint AS total_pipeline_paise
    FROM public.marketplace_leads ml
    INNER JOIN public.tenants t ON t.id = ml.tenant_id
    ${tenantId ? 'WHERE ml.tenant_id = $1' : ''}
  `;
  const statsRes = await pgPool.query(statsQuery, tenantId ? [tenantId] : []);
  const stats = statsRes.rows[0] || {};

  // Paged items
  const query = `
    SELECT
      ml.id, ml.tenant_id, ml.lead_type, ml.student_name, ml.parent_name,
      ml.phone, ml.email, ml.grade, ml.academic_year, ml.message,
      ml.compared_tenant_ids, ml.is_multi_enquiry, ml.status,
      ml.monetization_fee_paise, ml.admin_notes, ml.created_at, ml.updated_at,
      t.name AS school_name, t.slug AS school_slug, t.city AS school_city, t.affiliation_board AS school_board
    FROM public.marketplace_leads ml
    INNER JOIN public.tenants t ON t.id = ml.tenant_id
    WHERE ${whereStr}
    ORDER BY ml.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(Number(limit), Number(offset));

  const { rows } = await pgPool.query(query, values);

  return {
    items: rows,
    stats,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1
    }
  };
}

export async function updateMarketplaceLead(leadId, { status, monetization_fee_paise, admin_notes }) {
  const updates = [];
  const values = [leadId];
  let idx = 2;

  if (status !== undefined) {
    updates.push(`status = $${idx++}`);
    values.push(status);
  }
  if (monetization_fee_paise !== undefined) {
    updates.push(`monetization_fee_paise = $${idx++}`);
    values.push(Number(monetization_fee_paise));
  }
  if (admin_notes !== undefined) {
    updates.push(`admin_notes = $${idx++}`);
    values.push(admin_notes);
  }

  updates.push(`updated_at = NOW()`);

  const query = `
    UPDATE public.marketplace_leads
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}

export async function getSchoolLeadDossier(tenantId) {
  // Fetch tenant info
  const tenantRes = await pgPool.query(`
    SELECT id, name, slug, city, state, official_phone, official_email, affiliation_board
    FROM public.tenants
    WHERE id = $1;
  `, [tenantId]);

  if (!tenantRes.rows[0]) {
    throw new Error('School tenant not found');
  }

  const tenant = tenantRes.rows[0];

  // Fetch leads
  const leadsRes = await pgPool.query(`
    SELECT
      id, lead_type, student_name, parent_name, phone, email,
      grade, academic_year, message, status, monetization_fee_paise,
      created_at
    FROM public.marketplace_leads
    WHERE tenant_id = $1
    ORDER BY created_at DESC;
  `, [tenantId]);

  // Aggregate metrics
  const totalLeads = leadsRes.rows.length;
  const directEnquiries = leadsRes.rows.filter(l => l.lead_type === 'enquiry').length;
  const brochureDownloads = leadsRes.rows.filter(l => l.lead_type === 'brochure_download').length;
  const comparisonLeads = leadsRes.rows.filter(l => l.lead_type === 'comparison' || l.lead_type === 'multi_enquiry').length;
  const totalValuePaise = leadsRes.rows.reduce((acc, curr) => acc + Number(curr.monetization_fee_paise || 0), 0);

  return {
    school: tenant,
    dossier: {
      generated_at: new Date().toISOString(),
      summary: {
        total_leads: totalLeads,
        direct_enquiries: directEnquiries,
        brochure_downloads: brochureDownloads,
        comparison_leads: comparisonLeads,
        total_value_paise: totalValuePaise,
        total_value_inr: Math.round(totalValuePaise / 100)
      },
      leads: leadsRes.rows
    }
  };
}

/**
 * List all marketplace reviews across schools for moderation
 */
export async function listMarketplaceReviews({ tenantId = null, isApproved = null, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT 
      r.id, r.tenant_id, r.reviewer_name, r.reviewer_email, r.reviewer_phone,
      r.relationship, r.overall_rating, r.academics_rating, r.infrastructure_rating,
      r.faculty_rating, r.safety_rating, r.value_for_money_rating,
      r.title, r.review_text, r.is_verified, r.is_approved, r.helpful_count,
      r.created_at,
      t.name as school_name, t.slug as school_slug, t.city as school_city
    FROM public.marketplace_reviews r
    INNER JOIN public.tenants t ON r.tenant_id = t.id
    WHERE 1=1
  `;
  const values = [];

  if (tenantId) {
    values.push(tenantId);
    query += ` AND r.tenant_id = $${values.length}`;
  }

  if (isApproved !== null && isApproved !== undefined && isApproved !== '') {
    values.push(isApproved === 'true' || isApproved === true);
    query += ` AND r.is_approved = $${values.length}`;
  }

  query += ` ORDER BY r.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2};`;
  values.push(limit, offset);

  const { rows } = await pgPool.query(query, values);

  const countQuery = `
    SELECT 
      COUNT(*)::int as total,
      COUNT(CASE WHEN is_approved = TRUE THEN 1 END)::int as approved_count,
      COUNT(CASE WHEN is_approved = FALSE THEN 1 END)::int as pending_count
    FROM public.marketplace_reviews;
  `;
  const { rows: statsRows } = await pgPool.query(countQuery);

  return {
    reviews: rows,
    stats: statsRows[0] || { total: 0, approved_count: 0, pending_count: 0 }
  };
}

/**
 * Moderate a marketplace review (Approve or Reject)
 */
export async function updateReviewStatus(reviewId, isApproved) {
  const query = `
    UPDATE public.marketplace_reviews
    SET is_approved = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, tenant_id, is_approved;
  `;
  const { rows } = await pgPool.query(query, [!!isApproved, reviewId]);
  if (!rows[0]) return null;

  const tenantId = rows[0].tenant_id;

  // Recalculate school avg rating & count
  await pgPool.query(`
    UPDATE marketplace_school_profiles
    SET 
      avg_rating = COALESCE((
        SELECT ROUND(AVG(overall_rating), 2)
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      ), 0),
      review_count = (
        SELECT COUNT(*)::int
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      )
    WHERE tenant_id = $1;
  `, [tenantId]);

  return rows[0];
}

/**
 * Delete a marketplace review
 */
export async function deleteReview(reviewId) {
  const review = await pgPool.query(`SELECT tenant_id FROM public.marketplace_reviews WHERE id = $1`, [reviewId]);
  if (!review.rows[0]) return null;

  const tenantId = review.rows[0].tenant_id;
  await pgPool.query(`DELETE FROM public.marketplace_reviews WHERE id = $1`, [reviewId]);

  // Recalculate school rating
  await pgPool.query(`
    UPDATE marketplace_school_profiles
    SET 
      avg_rating = COALESCE((
        SELECT ROUND(AVG(overall_rating), 2)
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      ), 0),
      review_count = (
        SELECT COUNT(*)::int
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      )
    WHERE tenant_id = $1;
  `, [tenantId]);

  return { id: reviewId, deleted: true };
}

/**
 * 1-Click Feature School on Marketplace Toggle
 */
export async function toggleSchoolFeatured(tenantId, isFeatured) {
  const query = `
    UPDATE public.marketplace_school_profiles
    SET is_featured = $1, updated_at = NOW()
    WHERE tenant_id = $2
    RETURNING tenant_id, is_featured;
  `;
  const { rows } = await pgPool.query(query, [!!isFeatured, tenantId]);
  return rows[0] || null;
}

/**
 * Closed-Loop Lead Release: Transfer a paid/qualified lead to the school CRM ("newUsers")
 */
export async function transferLeadToSchoolCRM(leadId, adminNotes = null) {
  // 1. Fetch lead
  const leadRes = await pgPool.query(
    `SELECT * FROM public.marketplace_leads WHERE id = $1`,
    [leadId]
  );
  const lead = leadRes.rows[0];
  if (!lead) {
    throw new Error('Marketplace lead not found');
  }

  // 2. Insert into school's newUsers table
  const insertQuery = `
    INSERT INTO public."newUsers" (
      tenant_id, name, parent, phone, father_name, father_mobile,
      email, "parentEmail", status, referral_source, enquiry_remarks,
      academic_year, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, 'Enquiry', 'CKR Marketplace', $9,
      $10, NOW()
    )
    RETURNING id, name, status, created_at;
  `;
  const newStudentRes = await pgPool.query(insertQuery, [
    lead.tenant_id,
    lead.student_name || lead.parent_name + "'s Ward",
    lead.parent_name,
    lead.phone,
    lead.parent_name,
    lead.phone,
    lead.email || null,
    lead.email || null,
    lead.message ? `[Marketplace Enquiry]: ${lead.message}` : `Admissions lead captured via CKR Marketplace (${lead.lead_type})`,
    lead.academic_year || '2026-2027'
  ]);

  const newStudent = newStudentRes.rows[0];

  // 3. Mark lead as transferred
  const updateQuery = `
    UPDATE public.marketplace_leads
    SET 
      status = 'transferred',
      admin_notes = COALESCE(admin_notes || E'\n', '') || $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  const noteText = `[Released to School CRM ID #${newStudent.id} on ${new Date().toLocaleDateString('en-IN')}] ${adminNotes || ''}`;
  const updatedLeadRes = await pgPool.query(updateQuery, [noteText.trim(), leadId]);

  return {
    lead: updatedLeadRes.rows[0],
    transferred_to_school_admission_id: newStudent.id
  };
}

