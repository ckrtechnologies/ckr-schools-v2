import { removeFileFromDisk } from "../../utils/fileCleaner.js";
import { pgPool } from '../../config/db.js';

/**
 * Communication, Circulars & Complaints Repository (ADO)
 */

// ============================================================================
// 1. CIRCULARS
// ============================================================================

export async function listCirculars(tenantId, audience = null) {
  let query = `
    SELECT 
      c.id, c.title, c.content, c.attachment_url, c.target_audience,
      c.class_id, c.created_at,
      u.name as publisher_name,
      cls.name as class_name, cls.section as class_section,
      COALESCE(mpr.is_published, false) as marketplace_published,
      mpr.category as marketplace_category,
      mpr.id as marketplace_press_id
    FROM circulars c
    LEFT JOIN "user" u ON c.created_by = u.id AND u.tenant_id = c.tenant_id
    LEFT JOIN class cls ON c.class_id = cls.id AND cls.tenant_id = c.tenant_id
    LEFT JOIN public.marketplace_press_releases mpr ON mpr.source_circular_id = c.id::text AND mpr.tenant_id = c.tenant_id
    WHERE c.tenant_id = $1
  `;
  const values = [tenantId];

  if (audience && audience !== 'all') {
    query += ` AND (c.target_audience = 'all' OR c.target_audience = $2)`;
    values.push(audience);
  }

  query += ` ORDER BY c.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);
  return rows;
}

export async function createCircular(tenantId, publisherId, data) {
  const query = `
    INSERT INTO circulars (
      tenant_id, title, content, attachment_url, target_audience, class_id, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.title,
    data.content || '',
    data.attachment_url || null,
    data.target_audience || 'all',
    data.class_id || null,
    publisherId || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deleteCircular(tenantId, circularId) {
  const query = `
    DELETE FROM circulars
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, attachment_url;
  `;
  const { rows } = await pgPool.query(query, [circularId, tenantId]);
  if (rows[0] && rows[0].attachment_url) {
    removeFileFromDisk(rows[0].attachment_url);
  }
  return rows[0] || null;
}

/**
 * Publish a circular to the public marketplace newsroom.
 * Creates or updates a matching row in public.marketplace_press_releases.
 * Pass isPublished=false to unpublish (set is_published=FALSE).
 */
export async function toggleCircularMarketplacePublish(tenantId, circularId, { isPublished, category }) {
  // First, fetch the circular to ensure it belongs to this tenant
  const circularRes = await pgPool.query(
    `SELECT id, title, content, attachment_url FROM circulars WHERE id = $1 AND tenant_id = $2`,
    [circularId, tenantId]
  );
  const circular = circularRes.rows[0];
  if (!circular) return null;

  if (!isPublished) {
    // Unpublish: set is_published = FALSE for any existing press release for this circular
    const result = await pgPool.query(
      `UPDATE public.marketplace_press_releases
       SET is_published = FALSE, updated_at = NOW()
       WHERE source_circular_id = $1::text AND tenant_id = $2
       RETURNING id, is_published`,
      [String(circularId), tenantId]
    );
    return result.rows[0] || { is_published: false };
  }

  // Publish: upsert into marketplace_press_releases
  const upsertQuery = `
    INSERT INTO public.marketplace_press_releases
      (tenant_id, title, summary, content_html, category, source_circular_id, is_published, published_date)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE, CURRENT_DATE)
    ON CONFLICT (source_circular_id)
    DO UPDATE SET
      title        = EXCLUDED.title,
      summary      = EXCLUDED.summary,
      content_html = EXCLUDED.content_html,
      category     = EXCLUDED.category,
      is_published = TRUE,
      updated_at   = NOW()
    RETURNING id, is_published;
  `;
  const summary = circular.content ? circular.content.substring(0, 200) : '';
  const contentHtml = circular.content || '';
  const result = await pgPool.query(upsertQuery, [
    tenantId,
    circular.title,
    summary,
    contentHtml,
    category || 'General',
    String(circularId),
  ]);
  return result.rows[0];
}

// ============================================================================
// 2. LIVE COMMUNICATION & SYSTEM MONITOR
// ============================================================================

export async function insertMessage(tenantId, senderId, { receiver_id, message, type }) {
  const query = `
    INSERT INTO communication (tenant_id, sender_id, receiver_id, message, type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, senderId, receiver_id, message, type || 'text']);
  return rows[0];
}

export async function getConversationHistory(tenantId, user1, user2) {
  const query = `
    SELECT 
      c.id, c.sender_id, c.receiver_id, c.message, c.type, c.created_at,
      s.name as sender_name, r.name as receiver_name
    FROM communication c
    INNER JOIN "user" s ON c.sender_id = s.id AND s.tenant_id = c.tenant_id
    INNER JOIN "user" r ON c.receiver_id = r.id AND r.tenant_id = c.tenant_id
    WHERE c.tenant_id = $1 
      AND (
        (c.sender_id = $2 AND c.receiver_id = $3)
        OR (c.sender_id = $3 AND c.receiver_id = $2)
      )
    ORDER BY c.created_at ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, user1, user2]);
  return rows;
}

/**
 * System Monitor: Distinct conversation threads between parents and teachers for administrative audit
 */
export async function getSystemMonitorThreads(tenantId) {
  const query = `
    SELECT 
      LEAST(c.sender_id, c.receiver_id) as participant_one_id,
      GREATEST(c.sender_id, c.receiver_id) as participant_two_id,
      u1.name as participant_one_name,
      u1.type as participant_one_role,
      u2.name as participant_two_name,
      u2.type as participant_two_role,
      MAX(c.created_at) as last_message_time,
      COUNT(c.id)::int as total_messages
    FROM communication c
    INNER JOIN "user" u1 ON LEAST(c.sender_id, c.receiver_id) = u1.id AND u1.tenant_id = c.tenant_id
    INNER JOIN "user" u2 ON GREATEST(c.sender_id, c.receiver_id) = u2.id AND u2.tenant_id = c.tenant_id
    WHERE c.tenant_id = $1
    GROUP BY 
      LEAST(c.sender_id, c.receiver_id),
      GREATEST(c.sender_id, c.receiver_id),
      u1.name, u1.type, u2.name, u2.type
    ORDER BY last_message_time DESC;
  `;
  const { rows } = await pgPool.query(query, [tenantId]);
  return rows;
}

// ============================================================================
// 3. COMPLAINTS & GRIEVANCES
// ============================================================================

export async function listComplaints(tenantId, studentId = null) {
  let query = `
    SELECT 
      cmp.id, 
      COALESCE(cmp.student_id, cmp.user_id) as student_id,
      COALESCE(cmp.user_id, cmp.student_id) as user_id,
      COALESCE(cmp.title, 'Disciplinary') as title,
      COALESCE(cmp.title, 'Disciplinary') as type,
      cmp.date, 
      cmp.description, 
      cmp.status, 
      cmp.created_at,
      u.name as student_name, 
      u.name as user_name,
      u.admission_number,
      c.name as class_name, 
      c.section as class_section
    FROM complaints cmp
    LEFT JOIN "user" u ON COALESCE(cmp.student_id, cmp.user_id) = u.id AND u.tenant_id = cmp.tenant_id
    LEFT JOIN class_students cs ON u.id = cs.student_id AND cs.tenant_id = cmp.tenant_id
    LEFT JOIN class c ON cs.class_id = c.id AND c.tenant_id = cmp.tenant_id
    WHERE cmp.tenant_id = $1
  `;
  const values = [tenantId];

  if (studentId) {
    query += ` AND (cmp.student_id = $2 OR cmp.user_id = $2)`;
    values.push(studentId);
  }

  query += ` ORDER BY cmp.created_at DESC;`;
  const { rows } = await pgPool.query(query, values);

  return rows.map(r => ({
    ...r,
    student: [r.student_id],
    user: { name: r.student_name },
  }));
}

export async function getComplaintById(tenantId, id) {
  const query = `
    SELECT 
      cmp.id, 
      COALESCE(cmp.student_id, cmp.user_id) as student_id,
      COALESCE(cmp.user_id, cmp.student_id) as user_id,
      COALESCE(cmp.title, 'Disciplinary') as title,
      COALESCE(cmp.title, 'Disciplinary') as type,
      cmp.date, 
      cmp.description, 
      cmp.status, 
      cmp.created_at,
      u.name as student_name,
      u.name as user_name,
      u.admission_number
    FROM complaints cmp
    LEFT JOIN "user" u ON COALESCE(cmp.student_id, cmp.user_id) = u.id AND u.tenant_id = cmp.tenant_id
    WHERE cmp.id = $1 AND cmp.tenant_id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [id, tenantId]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    student: [rows[0].student_id],
    user: { name: rows[0].student_name },
  };
}

export async function createComplaint(tenantId, data) {
  const studentIds = data.student_ids && data.student_ids.length > 0 ? data.student_ids : [null];
  const createdRows = [];

  for (const sid of studentIds) {
    const query = `
      INSERT INTO complaints (
        tenant_id, student_id, user_id, title, date, description, status, created_at
      ) VALUES (
        $1, $2, $2, $3, $4::date, $5, $6, NOW()
      )
      RETURNING *;
    `;
    const { rows } = await pgPool.query(query, [
      tenantId,
      sid,
      data.title,
      data.date,
      data.description,
      data.status || 'pending',
    ]);
    if (rows[0]) {
      createdRows.push({
        ...rows[0],
        student: [rows[0].student_id || rows[0].user_id],
        type: rows[0].title,
      });
    }
  }

  return createdRows[0] || null;
}

export async function updateComplaintStatus(tenantId, complaintId, status) {
  const query = `
    UPDATE complaints
    SET status = $1
    WHERE id = $2 AND tenant_id = $3
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [status, complaintId, tenantId]);
  return rows[0] || null;
}


// ============================================================================
// 4. NOTIFICATIONS & DEVICE TOKENS (Partitioned Engine)
// ============================================================================

export async function registerDeviceToken(tenantId, userId, fcmToken, deviceType) {
  const query = `
    INSERT INTO user_device_tokens (tenant_id, user_id, fcm_token, device_type, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (tenant_id, user_id, fcm_token) 
    DO UPDATE SET updated_at = NOW(), device_type = EXCLUDED.device_type
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [tenantId, userId, fcmToken, deviceType || 'android']);
  return rows[0];
}

export async function getUserNotifications(tenantId, userId, limit = 50, offset = 0) {
  const query = `
    SELECT id, tenant_id, user_id, title, message, type, is_read, created_at
    FROM notifications
    WHERE tenant_id = $1 AND user_id = $2
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4;
  `;
  const countQuery = `
    SELECT COUNT(*)::int as total
    FROM notifications
    WHERE tenant_id = $1 AND user_id = $2;
  `;
  const [dataRes, countRes] = await Promise.all([
    pgPool.query(query, [tenantId, userId, limit, offset]),
    pgPool.query(countQuery, [tenantId, userId])
  ]);
  return {
    data: dataRes.rows,
    total: countRes.rows[0]?.total || 0
  };
}

export async function getAllSchoolNotifications(tenantId, limit = 100, offset = 0) {
  const query = `
    SELECT 
      n.id, n.tenant_id, n.user_id, n.title, n.message, n.type, n.is_read, n.created_at,
      u.name as user_name, u.email as user_email, u.type as user_type
    FROM notifications n
    LEFT JOIN "user" u ON n.user_id = u.id AND u.tenant_id = n.tenant_id
    WHERE n.tenant_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const countQuery = `SELECT COUNT(*)::int as total FROM notifications WHERE tenant_id = $1;`;
  const [dataRes, countRes] = await Promise.all([
    pgPool.query(query, [tenantId, limit, offset]),
    pgPool.query(countQuery, [tenantId])
  ]);
  return {
    data: dataRes.rows,
    total: countRes.rows[0]?.total || 0
  };
}

export async function markNotificationAsRead(tenantId, notificationId, userId) {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1 AND tenant_id = $2 AND (user_id = $3 OR $3 IS NULL)
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [notificationId, tenantId, userId || null]);
  return rows[0] || null;
}
