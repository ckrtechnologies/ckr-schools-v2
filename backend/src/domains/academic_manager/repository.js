import { pgPool } from '../../config/db.js';

export class AcademicManagerRepository {
  static async getAcademicMeta(tenantId) {
    const [classesRes, subjectsRes, termsRes, legacyExamsRes] = await Promise.all([
      pgPool.query(`SELECT id, name, section, name as "className" FROM public.class WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]),
      pgPool.query(`
        SELECT 
          s.id, 
          s.name, 
          s.category,
          COALESCE(
            ARRAY_AGG(DISTINCT cs.class_id::text) FILTER (WHERE cs.class_id IS NOT NULL),
            '{}'
          ) AS "classIds"
        FROM public.subject s
        LEFT JOIN public.class_subjects cs ON s.id = cs.subject_id AND s.tenant_id = cs.tenant_id
        WHERE s.tenant_id = $1
        GROUP BY s.id, s.name, s.category
        ORDER BY s.name ASC
      `, [tenantId]),
      pgPool.query(`
        SELECT id, name, academic_year, weightage_percent, display_order
        FROM public.academic_terms
        WHERE tenant_id = $1
        ORDER BY display_order ASC, name ASC
      `, [tenantId]),
      pgPool.query(`SELECT DISTINCT title as term FROM public.exams WHERE tenant_id = $1`, [tenantId])
    ]);

    const configuredTerms = termsRes.rows.map(r => r.name).filter(Boolean);
    const legacyTerms = legacyExamsRes.rows.map(r => r.term).filter(Boolean);
    const mergedTerms = Array.from(new Set([...configuredTerms, ...legacyTerms]));
    if (mergedTerms.length === 0) {
      mergedTerms.push('Term 1', 'Term 2', 'Unit Test 1', 'Unit Test 2');
    }

    return {
      classes: classesRes.rows,
      subjects: subjectsRes.rows,
      terms: mergedTerms,
      terms_detail: termsRes.rows,
      academic_years: ['2026-27', '2025-26', '2024-25']
    };
  }

  static async listTerms(tenantId, academicYear = null) {
    let query = `
      SELECT id, name, academic_year, weightage_percent, display_order, created_at
      FROM public.academic_terms
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $2`;
    }
    query += ` ORDER BY display_order ASC, name ASC;`;
    const { rows } = await pgPool.query(query, params);
    return rows;
  }

  static async createTerm(tenantId, data) {
    const query = `
      INSERT INTO public.academic_terms (
        tenant_id, name, academic_year, weightage_percent, display_order
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING id, name, academic_year, weightage_percent, display_order, created_at;
    `;
    const { rows } = await pgPool.query(query, [
      tenantId,
      data.name.trim(),
      data.academic_year || '2026-27',
      data.weightage_percent !== undefined ? data.weightage_percent : 50.0,
      data.display_order !== undefined ? data.display_order : 1
    ]);
    return rows[0];
  }

  static async updateTerm(tenantId, id, data) {
    const query = `
      UPDATE public.academic_terms
      SET name = COALESCE($3, name),
          academic_year = COALESCE($4, academic_year),
          weightage_percent = COALESCE($5, weightage_percent),
          display_order = COALESCE($6, display_order),
          updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING id, name, academic_year, weightage_percent, display_order, created_at;
    `;
    const { rows } = await pgPool.query(query, [
      tenantId,
      id,
      data.name !== undefined ? data.name.trim() : null,
      data.academic_year !== undefined ? data.academic_year : null,
      data.weightage_percent !== undefined ? data.weightage_percent : null,
      data.display_order !== undefined ? data.display_order : null
    ]);
    if (!rows[0]) {
      const error = new Error('Term not found or unauthorized');
      error.status = 404;
      throw error;
    }
    return rows[0];
  }

  static async deleteTerm(tenantId, id) {
    const termRow = await pgPool.query(`SELECT name FROM public.academic_terms WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
    if (!termRow.rows[0]) {
      const error = new Error('Term not found or unauthorized');
      error.status = 404;
      throw error;
    }
    const termName = termRow.rows[0].name;

    const [examCheck, distCheck] = await Promise.all([
      pgPool.query(`SELECT count(*) as count FROM public.exams WHERE tenant_id = $1 AND title = $2`, [tenantId, termName]),
      pgPool.query(`SELECT count(*) as count FROM public.subject_marks_distribution WHERE tenant_id = $1 AND term = $2`, [tenantId, termName])
    ]);

    const examCount = parseInt(examCheck.rows[0].count, 10);
    const distCount = parseInt(distCheck.rows[0].count, 10);

    if (examCount > 0 || distCount > 0) {
      const details = [];
      if (examCount > 0) details.push(`${examCount} exam(s)`);
      if (distCount > 0) details.push(`${distCount} marks distribution(s)`);
      const error = new Error(`Cannot delete term "${termName}" because it is currently linked to ${details.join(' and ')}.`);
      error.status = 400;
      throw error;
    }

    await pgPool.query(`DELETE FROM public.academic_terms WHERE tenant_id = $1 AND id = $2`, [tenantId, id]);
    return { id, name: termName };
  }

  static async getDistributions(tenantId, filters = {}) {
    let query = `
      SELECT 
        smd.*,
        c.name as class_name, c.section,
        s.name as subject_name, s.category as subject_category
      FROM public.subject_marks_distribution smd
      LEFT JOIN public.class c ON smd.class_id = c.id AND c.tenant_id = smd.tenant_id
      LEFT JOIN public.subject s ON smd.subject_id = s.id AND s.tenant_id = smd.tenant_id
      WHERE smd.tenant_id = $1
    `;
    const params = [tenantId];

    if (filters.class_id) {
      params.push(filters.class_id);
      query += ` AND smd.class_id = $${params.length}`;
    }
    if (filters.subject_id) {
      params.push(filters.subject_id);
      query += ` AND smd.subject_id = $${params.length}`;
    }
    if (filters.term) {
      params.push(filters.term);
      query += ` AND smd.term = $${params.length}`;
    }
    if (filters.academic_year) {
      params.push(filters.academic_year);
      query += ` AND smd.academic_year = $${params.length}`;
    }

    query += ` ORDER BY smd.created_at DESC`;
    const res = await pgPool.query(query, params);
    return res.rows.map(r => ({
      ...r,
      class: { id: r.class_id, name: r.class_name, section: r.section },
      subject: { id: r.subject_id, name: r.subject_name, category: r.subject_category }
    }));
  }

  static async saveDistribution(tenantId, payload) {
    const query = `
      INSERT INTO public.subject_marks_distribution (
        tenant_id, academic_year, class_id, subject_id, term, total_marks, components, is_locked, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
      ON CONFLICT (tenant_id, class_id, subject_id, term, academic_year)
      DO UPDATE SET
        total_marks = EXCLUDED.total_marks,
        components = EXCLUDED.components,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      tenantId,
      payload.academic_year || '2026-27',
      payload.class_id,
      payload.subject_id,
      payload.term,
      payload.total_marks || 100,
      JSON.stringify(payload.components || [])
    ];
    const res = await pgPool.query(query, values);
    return res.rows[0];
  }

  static async toggleLock(tenantId, id) {
    const res = await pgPool.query(
      `UPDATE public.subject_marks_distribution
       SET is_locked = NOT is_locked, updated_at = NOW()
       WHERE tenant_id = $1 AND id = $2
       RETURNING *`,
      [tenantId, id]
    );
    return res.rows[0] || null;
  }

  static async deleteDistribution(tenantId, id) {
    const res = await pgPool.query(
      `DELETE FROM public.subject_marks_distribution WHERE tenant_id = $1 AND id = $2 RETURNING id`,
      [tenantId, id]
    );
    return res.rows[0] || null;
  }

  static async cloneDistribution(tenantId, { source_distribution_id, source_class_id, target_class_ids, academic_year, term, overwrite }) {
    if (!Array.isArray(target_class_ids) || target_class_ids.length === 0) {
      throw new Error('target_class_ids array is required');
    }

    let sourceRows = [];
    if (source_distribution_id) {
      const src = await pgPool.query(
        `SELECT * FROM public.subject_marks_distribution WHERE tenant_id = $1 AND id = $2`,
        [tenantId, source_distribution_id]
      );
      sourceRows = src.rows;
    } else if (source_class_id) {
      let query = `SELECT * FROM public.subject_marks_distribution WHERE tenant_id = $1 AND class_id = $2`;
      const params = [tenantId, source_class_id];
      if (academic_year) {
        params.push(academic_year);
        query += ` AND academic_year = $${params.length}`;
      }
      if (term) {
        params.push(term);
        query += ` AND term = $${params.length}`;
      }
      const src = await pgPool.query(query, params);
      sourceRows = src.rows;
    }

    if (sourceRows.length === 0) {
      throw new Error('No marks distributions found to clone from source');
    }

    let clonedCount = 0;
    for (const targetClassId of target_class_ids) {
      for (const row of sourceRows) {
        await pgPool.query(
          `INSERT INTO public.subject_marks_distribution (
            tenant_id, academic_year, class_id, subject_id, term, total_marks, components, is_locked, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
          ON CONFLICT (tenant_id, class_id, subject_id, term, academic_year)
          DO UPDATE SET
            total_marks = EXCLUDED.total_marks,
            components = EXCLUDED.components,
            updated_at = NOW()`,
          [
            tenantId,
            row.academic_year,
            targetClassId,
            row.subject_id,
            row.term,
            row.total_marks,
            JSON.stringify(row.components || [])
          ]
        );
        clonedCount++;
      }
    }

    return { count: clonedCount, message: `Successfully cloned ${clonedCount} distribution scheme(s) across target classes.` };
  }

  static async getGradingTracker(tenantId, filters = {}) {
    // Returns exam grading submission status across teachers and classes
    const res = await pgPool.query(
      `SELECT 
         e.id as exam_id, e.title as exam_title, e.date as exam_date,
         c.id as class_id, c.name as class_name, c.section as class_section,
         COUNT(g.id)::int as grades_entered,
         COUNT(cs.student_id)::int as total_students
       FROM public.exams e
       JOIN public.class c ON e.class_id = c.id AND c.tenant_id = e.tenant_id
       LEFT JOIN public.class_students cs ON c.id = cs.class_id AND cs.tenant_id = c.tenant_id
       LEFT JOIN public.grades g ON e.id = g.exam_id AND g.tenant_id = e.tenant_id AND g.student_id = cs.student_id
       WHERE e.tenant_id = $1
       GROUP BY e.id, e.title, e.date, c.id, c.name, c.section
       ORDER BY e.date DESC`,
      [tenantId]
    );
    return res.rows;
  }
}

