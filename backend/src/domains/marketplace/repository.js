import { pgPool } from '../../config/db.js';
import { getCurrentAcademicYear } from '../../utils/academicYear.js';
import * as infoRepo from '../info/repository.js';

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
      mp.is_featured, mp.is_verified, mp.avg_rating, mp.review_count,
      mp.admission_status, mp.hero_image_url, mp.student_count_badge,
      mp.teacher_count_badge, mp.student_teacher_ratio,
      (SELECT g.image_url
       FROM school_gallery g
       WHERE g.tenant_id = t.id AND g.image_url IS NOT NULL
         AND COALESCE(g.media_type, 'image') <> 'video'
         AND COALESCE(g.is_marketplace_visible, TRUE) = TRUE
       ORDER BY g.display_order ASC, g.created_at DESC
       LIMIT 1) AS gallery_preview
    FROM tenants t
    INNER JOIN marketplace_school_profiles mp ON t.id = mp.tenant_id
    WHERE t.is_active = TRUE AND mp.is_published = TRUE
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
    WHERE LOWER(t.slug) = LOWER($1) AND t.is_active = TRUE AND mp.is_published = TRUE
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
      $6, $7, $8, FALSE, 'transferred', 0, 'Direct Admission Enquiry via Marketplace'
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
    data.academic_year || getCurrentAcademicYear(),
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
      $6, $7, 'Downloaded School Brochure / Prospectus PDF', FALSE, 'transferred', 0, 'Brochure download intent'
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
    data.academic_year || getCurrentAcademicYear()
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
        'transferred', 0, $10
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
      data.academic_year || getCurrentAcademicYear(),
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
      title, review_text, is_verified, helpful_count,
      school_reply, school_replied_at, created_at
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
      title, review_text, is_verified, is_approved, helpful_count,
      reviewer_account_id, reviewer_account_type, reviewer_school_id
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      $12, $13, $14, TRUE, 0,
      $15, $16, $17
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
    data.review_text,
    data.is_verified === true,
    data.reviewer_account_id || null,
    data.reviewer_account_type || null,
    data.reviewer_school_id || null
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

export async function findReviewByAccount(tenantId, accountId) {
  const { rows } = await pgPool.query(
    `SELECT id FROM marketplace_reviews WHERE tenant_id = $1 AND reviewer_account_id = $2 LIMIT 1;`,
    [tenantId, accountId]
  );
  return rows[0] || null;
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
      t.motto,
      t.website,
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
      mp.is_published,
      mp.published_at,
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
      tagline                = EXCLUDED.tagline,
      about                  = EXCLUDED.about,
      established_year       = EXCLUDED.established_year,
      min_fee                = EXCLUDED.min_fee,
      max_fee                = EXCLUDED.max_fee,
      fee_period             = EXCLUDED.fee_period,
      grades_offered         = EXCLUDED.grades_offered,
      facilities             = EXCLUDED.facilities,
      brochure_url           = EXCLUDED.brochure_url,
      admission_status       = EXCLUDED.admission_status,
      hero_image_url         = EXCLUDED.hero_image_url,
      student_count_badge    = EXCLUDED.student_count_badge,
      teacher_count_badge    = EXCLUDED.teacher_count_badge,
      student_teacher_ratio  = EXCLUDED.student_teacher_ratio,
      updated_at             = NOW()
    RETURNING *;
  `;

  const toNullableNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const toNullableText = (value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
  };

  const values = [
    tenantId,
    toNullableText(data.tagline),
    toNullableText(data.about),
    toNullableNumber(data.established_year),
    toNullableNumber(data.min_fee),
    toNullableNumber(data.max_fee),
    toNullableText(data.fee_period),
    toNullableText(data.grades_offered),
    data.facilities ? JSON.stringify(data.facilities) : null,
    toNullableText(data.brochure_url),
    toNullableText(data.admission_status),
    toNullableText(data.hero_image_url),
    toNullableText(data.student_count_badge),
    toNullableText(data.teacher_count_badge),
    toNullableText(data.student_teacher_ratio)
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

/**
 * Distinct real cities and boards that currently have a marketplace profile.
 */
export async function getMarketplaceFacets() {
  const [citiesRes, boardsRes] = await Promise.all([
    pgPool.query(`
      SELECT DISTINCT TRIM(t.city) AS city
      FROM tenants t
      INNER JOIN marketplace_school_profiles mp ON mp.tenant_id = t.id
      WHERE t.is_active = TRUE AND mp.is_published = TRUE
        AND t.city IS NOT NULL AND TRIM(t.city) <> ''
      ORDER BY city ASC;
    `),
    pgPool.query(`
      SELECT DISTINCT TRIM(t.affiliation_board) AS board
      FROM tenants t
      INNER JOIN marketplace_school_profiles mp ON mp.tenant_id = t.id
      WHERE t.is_active = TRUE AND mp.is_published = TRUE
        AND t.affiliation_board IS NOT NULL AND TRIM(t.affiliation_board) <> ''
      ORDER BY board ASC;
    `)
  ]);

  return {
    cities: citiesRes.rows.map(r => r.city),
    boards: boardsRes.rows.map(r => r.board)
  };
}

/**
 * Finds every active account (parent or user) owned by the supplied phone number
 * across all tenants. Password verification happens in the service layer.
 */
export async function findMarketplaceAccountsByPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return [];

  const query = `
    SELECT u.id, u.tenant_id, t.slug AS school_slug, t.name AS school_name,
           u.name, u.phone, u.email, u.password_hash, u.type AS account_type
    FROM public."user" u
    JOIN public.tenants t ON t.id = u.tenant_id
    WHERE t.is_active = TRUE
      AND u.status = 'active'
      AND u.password_hash IS NOT NULL
      AND u.type <> 'spoc'
      AND (RIGHT(REGEXP_REPLACE(COALESCE(u.phone, ''), '\\D', '', 'g'), 10) = $1
           OR LOWER(COALESCE(u.email, '')) = LOWER($2))
    UNION ALL
    SELECT p.id, p.tenant_id, t.slug AS school_slug, t.name AS school_name,
           TRIM(CONCAT_WS(' & ', NULLIF(p.father_name, ''), NULLIF(p.mother_name, ''))) AS name,
           p.phone, p.email,
           COALESCE(
             p.password_hash,
             (SELECT su.password_hash
              FROM public.student_parents sp
              JOIN public."user" su ON su.id = sp.student_id
              WHERE sp.parent_id = p.id AND sp.tenant_id = p.tenant_id AND su.status = 'active'
              LIMIT 1)
           ) AS password_hash,
           'parent' AS account_type
    FROM public.parents p
    JOIN public.tenants t ON t.id = p.tenant_id
    WHERE t.is_active = TRUE
      AND (RIGHT(REGEXP_REPLACE(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = $1
           OR RIGHT(REGEXP_REPLACE(COALESCE(p.alternate_number, ''), '\\D', '', 'g'), 10) = $1
           OR LOWER(COALESCE(p.email, '')) = LOWER($2));
  `;

  const { rows } = await pgPool.query(query, [digits, String(phone || '').trim()]);
  return rows.filter(r => !!r.password_hash);
}

/**
 * Community content the school already maintains in its portal:
 * gallery, achievements, spotlight/thoughts and social handles.
 */
export async function getSchoolCommunity(tenantId) {
  const [settings, gallery, champions, spotlight, thoughts, studentOfWeek] = await Promise.all([
    infoRepo.getSchoolSettings(tenantId),
    infoRepo.listGallery(tenantId),
    infoRepo.listChampions(tenantId),
    infoRepo.listSpotlights(tenantId),
    infoRepo.listThoughts(tenantId),
    infoRepo.getCurrentStudentOfWeek(tenantId)
  ]);

  const mediaItems = (gallery || [])
    .filter(g => (g.image_url || g.media_url) && g.is_marketplace_visible !== false)
    .map(g => ({
      id: g.id,
      title: g.title || null,
      description: g.description || null,
      url: g.image_url || g.media_url,
      media_type: g.media_type || (String(g.image_url || g.media_url).includes('youtu') ? 'video' : 'image'),
      category: 'Campus'
    }));

  return {
    gallery: mediaItems,
    videos: mediaItems.filter(g => g.media_type === 'video'),
    achievements: champions || [],
    studentOfWeek: studentOfWeek || null,
    spotlight: (spotlight || []).slice(0, 6),
    thoughts: (thoughts || []).slice(0, 6),
    social: {
      website: settings?.website_url || null,
      instagram: settings?.instagram_url || null,
      facebook: settings?.facebook_url || null,
      twitter: settings?.twitter_url || null,
      linkedin: settings?.linkedin_url || null,
      youtube: settings?.youtube_url || null,
      whatsapp: settings?.whatsapp_url || null
    }
  };
}

export async function getAccountIdentity(accountId) {
  if (!accountId) return null;

  const query = `
    SELECT u.id, u.tenant_id, u.name, u.phone, u.email, u.type AS account_type
    FROM public."user" u
    WHERE u.id = $1
    UNION ALL
    SELECT p.id, p.tenant_id,
           TRIM(CONCAT_WS(' & ', NULLIF(p.father_name, ''), NULLIF(p.mother_name, ''))) AS name,
           p.phone, p.email, 'parent' AS account_type
    FROM public.parents p
    WHERE p.id = $1
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [accountId]);
  return rows[0] || null;
}

/**
 * Details used to prefill the public inquiry forms for a signed-in account.
 * Parents get their own contact fields plus their linked children; students get
 * their own record so the form still comes pre-populated.
 */
export async function getMarketplaceProfileForPrefill(accountId, accountType) {
  if (!accountId) return null;

  if (accountType === 'parent') {
    const parentRes = await pgPool.query(
      `SELECT p.id, p.tenant_id, p.father_name, p.mother_name, p.phone, p.alternate_number, p.email
       FROM public.parents p
       WHERE p.id = $1
       LIMIT 1;`,
      [accountId]
    );
    const parent = parentRes.rows[0];
    if (!parent) return null;

    const childrenRes = await pgPool.query(
      `SELECT DISTINCT u.id, u.name, u.admission_number,
              c.name AS class_name, c.section AS class_section
       FROM public.student_parents sp
       JOIN public."user" u ON u.id = sp.student_id AND u.tenant_id = sp.tenant_id
       LEFT JOIN public.class_students cs ON cs.student_id = u.id AND cs.tenant_id = u.tenant_id
       LEFT JOIN public.class c ON c.id = cs.class_id AND c.tenant_id = u.tenant_id
       WHERE sp.parent_id = $1 AND sp.tenant_id = $2 AND u.status = 'active'
       ORDER BY u.name ASC;`,
      [parent.id, parent.tenant_id]
    );

    return {
      parentName: parent.father_name || parent.mother_name || '',
      fatherName: parent.father_name || '',
      motherName: parent.mother_name || '',
      phone: parent.phone || '',
      alternateNumber: parent.alternate_number || '',
      email: parent.email || '',
      children: childrenRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        admissionNumber: row.admission_number,
        className: row.class_name,
        classSection: row.class_section
      }))
    };
  }

  const studentRes = await pgPool.query(
    `SELECT u.id, u.tenant_id, u.name, u.phone, u.email, u.admission_number,
            c.name AS class_name, c.section AS class_section
     FROM public."user" u
     LEFT JOIN public.class_students cs ON cs.student_id = u.id AND cs.tenant_id = u.tenant_id
     LEFT JOIN public.class c ON c.id = cs.class_id AND c.tenant_id = u.tenant_id
     WHERE u.id = $1
     LIMIT 1;`,
    [accountId]
  );
  const student = studentRes.rows[0];
  if (!student) return null;

  return {
    parentName: '',
    fatherName: '',
    motherName: '',
    phone: student.phone || '',
    alternateNumber: '',
    email: student.email || '',
    children: [{
      id: student.id,
      name: student.name,
      admissionNumber: student.admission_number,
      className: student.class_name,
      classSection: student.class_section
    }]
  };
}
