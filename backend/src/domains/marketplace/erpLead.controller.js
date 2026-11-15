import { pgPool } from '../../config/db.js';
import { sendErpLeadNotification } from '../../services/emailService.js';

export async function submitErpLeadHandler(req, res, next) {
  try {
    const {
      school_name,
      city,
      contact_person,
      designation,
      phone,
      email,
      student_strength,
      interested_modules,
      notes
    } = req.body;

    if (!school_name || !contact_person || !phone) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'School name, contact person and phone number are required.' }
      });
    }

    const query = `
      INSERT INTO public.erp_leads (
        school_name, city, contact_person, designation, phone, email,
        student_strength, interested_modules, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'new', $9)
      RETURNING *;
    `;

    const values = [
      school_name.trim(),
      city ? city.trim() : null,
      contact_person.trim(),
      designation ? designation.trim() : null,
      phone.trim(),
      email ? email.trim() : null,
      student_strength || null,
      JSON.stringify(interested_modules || []),
      notes || null
    ];

    const { rows } = await pgPool.query(query, values);
    const newLead = rows[0];

    // Trigger asynchronous email dispatch to hello@ckrtechnologies.onmicrosoft.com
    sendErpLeadNotification(newLead).catch((err) => {
      console.error('Background lead email dispatch error:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Institutional demo request received! Our team will contact you within 2 hours.',
      data: newLead
    });
  } catch (error) {
    next(error);
  }
}

export async function listErpLeadsHandler(req, res, next) {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status && status !== 'all') {
      whereClause += ` AND status = $${idx++}`;
      params.push(status);
    }

    if (search && search.trim()) {
      whereClause += ` AND (school_name ILIKE $${idx} OR contact_person ILIKE $${idx} OR phone ILIKE $${idx} OR city ILIKE $${idx})`;
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const countRes = await pgPool.query(`SELECT COUNT(*)::int AS total FROM public.erp_leads ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataQuery = `
      SELECT *
      FROM public.erp_leads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(Number(limit), Number(offset));

    const { rows } = await pgPool.query(dataQuery, params);

    return res.status(200).json({
      success: true,
      data: rows,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
}
