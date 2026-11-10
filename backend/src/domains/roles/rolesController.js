import { pgPool } from '../../config/db.js';

export async function getRoles(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const query = `
      SELECT 
        sr.id,
        sr.tenant_id,
        sr.user_id,
        sr.role_title,
        sr.duties,
        sr.created_at,
        sr.updated_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'type', u.type
        ) as user
      FROM public.staff_responsibilities sr
      LEFT JOIN public."user" u ON sr.user_id = u.id AND u.tenant_id = sr.tenant_id
      WHERE sr.tenant_id = $1
      ORDER BY sr.created_at DESC;
    `;
    const { rows } = await pgPool.query(query, [tenantId]);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createRole(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { user_id, role_title, duties } = req.body;
    if (!user_id || !role_title) {
      return res.status(400).json({ success: false, error: "User ID and Role Title are required" });
    }

    const insertQuery = `
      INSERT INTO public.staff_responsibilities (tenant_id, user_id, role_title, duties)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pgPool.query(insertQuery, [tenantId, user_id, role_title, duties || '']);
    const newRole = rows[0];

    const userRes = await pgPool.query('SELECT id, name, email, type FROM public."user" WHERE tenant_id = $1 AND id = $2', [tenantId, user_id]);
    newRole.user = userRes.rows[0] || null;

    return res.status(201).json({ success: true, data: newRole, message: "Role created successfully" });
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { user_id, role_title, duties } = req.body;

    const updateQuery = `
      UPDATE public.staff_responsibilities
      SET user_id = COALESCE($3, user_id),
          role_title = COALESCE($4, role_title),
          duties = COALESCE($5, duties),
          updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    const { rows } = await pgPool.query(updateQuery, [tenantId, id, user_id, role_title, duties]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    const updated = rows[0];
    const userRes = await pgPool.query('SELECT id, name, email, type FROM public."user" WHERE tenant_id = $1 AND id = $2', [tenantId, updated.user_id]);
    updated.user = userRes.rows[0] || null;

    return res.status(200).json({ success: true, data: updated, message: "Role updated successfully" });
  } catch (err) {
    next(err);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    await pgPool.query('DELETE FROM public.staff_responsibilities WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    return res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (err) {
    next(err);
  }
}

