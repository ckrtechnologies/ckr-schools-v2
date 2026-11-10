import { pgPool } from '../../config/db.js';

export class LiveChatRepository {
  /**
   * Get chat history between two users (or between user and Admin Desk)
   */
  static async getLiveChatHistory(tenantId, currentUserId, otherUserId) {
    // Check if otherUser or currentUser is admin
    const adminRes = await pgPool.query(
      `SELECT id FROM public."user" WHERE tenant_id = $1 AND type IN ('admin', 'principal', 'super_admin')`,
      [tenantId]
    );
    const adminIds = new Set(adminRes.rows.map(r => r.id));

    const isOtherAdmin = adminIds.has(otherUserId);
    const isCurrentAdmin = adminIds.has(currentUserId);

    // Resolve any linked student/parent IDs for current user so parent/child messages show seamlessly
    let currentUserIds = [currentUserId];
    try {
      const spRes = await pgPool.query(
        `SELECT student_id as id FROM public.student_parents WHERE parent_id = $1 AND tenant_id = $2
         UNION
         SELECT parent_id as id FROM public.student_parents WHERE student_id = $1 AND tenant_id = $2`,
        [currentUserId, tenantId]
      );
      if (spRes.rows.length > 0) {
        currentUserIds.push(...spRes.rows.map(r => r.id));
      }
    } catch (e) {}

    let otherUserIds = [otherUserId];
    try {
      const spRes = await pgPool.query(
        `SELECT student_id as id FROM public.student_parents WHERE parent_id = $1 AND tenant_id = $2
         UNION
         SELECT parent_id as id FROM public.student_parents WHERE student_id = $1 AND tenant_id = $2`,
        [otherUserId, tenantId]
      );
      if (spRes.rows.length > 0) {
        otherUserIds.push(...spRes.rows.map(r => r.id));
      }
    } catch (e) {}

    let query;
    let params;

    if (isOtherAdmin) {
      query = `
        SELECT c.*, 
          COALESCE(s.name, NULLIF(CONCAT_WS(' & ', NULLIF(sp.father_name, ''), NULLIF(sp.mother_name, '')), ''), sp.father_name, sp.mother_name, 'User') as sender_name, 
          s.avatar_url as sender_avatar
        FROM public.communication c
        LEFT JOIN public."user" s ON c.sender_id = s.id AND s.tenant_id = c.tenant_id
        LEFT JOIN public.parents sp ON c.sender_id = sp.id AND sp.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1 AND c.type = 'live_chat'
          AND (
            (c.sender_id = ANY($2::uuid[]) AND (c.receiver_id = ANY($3::uuid[]) OR c.receiver_id IS NULL))
            OR
            ((c.sender_id = ANY($3::uuid[]) OR c.sender_id IS NULL) AND c.receiver_id = ANY($2::uuid[]))
          )
        ORDER BY c.created_at ASC
      `;
      params = [tenantId, currentUserIds, Array.from(adminIds)];
    } else if (isCurrentAdmin) {
      query = `
        SELECT c.*, 
          COALESCE(s.name, NULLIF(CONCAT_WS(' & ', NULLIF(sp.father_name, ''), NULLIF(sp.mother_name, '')), ''), sp.father_name, sp.mother_name, 'User') as sender_name, 
          s.avatar_url as sender_avatar
        FROM public.communication c
        LEFT JOIN public."user" s ON c.sender_id = s.id AND s.tenant_id = c.tenant_id
        LEFT JOIN public.parents sp ON c.sender_id = sp.id AND sp.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1 AND c.type = 'live_chat'
          AND (
            ((c.sender_id = ANY($3::uuid[]) OR c.sender_id IS NULL) AND c.receiver_id = ANY($2::uuid[]))
            OR
            (c.sender_id = ANY($2::uuid[]) AND (c.receiver_id = ANY($3::uuid[]) OR c.receiver_id IS NULL))
          )
        ORDER BY c.created_at ASC
      `;
      params = [tenantId, otherUserIds, Array.from(adminIds)];
    } else {
      query = `
        SELECT c.*, 
          COALESCE(s.name, NULLIF(CONCAT_WS(' & ', NULLIF(sp.father_name, ''), NULLIF(sp.mother_name, '')), ''), sp.father_name, sp.mother_name, 'User') as sender_name, 
          s.avatar_url as sender_avatar
        FROM public.communication c
        LEFT JOIN public."user" s ON c.sender_id = s.id AND s.tenant_id = c.tenant_id
        LEFT JOIN public.parents sp ON c.sender_id = sp.id AND sp.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1 AND c.type = 'live_chat'
          AND (
            (c.sender_id = ANY($2::uuid[]) AND c.receiver_id = ANY($3::uuid[]))
            OR
            (c.sender_id = ANY($3::uuid[]) AND c.receiver_id = ANY($2::uuid[]))
          )
        ORDER BY c.created_at ASC
      `;
      params = [tenantId, currentUserIds, otherUserIds];
    }

    const res = await pgPool.query(query, params);
    return res.rows;
  }

  /**
   * Get teachers available to student/parent
   */
  static async getTeachers(tenantId, currentUserId, currentUserType) {
    if (currentUserType === 'student') {
      const res = await pgPool.query(
        `SELECT DISTINCT u.id, u.name, u.email, u.type, u.avatar_url
         FROM public."user" u
         JOIN public.class_students cs ON cs.student_id = $2 AND cs.tenant_id = u.tenant_id
         JOIN public.class_teachers ct ON ct.class_id = cs.class_id AND ct.teacher_id = u.id AND ct.tenant_id = u.tenant_id
         WHERE u.tenant_id = $1 AND u.type = 'teacher'
         ORDER BY u.name ASC`,
        [tenantId, currentUserId]
      );
      if (res.rows.length > 0) return res.rows;
    }

    // Default: all active teachers in school
    const res = await pgPool.query(
      `SELECT id, name, email, type, avatar_url
       FROM public."user"
       WHERE tenant_id = $1 AND type = 'teacher' AND status != 'inactive'
       ORDER BY name ASC`,
      [tenantId]
    );
    return res.rows;
  }

  /**
   * Get students for teacher chat
   */
  static async getStudents(tenantId, teacherId) {
    const res = await pgPool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.type, u.avatar_url, u.admission_number, c.name as class_name, c.section as class_section
       FROM public."user" u
       JOIN public.class_students cs ON u.id = cs.student_id AND cs.tenant_id = u.tenant_id
       JOIN public.class c ON cs.class_id = c.id AND c.tenant_id = u.tenant_id
       LEFT JOIN public.class_teachers ct ON c.id = ct.class_id AND ct.tenant_id = u.tenant_id
       WHERE u.tenant_id = $1 AND u.type = 'student' AND (ct.teacher_id = $2 OR $2 IS NULL)
       ORDER BY u.name ASC`,
      [tenantId, teacherId]
    );
    return res.rows;
  }

  /**
   * Get principal / system admin info
   */
  static async getPrincipal(tenantId) {
    const res = await pgPool.query(
      `SELECT id, name, email, type, avatar_url
       FROM public."user"
       WHERE tenant_id = $1 AND type IN ('principal', 'admin')
       ORDER BY CASE WHEN type = 'principal' THEN 1 ELSE 2 END, created_at ASC
       LIMIT 1`,
      [tenantId]
    );
    return res.rows[0] || { id: 'admin', name: 'System Admin', type: 'admin' };
  }

  /**
   * Get recent conversation threads list for user
   */
  static async getLiveChatsList(tenantId, currentUserId) {
    // Resolve any linked IDs (e.g. parent linked to students, or student linked to parents)
    let userIds = [currentUserId];
    try {
      const spRes = await pgPool.query(
        `SELECT student_id as id FROM public.student_parents WHERE parent_id = $1 AND tenant_id = $2
         UNION
         SELECT parent_id as id FROM public.student_parents WHERE student_id = $1 AND tenant_id = $2`,
        [currentUserId, tenantId]
      );
      if (spRes.rows.length > 0) {
        userIds.push(...spRes.rows.map(r => r.id));
      }
    } catch (e) {}

    const res = await pgPool.query(
      `SELECT DISTINCT ON (partner_id)
         partner_id as id,
         COALESCE(u.name, NULLIF(CONCAT_WS(' & ', NULLIF(p.father_name, ''), NULLIF(p.mother_name, '')), ''), p.father_name, p.mother_name, 'User') as name,
         COALESCE(u.type, 'parent') as role,
         u.avatar_url,
         c.message as "lastMessage",
         c.created_at as time,
         CASE WHEN (c.receiver_id = ANY($2::uuid[])) AND c.is_read = FALSE THEN 1 ELSE 0 END as unread
       FROM (
         SELECT 
           id,
           tenant_id,
           CASE WHEN sender_id = ANY($2::uuid[]) THEN receiver_id ELSE sender_id END as partner_id,
           receiver_id,
           message,
           is_read,
           created_at
         FROM public.communication
         WHERE tenant_id = $1 AND type = 'live_chat' AND (sender_id = ANY($2::uuid[]) OR receiver_id = ANY($2::uuid[]))
       ) c
       LEFT JOIN public."user" u ON c.partner_id = u.id AND u.tenant_id = c.tenant_id
       LEFT JOIN public.parents p ON c.partner_id = p.id AND p.tenant_id = c.tenant_id
       ORDER BY partner_id, c.created_at DESC`,
      [tenantId, userIds]
    );

    return res.rows;
  }
}

