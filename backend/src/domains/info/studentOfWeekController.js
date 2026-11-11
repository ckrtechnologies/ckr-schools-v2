import { removeFileFromDisk } from "../../utils/fileCleaner.js";
import { pgPool } from '../../config/db.js';

export async function getAllStudentOfWeek(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const query = `
      SELECT 
        sow.id,
        sow.reason,
        sow.week_start_date,
        sow.week_end_date,
        sow.created_at,
        sow.metrics,
        json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url) as student,
        json_build_object('id', c.id, 'name', c.name, 'section', c.section) as class
      FROM public.student_of_the_week sow
      LEFT JOIN public."user" u ON sow.student_id = u.id AND u.tenant_id = sow.tenant_id
      LEFT JOIN public.class c ON sow.class_id = c.id AND c.tenant_id = sow.tenant_id
      WHERE sow.tenant_id = $1
      ORDER BY sow.week_start_date DESC, sow.created_at DESC;
    `;
    const { rows } = await pgPool.query(query, [tenantId]);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createStudentOfWeekOverride(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { student_id, class_id, week_start_date, week_end_date, reason } = req.body;
    if (!student_id || !class_id || !week_start_date || !week_end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const checkQuery = `
      SELECT id FROM public.student_of_the_week
      WHERE tenant_id = $1 AND class_id = $2 AND week_start_date = $3::date AND week_end_date = $4::date
      LIMIT 1;
    `;
    const checkRes = await pgPool.query(checkQuery, [tenantId, class_id, week_start_date, week_end_date]);
    let result;
    if (checkRes.rows.length > 0) {
      const updateQuery = `
        UPDATE public.student_of_the_week
        SET student_id = $3, reason = $4
        WHERE tenant_id = $1 AND id = $2
        RETURNING *;
      `;
      const updateRes = await pgPool.query(updateQuery, [tenantId, checkRes.rows[0].id, student_id, reason]);
      result = updateRes.rows[0];
    } else {
      const insertQuery = `
        INSERT INTO public.student_of_the_week (tenant_id, student_id, class_id, week_start_date, week_end_date, reason, metrics)
        VALUES ($1, $2, $3, $4::date, $5::date, $6, '{}'::jsonb)
        RETURNING *;
      `;
      const insertRes = await pgPool.query(insertQuery, [tenantId, student_id, class_id, week_start_date, week_end_date, reason]);
      result = insertRes.rows[0];
    }
    return res.status(200).json({ success: true, data: result, message: 'Student of the Week updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudentOfWeek(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { rows: deletedRows } = await pgPool.query('DELETE FROM public.student_of_the_week WHERE tenant_id = $1 AND id = $2 RETURNING photo_url', [tenantId, id]);
    if (deletedRows[0] && deletedRows[0].photo_url) {
      removeFileFromDisk(deletedRows[0].photo_url);
    }
    return res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentStudentOfWeek(req, res, next) {
  try {
    const tenantId = req.tenant.id;
    const { classId } = req.query;
    let query = `
      SELECT 
        sow.id,
        sow.reason,
        sow.week_start_date,
        sow.week_end_date,
        sow.created_at,
        sow.metrics,
        json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url) as student,
        json_build_object('id', c.id, 'name', c.name, 'section', c.section) as class
      FROM public.student_of_the_week sow
      LEFT JOIN public."user" u ON sow.student_id = u.id AND u.tenant_id = sow.tenant_id
      LEFT JOIN public.class c ON sow.class_id = c.id AND c.tenant_id = sow.tenant_id
      WHERE sow.tenant_id = $1
    `;
    const params = [tenantId];
    if (classId) {
      params.push(classId);
      query += ` AND sow.class_id = $2`;
    }
    query += ` ORDER BY sow.week_start_date DESC, sow.created_at DESC;`;
    const { rows } = await pgPool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

