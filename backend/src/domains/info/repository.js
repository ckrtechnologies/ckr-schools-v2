import { pgPool } from '../../config/db.js';

/**
 * School Settings, Social Handles & Community Highlights Repository (ADO)
 */

// ============================================================================
// 1. SETTINGS & SOCIAL HANDLES
// ============================================================================

export async function getSchoolSettings(tenantId) {
  const query = `
    SELECT * FROM school_settings
    WHERE tenant_id = $1
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows[0] || null;
}

export async function upsertSchoolSettings(tenantId, data) {
  const query = `
    INSERT INTO school_settings (
      tenant_id, instagram_url, whatsapp_url, linkedin_url,
      twitter_url, facebook_url, youtube_url, website_url, late_fee_penalty, updated_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8, $9, NOW()
    )
    ON CONFLICT (tenant_id)
    DO UPDATE SET 
      instagram_url = EXCLUDED.instagram_url,
      whatsapp_url = EXCLUDED.whatsapp_url,
      linkedin_url = EXCLUDED.linkedin_url,
      twitter_url = EXCLUDED.twitter_url,
      facebook_url = EXCLUDED.facebook_url,
      youtube_url = EXCLUDED.youtube_url,
      website_url = EXCLUDED.website_url,
      late_fee_penalty = EXCLUDED.late_fee_penalty,
      updated_at = NOW()
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.instagram_url || null,
    data.whatsapp_url || null,
    data.linkedin_url || null,
    data.twitter_url || null,
    data.facebook_url || null,
    data.youtube_url || null,
    data.website_url || null,
    data.late_fee_penalty !== undefined && data.late_fee_penalty !== null ? Number(data.late_fee_penalty) : 0
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

// ============================================================================
// 2. SPOTLIGHT OF THE DAY & THOUGHT OF THE DAY
// ============================================================================

export async function getSpotlight(tenantId, date) {
  const query = `
    SELECT * FROM spotlight_of_the_day
    WHERE tenant_id = $1 AND date = $2::date
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, date]);
  return rows[0] || null;
}

export async function createSpotlight(tenantId, data) {
  const query = `
    INSERT INTO spotlight_of_the_day (tenant_id, date, title, description, image_url)
    VALUES ($1, $2::date, $3, $4, $5)
    RETURNING *;
  `;
  const values = [tenantId, data.date, data.title, data.description, data.image_url || null];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function listSpotlights(tenantId) {
  const query = `
    SELECT * FROM spotlight_of_the_day
    WHERE tenant_id = $1
    ORDER BY date DESC, created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function updateSpotlight(tenantId, id, data) {
  const query = `
    UPDATE spotlight_of_the_day
    SET date = COALESCE($3::date, date),
        title = COALESCE($4, title),
        description = COALESCE($5, description),
        image_url = COALESCE($6, image_url)
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const values = [tenantId, id, data.date, data.title, data.description, data.image_url];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteSpotlight(tenantId, id) {
  const query = `DELETE FROM spotlight_of_the_day WHERE tenant_id = $1 AND id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [tenantId, id]);
  return rows[0] || null;
}

export async function getThought(tenantId, date) {
  const query = `
    SELECT * FROM thought_of_the_day
    WHERE tenant_id = $1 AND date = $2::date
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, date]);
  return rows[0] || null;
}

export async function listThoughts(tenantId) {
  const query = `
    SELECT * FROM thought_of_the_day
    WHERE tenant_id = $1
    ORDER BY date DESC, created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function updateThought(tenantId, id, data) {
  const query = `
    UPDATE thought_of_the_day
    SET date = COALESCE($3::date, date),
        thought = COALESCE($4, thought),
        author = COALESCE($5, author)
    WHERE tenant_id = $1 AND id = $2
    RETURNING *;
  `;
  const values = [tenantId, id, data.date, data.thought, data.author];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteThought(tenantId, id) {
  const query = `DELETE FROM thought_of_the_day WHERE tenant_id = $1 AND id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [tenantId, id]);
  return rows[0] || null;
}

export async function createThought(tenantId, data) {
  const query = `
    INSERT INTO thought_of_the_day (tenant_id, date, thought, author)
    VALUES ($1, $2::date, $3, $4)
    RETURNING *;
  `;
  const values = [tenantId, data.date, data.thought, data.author || null];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

// ============================================================================
// 3. CHAMPIONS, GALLERY & NEWSLETTERS
// ============================================================================

export async function listChampions(tenantId) {
  const query = `
    SELECT sc.id, sc.game_name, sc.achievement_level, sc.marks_score, sc.created_at,
           u.name as student_name, u.avatar_url
    FROM school_champions sc
    LEFT JOIN "user" u ON sc.student_id = u.id AND u.tenant_id = sc.tenant_id
    WHERE sc.tenant_id = $1
    ORDER BY sc.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function createChampion(tenantId, data) {
  const query = `
    INSERT INTO school_champions (tenant_id, student_id, game_name, achievement_level, marks_score)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [tenantId, data.student_id || null, data.game_name, data.achievement_level || 'State Level', data.marks_score || null];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteChampion(tenantId, championId) {
  const query = `DELETE FROM school_champions WHERE id = $1 AND tenant_id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [championId, tenantId]);
  return rows[0] || null;
}

export async function listGallery(tenantId) {
  const query = `
    SELECT id, tenant_id, title, image_url, image_url AS media_url, description, media_type,
           is_marketplace_visible, display_order, created_at
    FROM school_gallery
    WHERE tenant_id = $1
    ORDER BY display_order ASC, created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function createGalleryImage(tenantId, data) {
  const query = `
    INSERT INTO school_gallery (tenant_id, title, image_url, description, media_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const mediaUrl = data.image_url || data.media_url;
  const values = [tenantId, data.title, mediaUrl, data.description || null, data.media_type || 'image'];
  const { rows } = await pgPool.query(query, values);
  const row = rows[0];
  if (row) row.media_url = row.image_url;
  return row;
}

export async function deleteGalleryImage(tenantId, imageId) {
  const query = `DELETE FROM school_gallery WHERE id = $1 AND tenant_id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [imageId, tenantId]);
  return rows[0] || null;
}

export async function listNewsletters(tenantId) {
  const query = `
    SELECT * FROM school_newsletters
    WHERE tenant_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

export async function createNewsletter(tenantId, data) {
  const query = `
    INSERT INTO school_newsletters (tenant_id, document_url)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, data.document_url]);
  return rows[0];
}

export async function deleteNewsletter(tenantId, newsletterId) {
  const query = `DELETE FROM school_newsletters WHERE id = $1 AND tenant_id = $2 RETURNING id;`;
  const { rows } = await pgPool.query(query, [newsletterId, tenantId]);
  return rows[0] || null;
}

// ============================================================================
// 5. SCHOOL TENANT PROFILE & BRANDING
// ============================================================================

export async function getTenantProfile(tenantId) {
  const query = `
    SELECT id, slug, name, affiliation_board, board_affiliation_number, school_code,
           official_email, official_phone, website, address, city, state, pincode,
           motto, logo_url, theme_color, accent_color, plan_tier, is_active, created_at, updated_at
    FROM public.tenants
    WHERE id = $1
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows[0] || null;
}

export async function updateTenantProfile(tenantId, data) {
  const query = `
    UPDATE public.tenants
    SET name = COALESCE($1, name),
        motto = COALESCE($2, motto),
        logo_url = COALESCE($3, logo_url),
        theme_color = COALESCE($4, theme_color),
        accent_color = COALESCE($5, accent_color),
        affiliation_board = COALESCE($6, affiliation_board),
        board_affiliation_number = COALESCE($7, board_affiliation_number),
        school_code = COALESCE($8, school_code),
        official_email = COALESCE($9, official_email),
        official_phone = COALESCE($10, official_phone),
        website = COALESCE($11, website),
        address = COALESCE($12, address),
        city = COALESCE($13, city),
        state = COALESCE($14, state),
        pincode = COALESCE($15, pincode),
        updated_at = NOW()
    WHERE id = $16
    RETURNING id, slug, name, affiliation_board, board_affiliation_number, school_code,
              official_email, official_phone, website, address, city, state, pincode,
              motto, logo_url, theme_color, accent_color, plan_tier, is_active, created_at, updated_at;
  `;
  const values = [
    data.name || null,
    data.motto || null,
    data.logo_url || data.logoUrl || null,
    data.theme_color || data.themeColor || null,
    data.accent_color || data.accentColor || null,
    data.affiliation_board || data.affiliationBoard || null,
    data.board_affiliation_number || data.boardAffiliationNumber || null,
    data.school_code || data.schoolCode || null,
    data.official_email || data.officialEmail || null,
    data.official_phone || data.officialPhone || null,
    data.website || null,
    data.address || null,
    data.city || null,
    data.state || null,
    data.pincode || null,
    tenantId
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
}


/**
 * Current student of the week (latest published week) for public marketplace use.
 */
export async function getCurrentStudentOfWeek(tenantId) {
  const query = `
    SELECT sow.id, sow.reason, sow.week_start_date, sow.week_end_date,
           u.name AS student_name, u.avatar_url
    FROM public.student_of_the_week sow
    LEFT JOIN public."user" u ON sow.student_id = u.id AND u.tenant_id = sow.tenant_id
    WHERE sow.tenant_id = $1
    ORDER BY sow.week_start_date DESC, sow.created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows[0] || null;
}
