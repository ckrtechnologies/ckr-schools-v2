import { pgPool } from '../../config/db.js';

/**
 * Marketplace Repository (ADO)
 * Centralized queries for Public Marketplace Portal & Super Admin Monetization Engine
 */

export async function listSchools({ board, city, minFee, maxFee, search }) {
  let query = `
    SELECT 
      t.id, t.slug, t.name, t.affiliation_board, t.city, t.state, t.pincode,
      t.logo_url, t.theme_color, t.motto,
      mp.tagline, mp.about, mp.established_year, mp.min_fee, mp.max_fee,
      mp.fee_period, mp.grades_offered, mp.facilities, mp.gallery_images,
      mp.is_featured, mp.avg_rating, mp.review_count,
      mp.admission_status, mp.hero_image_url, mp.student_count_badge,
      mp.teacher_count_badge, mp.student_teacher_ratio
    FROM tenants t
    INNER JOIN marketplace_school_profiles mp ON t.id = mp.tenant_id
    WHERE t.is_active = TRUE
  `;
  const values = [];
  let idx = 1;

  if (board) {
    query += ` AND LOWER(t.affiliation_board) = LOWER($${idx++})`;
    values.push(board);
  }
  if (city) {
    query += ` AND LOWER(t.city) ILIKE $${idx++}`;
    values.push(`%${city.trim()}%`);
  }
  if (minFee) {
    query += ` AND mp.max_fee >= $${idx++}`;
    values.push(Number(minFee));
  }
  if (maxFee) {
    query += ` AND mp.min_fee <= $${idx++}`;
    values.push(Number(maxFee));
  }
  if (search) {
    query += ` AND (t.name ILIKE $${idx} OR t.city ILIKE $${idx} OR mp.tagline ILIKE $${idx})`;
    values.push(`%${search.trim()}%`);
    idx++;
  }

  query += ` ORDER BY mp.is_featured DESC, mp.avg_rating DESC, t.name ASC`;

  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function getSchoolBySlug(slug) {
  const query = `
    SELECT 
      t.id, t.slug, t.name, t.affiliation_board, t.board_affiliation_number,
      t.school_code, t.official_email, t.official_phone, t.website,
      t.address, t.city, t.state, t.pincode, t.logo_url, t.theme_color, t.accent_color, t.motto,
      mp.tagline, mp.about, mp.established_year, mp.min_fee, mp.max_fee,
      mp.fee_period, mp.grades_offered, mp.facilities, mp.gallery_images, mp.brochure_url,
      mp.is_featured, mp.is_verified, mp.avg_rating, mp.review_count,
      mp.admission_status, mp.hero_image_url, mp.student_count_badge,
      mp.teacher_count_badge, mp.student_teacher_ratio
    FROM tenants t
    INNER JOIN marketplace_school_profiles mp ON t.id = mp.tenant_id
    WHERE LOWER(t.slug) = LOWER($1) AND t.is_active = TRUE
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [slug]);
  return rows[0] || null;
}

/**
 * Inserts admission enquiry into public.marketplace_leads (Super Admin Central Lead Engine)
 * Strictly does NOT leak into individual school CRM without monetization
 */
export async function createMarketplaceEnquiry(tenantId, data) {
  const query = `
    INSERT INTO public.marketplace_leads (
      tenant_id, lead_type, student_name, parent_name, phone, email,
      grade, academic_year, message, is_multi_enquiry, status, monetization_fee_paise, admin_notes
    ) VALUES (
      $1, 'enquiry', $2, $3, $4, $5,
      $6, $7, $8, FALSE, 'new', 50000, 'Direct Admission Enquiry via Marketplace'
    )
    RETURNING id, tenant_id, lead_type, student_name, parent_name, phone, email, grade, academic_year, status, created_at;
  `;
  const values = [
    tenantId,
    data.student_name || data.name,
    data.parent_name,
    data.phone,
    data.email || null,
    data.grade || data.class_name || 'N/A',
    data.academic_year || '2026-2027',
    data.message || 'Direct admission enquiry from school marketplace profile'
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

/**
 * Gated Brochure / Prospectus Download Lead
 */
export async function createBrochureDownloadLead(tenantId, data) {
  const query = `
    INSERT INTO public.marketplace_leads (
      tenant_id, lead_type, student_name, parent_name, phone, email,
      grade, academic_year, message, is_multi_enquiry, status, monetization_fee_paise, admin_notes
    ) VALUES (
      $1, 'brochure_download', $2, $3, $4, $5,
      $6, $7, 'Downloaded School Brochure / Prospectus PDF', FALSE, 'new', 35000, 'Brochure download intent'
    )
    RETURNING id, tenant_id, lead_type, student_name, parent_name, phone, email, grade, status, created_at;
  `;
  const values = [
    tenantId,
    data.student_name || data.parent_name,
    data.parent_name,
    data.phone,
    data.email || null,
    data.grade || 'N/A',
    data.academic_year || '2026-2027'
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

/**
 * 1-Click Multi-School Joint Enquiry
 * Creates a linked lead in public.marketplace_leads for every requested school
 */
export async function createMultiSchoolEnquiry(tenantList, data) {
  const insertedLeads = [];
  const tenantIds = tenantList.map(t => t.id);

  for (const tenant of tenantList) {
    const query = `
      INSERT INTO public.marketplace_leads (
        tenant_id, lead_type, student_name, parent_name, phone, email,
        grade, academic_year, message, compared_tenant_ids, is_multi_enquiry,
        status, monetization_fee_paise, admin_notes
      ) VALUES (
        $1, 'multi_enquiry', $2, $3, $4, $5,
        $6, $7, $8, $9, TRUE,
        'new', 50000, $10
      )
      RETURNING id, tenant_id, lead_type, student_name, parent_name, phone, email, grade, status, created_at;
    `;
    const values = [
      tenant.id,
      data.student_name || data.name,
      data.parent_name,
      data.phone,
      data.email || null,
      data.grade || 'N/A',
      data.academic_year || '2026-2027',
      data.message || '1-Click Multi-School enquiry submitted simultaneously',
      JSON.stringify(tenantIds),
      `Multi-school enquiry batch across: ${tenantList.map(t => t.name).join(', ')}`
    ];

    const { rows } = await pgPool.query(query, values);
    insertedLeads.push(rows[0]);
  }

  return insertedLeads;
}

export async function listSchoolReviews(tenantId) {
  const query = `
    SELECT 
      id, reviewer_name, relationship, overall_rating,
      academics_rating, infrastructure_rating, faculty_rating, safety_rating, value_for_money_rating,
      title, review_text, is_verified, helpful_count, created_at
    FROM marketplace_reviews
    WHERE tenant_id = $1 AND is_approved = TRUE
    ORDER BY helpful_count DESC, created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function createSchoolReview(tenantId, data) {
  const query = `
    INSERT INTO marketplace_reviews (
      tenant_id, reviewer_name, reviewer_email, reviewer_phone, relationship,
      overall_rating, academics_rating, infrastructure_rating, faculty_rating, safety_rating, value_for_money_rating,
      title, review_text, is_verified, is_approved, helpful_count
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      $12, $13, TRUE, TRUE, 0
    )
    RETURNING id, reviewer_name, overall_rating, title, review_text, is_verified, helpful_count, created_at;
  `;
  const values = [
    tenantId,
    data.reviewer_name,
    data.reviewer_email || null,
    data.reviewer_phone || null,
    data.relationship || 'Parent',
    data.overall_rating,
    data.academics_rating || data.overall_rating,
    data.infrastructure_rating || data.overall_rating,
    data.faculty_rating || data.overall_rating,
    data.safety_rating || data.overall_rating,
    data.value_for_money_rating || data.overall_rating,
    data.title || null,
    data.review_text
  ];

  const { rows } = await pgPool.query(query, values);

  // Recalculate average rating & review count for the school
  await pgPool.query(`
    UPDATE marketplace_school_profiles
    SET 
      avg_rating = (
        SELECT ROUND(AVG(overall_rating), 2)
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      ),
      review_count = (
        SELECT COUNT(*)::int
        FROM marketplace_reviews
        WHERE tenant_id = $1 AND is_approved = TRUE
      )
    WHERE tenant_id = $1;
  `, [tenantId]);

  return rows[0];
}

export async function upvoteReviewHelpful(reviewId) {
  const query = `
    UPDATE public.marketplace_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = $1
    RETURNING id, helpful_count;
  `;
  const { rows } = await pgPool.query(query, [reviewId]);
  return rows[0] || null;
}

export async function listPressReleases(tenantId) {
  const query = `
    SELECT 
      id, tenant_id, title, summary, content_html, featured_image_url,
      category, published_date, created_at
    FROM public.marketplace_press_releases
    WHERE tenant_id = $1 AND is_published = TRUE
    ORDER BY published_date DESC, created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

/**
 * Get tenant's own marketplace profile (for School Admin self-service)
 */
export async function getSchoolMarketplaceProfile(tenantId) {
  const query = `
    SELECT 
      t.id as tenant_id,
      t.name,
      t.slug,
      t.logo_url,
      t.city,
      t.address,
      t.official_phone as phone,
      t.official_email as email,
      t.affiliation_board,
      mp.id as profile_id,
      mp.tagline,
      mp.about,
      mp.established_year,
      mp.min_fee,
      mp.max_fee,
      mp.fee_period,
      mp.grades_offered,
      mp.facilities,
      mp.gallery_images,
      mp.brochure_url,
      mp.admission_status,
      mp.hero_image_url,
      mp.student_count_badge,
      mp.teacher_count_badge,
      mp.student_teacher_ratio,
      mp.is_featured,
      mp.is_verified,
      mp.avg_rating,
      mp.review_count,
      mp.updated_at
    FROM tenants t
    LEFT JOIN marketplace_school_profiles mp ON t.id = mp.tenant_id
    WHERE t.id = $1;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows[0] || null;
}

/**
 * Update tenant's own marketplace profile (School Admin self-service)
 */
export async function updateSchoolMarketplaceProfile(tenantId, data) {
  const query = `
    INSERT INTO marketplace_school_profiles (
      tenant_id, tagline, about, established_year, min_fee, max_fee,
      fee_period, grades_offered, facilities, brochure_url,
      admission_status, hero_image_url, student_count_badge,
      teacher_count_badge, student_teacher_ratio, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13,
      $14, $15, NOW()
    )
    ON CONFLICT (tenant_id)
    DO UPDATE SET
      tagline                = COALESCE(EXCLUDED.tagline, marketplace_school_profiles.tagline),
      about                  = COALESCE(EXCLUDED.about, marketplace_school_profiles.about),
      established_year       = COALESCE(EXCLUDED.established_year, marketplace_school_profiles.established_year),
      min_fee                = COALESCE(EXCLUDED.min_fee, marketplace_school_profiles.min_fee),
      max_fee                = COALESCE(EXCLUDED.max_fee, marketplace_school_profiles.max_fee),
      fee_period             = COALESCE(EXCLUDED.fee_period, marketplace_school_profiles.fee_period),
      grades_offered         = COALESCE(EXCLUDED.grades_offered, marketplace_school_profiles.grades_offered),
      facilities             = COALESCE(EXCLUDED.facilities, marketplace_school_profiles.facilities),
      brochure_url           = COALESCE(EXCLUDED.brochure_url, marketplace_school_profiles.brochure_url),
      admission_status       = COALESCE(EXCLUDED.admission_status, marketplace_school_profiles.admission_status),
      hero_image_url         = COALESCE(EXCLUDED.hero_image_url, marketplace_school_profiles.hero_image_url),
      student_count_badge    = COALESCE(EXCLUDED.student_count_badge, marketplace_school_profiles.student_count_badge),
      teacher_count_badge    = COALESCE(EXCLUDED.teacher_count_badge, marketplace_school_profiles.teacher_count_badge),
      student_teacher_ratio  = COALESCE(EXCLUDED.student_teacher_ratio, marketplace_school_profiles.student_teacher_ratio),
      updated_at             = NOW()
    RETURNING *;
  `;

  const values = [
    tenantId,
    data.tagline !== undefined ? data.tagline : null,
    data.about !== undefined ? data.about : null,
    data.established_year !== undefined ? data.established_year : null,
    data.min_fee !== undefined ? data.min_fee : null,
    data.max_fee !== undefined ? data.max_fee : null,
    data.fee_period || 'per annum',
    data.grades_offered || 'Nursery - 12th',
    data.facilities ? JSON.stringify(data.facilities) : null,
    data.brochure_url !== undefined ? data.brochure_url : null,
    data.admission_status || 'Admissions Open (2026-27)',
    data.hero_image_url !== undefined ? data.hero_image_url : null,
    data.student_count_badge || '1,000+ Students',
    data.teacher_count_badge || '50+ Certified Faculty',
    data.student_teacher_ratio || '20:1'
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
}
