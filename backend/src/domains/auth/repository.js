import { pgPool } from '../../config/db.js';

export async function findUserByEmail(tenantId, identifier) {
  const cleanPhone = (identifier || '').replace(/\D/g, '').slice(-10);

  if (tenantId) {
    // 1. Check "user" table by email, phone, or admission_number
    const query = `
      SELECT u.id, u.tenant_id, u.name, u.email, u.phone, u.admission_number, u.password_hash, u.type, u.status, u.avatar_url,
             u.can_view_revenue,
             t.name as school_name, t.slug as school_slug, t.theme_color, t.logo_url, t.plan_tier,
             t.affiliation_board, t.board_affiliation_number, t.school_code,
             t.official_email as school_email, t.official_phone as school_phone,
             t.website as school_website, t.address as school_address,
             t.city as school_city, t.state as school_state, t.pincode as school_pincode,
             t.motto as school_motto
      FROM "user" u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.tenant_id = $1 
        AND (
          LOWER(u.email) = LOWER($2)
          OR u.phone = $2
          OR (length($3) >= 10 AND RIGHT(REPLACE(u.phone, ' ', ''), 10) = $3)
          OR u.admission_number = $2
        )
        AND u.status = 'active'
      LIMIT 1;
    `;
    const { rows } = await pgPool.query(query, [tenantId, identifier, cleanPhone]);
    if (rows[0]) return rows[0];

    // 2. Check parents table by phone
    if (cleanPhone.length >= 10) {
      const parentQuery = `
        SELECT p.id as parent_id, p.father_name, p.mother_name, p.phone, p.password_hash, p.email,
               t.id as tenant_id, t.name as school_name, t.slug as school_slug,
               t.theme_color, t.logo_url, t.plan_tier,
               t.affiliation_board, t.board_affiliation_number, t.school_code,
               t.official_email as school_email, t.official_phone as school_phone,
               t.website as school_website, t.address as school_address,
               t.city as school_city, t.state as school_state, t.pincode as school_pincode,
               t.motto as school_motto
        FROM parents p
        JOIN tenants t ON p.tenant_id = t.id
        WHERE p.tenant_id = $1
          AND (
            p.phone = $2
            OR RIGHT(REPLACE(p.phone, ' ', ''), 10) = $3
            OR p.alternate_number = $2
            OR RIGHT(REPLACE(p.alternate_number, ' ', ''), 10) = $3
            OR (p.email IS NOT NULL AND LOWER(p.email) = LOWER($2))
          )
        LIMIT 1;
      `;
      const parentRes = await pgPool.query(parentQuery, [tenantId, identifier, cleanPhone]);
      if (parentRes.rows[0]) {
        const p = parentRes.rows[0];
        // Find linked active student for fallback password hash
        const studentRes = await pgPool.query(
          `SELECT u.id, u.name, u.email, u.phone, u.password_hash, u.status
           FROM student_parents sp
           JOIN "user" u ON sp.student_id = u.id
           WHERE sp.parent_id = $1 AND sp.tenant_id = $2 AND u.status = 'active'
           LIMIT 1;`,
          [p.parent_id, tenantId]
        );
        const linkedStudent = studentRes.rows[0];
        return {
          id: p.parent_id,
          tenant_id: p.tenant_id,
          name: p.father_name ? `${p.father_name}${p.mother_name ? ' & ' + p.mother_name : ''}` : (p.mother_name || 'Parent'),
          email: p.email || `${cleanPhone}@parent.school`,
          phone: p.phone,
          password_hash: p.password_hash || linkedStudent?.password_hash || '$2b$10$RUedWn2Jrw7.IghUU7R81ecinIgWE/m6EZNXNUL.stjRptG1WlbWa',
          type: 'parent',
          status: 'active',
          avatar_url: null,
          can_view_revenue: false,
          school_name: p.school_name,
          school_slug: p.school_slug,
          theme_color: p.theme_color,
          logo_url: p.logo_url,
          plan_tier: p.plan_tier,
          affiliation_board: p.affiliation_board,
          board_affiliation_number: p.board_affiliation_number,
          school_code: p.school_code,
          school_email: p.school_email,
          school_phone: p.school_phone,
          school_website: p.school_website,
          school_address: p.school_address,
          school_city: p.school_city,
          school_state: p.school_state,
          school_pincode: p.school_pincode,
          school_motto: p.school_motto
        };
      }
    }

    // Strict tenant isolation: user does not belong to this school tenant
    return null;
  }

  // Fallback: Global lookup across all tenants or superadmin (only when tenantId is not specified)
  const globalQuery = `
    SELECT u.id, u.tenant_id, u.name, u.email, u.phone, u.admission_number, u.password_hash, u.type, u.status, u.avatar_url,
           u.can_view_revenue,
           t.name as school_name, t.slug as school_slug, t.theme_color, t.logo_url, t.plan_tier,
           t.affiliation_board, t.board_affiliation_number, t.school_code,
           t.official_email as school_email, t.official_phone as school_phone,
           t.website as school_website, t.address as school_address,
           t.city as school_city, t.state as school_state, t.pincode as school_pincode,
           t.motto as school_motto
    FROM "user" u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE (
      LOWER(u.email) = LOWER($1)
      OR u.phone = $1
      OR (length($2) >= 10 AND RIGHT(REPLACE(u.phone, ' ', ''), 10) = $2)
      OR u.admission_number = $1
    )
    AND u.status = 'active'
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(globalQuery, [identifier, cleanPhone]);
  return rows[0] || null;
}

export async function findUserById(userId) {
  const query = `
    SELECT u.id, u.tenant_id, u.name, u.email, u.phone, u.password_hash, u.type, u.status, u.avatar_url,
           u.can_view_revenue, u.last_login_at,
           t.name as school_name, t.slug as school_slug, t.theme_color, t.logo_url, t.plan_tier,
           t.affiliation_board, t.board_affiliation_number, t.school_code,
           t.official_email as school_email, t.official_phone as school_phone,
           t.website as school_website, t.address as school_address,
           t.city as school_city, t.state as school_state, t.pincode as school_pincode,
           t.motto as school_motto
    FROM "user" u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = $1 AND u.status = 'active'
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [userId]);
  return rows[0] || null;
}

export async function updateLastLogin(userId) {
  const query = `
    UPDATE "user"
    SET last_login_at = NOW()
    WHERE id = $1;
  `;
  await pgPool.query(query, [userId]);
}

export async function updateUserPassword(userId, passwordHash) {
  const query = `
    UPDATE "user"
    SET password_hash = $2, updated_at = NOW()
    WHERE id = $1;
  `;
  await pgPool.query(query, [userId, passwordHash]);
}

export async function updateUserProfile(userId, { name, phone, avatar_url }) {
  const fields = [];
  const values = [userId];
  let idx = 2;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${idx++}`);
    values.push(phone);
  }
  if (avatar_url !== undefined) {
    fields.push(`avatar_url = $${idx++}`);
    values.push(avatar_url);
  }

  if (fields.length === 0) return null;

  const query = `
    UPDATE "user"
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $1
    RETURNING id, tenant_id, name, email, phone, avatar_url, updated_at;
  `;
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}
