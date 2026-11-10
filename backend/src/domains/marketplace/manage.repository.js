import { pgPool } from '../../config/db.js';

/**
 * School SPOC (public-domain) repository.
 * Every query is hard-scoped by tenant_id — a SPOC can only ever see its own school.
 */

const toNullableText = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function getTenantHeader(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT
        t.id, t.name, t.slug, t.logo_url, t.city, t.address,
        t.official_phone AS phone, t.official_email AS email,
        t.affiliation_board, t.board_affiliation_number, t.website,
        t.is_active,
        COALESCE(mp.is_published, FALSE) AS is_published,
        mp.published_at,
        mp.avg_rating,
        mp.review_count
     FROM public.tenants t
     LEFT JOIN public.marketplace_school_profiles mp ON mp.tenant_id = t.id
     WHERE t.id = $1
     LIMIT 1;`,
    [tenantId]
  );
  return rows[0] || null;
}

export async function getOverviewCounters(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE) AS reviews_total,
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE AND is_verified = TRUE) AS reviews_verified,
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE AND school_reply IS NOT NULL) AS reviews_replied,
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE AND school_reply IS NULL) AS reviews_pending_reply,
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_reported = TRUE) AS reviews_reported,
        (SELECT COUNT(*)::int FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = FALSE) AS reviews_hidden,
        (SELECT COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)
           FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE) AS avg_rating,
        (SELECT COUNT(*)::int FROM public.school_gallery
          WHERE tenant_id = $1) AS gallery_total,
        (SELECT COUNT(*)::int FROM public.school_gallery
          WHERE tenant_id = $1 AND is_marketplace_visible = TRUE) AS gallery_published,
        (SELECT COUNT(*)::int FROM public.marketplace_press_releases
          WHERE tenant_id = $1) AS press_total,
        (SELECT COUNT(*)::int FROM public.marketplace_press_releases
          WHERE tenant_id = $1 AND is_published = TRUE) AS press_published,
        (SELECT COUNT(*)::int FROM public.marketplace_leads
          WHERE tenant_id = $1 AND status = 'transferred') AS leads_total,
        (SELECT COUNT(*)::int FROM public.marketplace_leads
          WHERE tenant_id = $1 AND status = 'transferred'
            AND created_at >= NOW() - INTERVAL '30 days') AS leads_last_30_days;`,
    [tenantId]
  );
  return rows[0];
}

export async function setProfilePublished(tenantId, isPublished, userId) {
  const { rows } = await pgPool.query(
    `INSERT INTO public.marketplace_school_profiles (tenant_id, is_published, published_at, published_by, updated_at)
     VALUES ($1, $2, CASE WHEN $2 THEN NOW() ELSE NULL END, $3, NOW())
     ON CONFLICT (tenant_id)
     DO UPDATE SET
        is_published = EXCLUDED.is_published,
        published_at = CASE WHEN EXCLUDED.is_published THEN NOW() ELSE NULL END,
        published_by = EXCLUDED.published_by,
        updated_at   = NOW()
     RETURNING tenant_id, is_published, published_at;`,
    [tenantId, isPublished, userId || null]
  );
  return rows[0];
}

export async function listSchoolReviews(tenantId, filters) {
  const { status, rating, search, page, limit } = filters;
  const values = [tenantId];
  let idx = 2;
  let where = 'WHERE tenant_id = $1';

  if (status === 'pending_reply') where += ' AND is_approved = TRUE AND school_reply IS NULL';
  if (status === 'replied') where += ' AND school_reply IS NOT NULL';
  if (status === 'reported') where += ' AND is_reported = TRUE';
  if (status === 'verified') where += ' AND is_verified = TRUE AND is_approved = TRUE';
  if (status === 'low_rating') where += ' AND overall_rating <= 2 AND is_approved = TRUE';
  if (status === 'hidden') where += ' AND is_approved = FALSE';

  if (rating) {
    where += ` AND overall_rating = $${idx++}`;
    values.push(rating);
  }
  if (search) {
    where += ` AND (reviewer_name ILIKE $${idx} OR title ILIKE $${idx} OR review_text ILIKE $${idx})`;
    values.push(`%${search}%`);
    idx++;
  }

  const countRes = await pgPool.query(`SELECT COUNT(*)::int AS total FROM public.marketplace_reviews ${where};`, values);
  const total = countRes.rows[0]?.total || 0;

  const offset = (page - 1) * limit;
  const { rows } = await pgPool.query(
    `SELECT
        id, reviewer_name, relationship, overall_rating,
        academics_rating, infrastructure_rating, faculty_rating, safety_rating, value_for_money_rating,
        title, review_text, is_verified, is_approved, helpful_count,
        school_reply, school_replied_at, is_reported, report_reason, reported_at,
        created_at
     FROM public.marketplace_reviews
     ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1};`,
    [...values, limit, offset]
  );

  return { reviews: rows, total, page, limit };
}

export async function findSchoolReview(tenantId, reviewId) {
  const { rows } = await pgPool.query(
    `SELECT id, is_approved, school_reply FROM public.marketplace_reviews
     WHERE id = $1 AND tenant_id = $2 LIMIT 1;`,
    [reviewId, tenantId]
  );
  return rows[0] || null;
}

export async function saveReviewReply(tenantId, reviewId, reply, userId) {
  const { rows } = await pgPool.query(
    `UPDATE public.marketplace_reviews
        SET school_reply = $3,
            school_replied_at = NOW(),
            school_replied_by = $4,
            updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, school_reply, school_replied_at;`,
    [reviewId, tenantId, reply, userId || null]
  );
  return rows[0] || null;
}

export async function clearReviewReply(tenantId, reviewId) {
  const { rows } = await pgPool.query(
    `UPDATE public.marketplace_reviews
        SET school_reply = NULL,
            school_replied_at = NULL,
            school_replied_by = NULL,
            updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;`,
    [reviewId, tenantId]
  );
  return rows[0] || null;
}

export async function setReviewReport(tenantId, reviewId, reported, reason) {
  const { rows } = await pgPool.query(
    `UPDATE public.marketplace_reviews
        SET is_reported = $3,
            report_reason = CASE WHEN $3 THEN $4 ELSE NULL END,
            reported_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
            updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, is_reported, report_reason, reported_at;`,
    [reviewId, tenantId, reported, toNullableText(reason)]
  );
  return rows[0] || null;
}

export async function listGallery(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT id, title, description, image_url, media_type, is_marketplace_visible, display_order, created_at
     FROM public.school_gallery
     WHERE tenant_id = $1
     ORDER BY display_order ASC, created_at DESC;`,
    [tenantId]
  );
  return rows;
}

export async function updateGalleryItem(tenantId, itemId, updates) {
  const sets = [];
  const values = [tenantId, itemId];
  let idx = 3;

  if (updates.is_marketplace_visible !== undefined) {
    sets.push(`is_marketplace_visible = $${idx++}`);
    values.push(updates.is_marketplace_visible);
  }
  if (updates.title !== undefined) {
    sets.push(`title = $${idx++}`);
    values.push(toNullableText(updates.title));
  }
  if (updates.description !== undefined) {
    sets.push(`description = $${idx++}`);
    values.push(toNullableText(updates.description));
  }
  if (updates.media_url !== undefined) {
    sets.push(`image_url = $${idx++}`);
    values.push(toNullableText(updates.media_url));
  }
  if (updates.media_type !== undefined) {
    sets.push(`media_type = $${idx++}`);
    values.push(updates.media_type);
  }
  if (updates.display_order !== undefined) {
    sets.push(`display_order = $${idx++}`);
    values.push(updates.display_order);
  }

  if (sets.length === 0) return null;

  const { rows } = await pgPool.query(
    `UPDATE public.school_gallery
        SET ${sets.join(', ')}
      WHERE id = $2 AND tenant_id = $1
      RETURNING id, title, description, image_url, media_type, is_marketplace_visible, display_order;`,
    values
  );
  return rows[0] || null;
}

export async function listPressReleases(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT id, title, summary, content_html, featured_image_url, category,
            published_date, is_published, source_circular_id, created_at, updated_at
     FROM public.marketplace_press_releases
     WHERE tenant_id = $1
     ORDER BY published_date DESC, created_at DESC;`,
    [tenantId]
  );
  return rows;
}

export async function createPressRelease(tenantId, data, userId) {
  const { rows } = await pgPool.query(
    `INSERT INTO public.marketplace_press_releases (
        tenant_id, title, summary, content_html, featured_image_url,
        category, published_date, is_published, created_by
     ) VALUES (
        $1, $2, $3, $4, $5,
        $6, COALESCE($7::date, CURRENT_DATE), $8, $9
     )
     RETURNING *;`,
    [
      tenantId,
      data.title,
      toNullableText(data.summary),
      data.content_html,
      toNullableText(data.featured_image_url),
      data.category || 'General',
      toNullableText(data.published_date),
      data.is_published !== false,
      userId || null
    ]
  );
  return rows[0];
}

export async function updatePressRelease(tenantId, pressId, updates) {
  const sets = [];
  const values = [tenantId, pressId];
  let idx = 3;

  const pushSet = (column, value) => {
    sets.push(`${column} = $${idx++}`);
    values.push(value);
  };

  if (updates.title !== undefined) pushSet('title', updates.title);
  if (updates.summary !== undefined) pushSet('summary', toNullableText(updates.summary));
  if (updates.content_html !== undefined) pushSet('content_html', updates.content_html);
  if (updates.featured_image_url !== undefined) pushSet('featured_image_url', toNullableText(updates.featured_image_url));
  if (updates.category !== undefined) pushSet('category', updates.category);
  if (updates.published_date !== undefined) pushSet('published_date', toNullableText(updates.published_date));
  if (updates.is_published !== undefined) pushSet('is_published', updates.is_published);

  if (sets.length === 0) return null;

  sets.push('updated_at = NOW()');

  const { rows } = await pgPool.query(
    `UPDATE public.marketplace_press_releases
        SET ${sets.join(', ')}
      WHERE id = $2 AND tenant_id = $1
      RETURNING *;`,
    values
  );
  return rows[0] || null;
}

export async function deletePressRelease(tenantId, pressId) {
  const { rows } = await pgPool.query(
    `DELETE FROM public.marketplace_press_releases
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;`,
    [pressId, tenantId]
  );
  return rows[0] || null;
}

/**
 * Only leads CKR has already released to this school are visible to SPOC.
 * Internal BD notes and monetization fees are never exposed.
 */
export async function listTransferredLeads(tenantId, filters) {
  const { page, limit, search } = filters;
  const values = [tenantId];
  let where = `WHERE tenant_id = $1 AND status = 'transferred'`;
  let idx = 2;

  if (search) {
    where += ` AND (parent_name ILIKE $${idx} OR student_name ILIKE $${idx} OR phone ILIKE $${idx} OR email ILIKE $${idx})`;
    values.push(`%${search}%`);
    idx++;
  }

  const countRes = await pgPool.query(
    `SELECT COUNT(*)::int AS total FROM public.marketplace_leads ${where};`,
    values
  );
  const total = countRes.rows[0]?.total || 0;

  const offset = (page - 1) * limit;
  const { rows } = await pgPool.query(
    `SELECT id, lead_type, student_name, parent_name, phone, email,
            grade, academic_year, message, created_at, updated_at
     FROM public.marketplace_leads
     ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1};`,
    [...values, limit, offset]
  );

  return { leads: rows, total, page, limit };
}

export async function getLeadTypeCounters(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT lead_type, COUNT(*)::int AS total
     FROM public.marketplace_leads
     WHERE tenant_id = $1 AND status = 'transferred'
     GROUP BY lead_type;`,
    [tenantId]
  );
  return rows;
}

/**
 * Real school records used to pre-fill an empty marketplace profile.
 * Nothing is invented — every value comes from the school's own data.
 */
export async function getPrefillSources(tenantId) {
  const [counts, classes, fees, gallery] = await Promise.all([
    pgPool.query(
      `SELECT
          (SELECT COUNT(*)::int FROM public."user"
            WHERE tenant_id = $1 AND type = 'student' AND COALESCE(leave_school, FALSE) = FALSE) AS students,
          (SELECT COUNT(*)::int FROM public."user"
            WHERE tenant_id = $1 AND type = 'teacher' AND status = 'active') AS teachers;`,
      [tenantId]
    ),
    pgPool.query(`SELECT DISTINCT name FROM public.class WHERE tenant_id = $1 ORDER BY name ASC;`, [tenantId]),
    pgPool.query(
      `SELECT MIN(monthly_fee)::numeric AS min_fee, MAX(monthly_fee)::numeric AS max_fee
         FROM public."user"
        WHERE tenant_id = $1 AND type = 'student'
          AND COALESCE(leave_school, FALSE) = FALSE AND COALESCE(monthly_fee, 0) > 0;`,
      [tenantId]
    ),
    pgPool.query(
      `SELECT image_url
         FROM public.school_gallery
        WHERE tenant_id = $1 AND image_url IS NOT NULL
          AND COALESCE(media_type, 'image') <> 'video'
          AND COALESCE(is_marketplace_visible, TRUE) = TRUE
        ORDER BY display_order ASC, created_at DESC
        LIMIT 1;`,
      [tenantId]
    )
  ]);

  return {
    students: counts.rows[0]?.students || 0,
    teachers: counts.rows[0]?.teachers || 0,
    classNames: classes.rows.map((row) => row.name).filter(Boolean),
    minFee: fees.rows[0]?.min_fee,
    maxFee: fees.rows[0]?.max_fee,
    coverImage: gallery.rows[0]?.image_url || null
  };
}

export async function createGalleryItem(tenantId, data) {
  const { rows } = await pgPool.query(
    `INSERT INTO public.school_gallery
        (tenant_id, title, image_url, description, media_type, is_marketplace_visible, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, image_url, media_type, is_marketplace_visible, display_order, created_at;`,
    [
      tenantId,
      toNullableText(data.title),
      data.media_url,
      toNullableText(data.description),
      data.media_type || 'image',
      data.is_marketplace_visible !== false,
      toNullableNumber(data.display_order) || 0
    ]
  );
  return rows[0];
}

export async function deleteGalleryItem(tenantId, itemId) {
  const { rows } = await pgPool.query(
    `DELETE FROM public.school_gallery
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, image_url, media_type;`,
    [itemId, tenantId]
  );
  return rows[0] || null;
}
