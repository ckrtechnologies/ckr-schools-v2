import { pgPool } from '../../config/db.js';

export class TeachersManagerRepository {
  static async getParameters(tenantId, academicYear = '2026-27', includeInactive = false) {
    let query = `
      SELECT id, title, code, min_points, max_points, display_order, academic_year, is_active
      FROM public.teacher_scoring_parameters
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }
    if (!includeInactive) {
      query += ` AND is_active = TRUE`;
    }
    query += ` ORDER BY display_order ASC`;
    const res = await pgPool.query(query, params);
    return res.rows;
  }

  static async createParameter(tenantId, paramData) {
    const query = `
      INSERT INTO public.teacher_scoring_parameters (
        tenant_id, title, code, min_points, max_points, display_order, academic_year, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      tenantId,
      paramData.title,
      paramData.code || `PARAM_${Date.now()}`,
      paramData.min_points ?? 0,
      paramData.max_points ?? 3,
      paramData.display_order ?? 0,
      paramData.academic_year || '2026-27',
      paramData.is_active ?? true
    ];
    const res = await pgPool.query(query, values);
    return res.rows[0];
  }

  static async updateParameter(tenantId, id, paramData) {
    const fields = [];
    const values = [tenantId, id];
    const updatable = ['title', 'code', 'min_points', 'max_points', 'display_order', 'is_active', 'academic_year'];
    for (const key of updatable) {
      if (paramData[key] !== undefined) {
        values.push(paramData[key]);
        fields.push(`${key} = $${values.length}`);
      }
    }
    if (fields.length === 0) return null;
    const query = `
      UPDATE public.teacher_scoring_parameters
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    const res = await pgPool.query(query, values);
    return res.rows[0] || null;
  }

  static async deleteParameter(tenantId, id) {
    const res = await pgPool.query(
      `DELETE FROM public.teacher_scoring_parameters WHERE tenant_id = $1 AND id = $2 RETURNING id`,
      [tenantId, id]
    );
    return res.rows[0] || null;
  }

  static async getTeachers(tenantId) {
    const res = await pgPool.query(
      `SELECT id, name, email, phone, avatar_url, admission_number, status, created_at
       FROM public."user"
       WHERE tenant_id = $1 AND type = 'teacher'
       ORDER BY name ASC`,
      [tenantId]
    );
    return res.rows;
  }

  static async getMatrix(tenantId, month = 'August', academicYear = '2026-27') {
    const cleanYear = (academicYear || '2026-27').replace('2026-2027', '2026-27');
    const [paramsRes, teachersRes, evalRes] = await Promise.all([
      pgPool.query(
        `SELECT id, title, code, min_points, max_points, display_order
         FROM public.teacher_scoring_parameters
         WHERE tenant_id = $1 AND (academic_year = $2 OR academic_year = '2026-27' OR academic_year = '2026-2027') AND is_active = TRUE
         ORDER BY display_order ASC`,
        [tenantId, cleanYear]
      ),
      pgPool.query(
        `SELECT id, name, email, phone, avatar_url
         FROM public."user"
         WHERE tenant_id = $1 AND type = 'teacher'
         ORDER BY name ASC`,
        [tenantId]
      ),
      pgPool.query(
        `SELECT * FROM public.teacher_monthly_evaluations
         WHERE tenant_id = $1 AND month = $2 AND (academic_year = $3 OR academic_year = '2026-27' OR academic_year = '2026-2027')`,
        [tenantId, month, cleanYear]
      )
    ]);

    const evalMap = {};
    evalRes.rows.forEach(ev => {
      evalMap[ev.teacher_id] = ev;
    });

    const rows = teachersRes.rows.map((teacher, index) => {
      const evaluation = evalMap[teacher.id] || null;
      return {
        sr_no: index + 1,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        avatar_url: teacher.avatar_url,
        phone: teacher.phone,
        email: teacher.email,
        scores: evaluation ? evaluation.scores : {},
        out_of: evaluation ? Number(evaluation.max_possible) : 0,
        total: evaluation ? Number(evaluation.total_score) : 0,
        percentage: evaluation ? Number(evaluation.percentage) : 0,
        rank: evaluation ? evaluation.rank : null,
        remarks: evaluation?.remarks || '',
        is_evaluated: !!evaluation
      };
    });

    return {
      academic_year: academicYear,
      month,
      parameters: paramsRes.rows,
      matrix: rows,
      rows: rows
    };
  }

  static async saveBatchEvaluations(tenantId, month, academicYear, evaluations) {
    const cleanYear = (academicYear || '2026-27').replace('2026-2027', '2026-27');
    if (!month) throw new Error('Month is required');
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      throw new Error('Evaluations array cannot be empty');
    }

    // 1. Fetch active parameters for accurate scoring
    const paramsRes = await pgPool.query(
      `SELECT id, title, min_points, max_points
       FROM public.teacher_scoring_parameters
       WHERE tenant_id = $1 AND (academic_year = $2 OR academic_year = '2026-27' OR academic_year = '2026-2027') AND is_active = TRUE`,
      [tenantId, cleanYear]
    );
    const parameters = paramsRes.rows;

    // 2. Fetch existing evaluations for this month
    const existingRes = await pgPool.query(
      `SELECT * FROM public.teacher_monthly_evaluations
       WHERE tenant_id = $1 AND month = $2 AND academic_year = $3`,
      [tenantId, month, cleanYear]
    );
    const allMap = {};
    existingRes.rows.forEach(ev => {
      allMap[ev.teacher_id] = ev;
    });

    // 3. Process each evaluation: calculate total, outOf, percentage
    evaluations.forEach(item => {
      const { teacher_id, scores = {}, remarks } = item;
      if (!teacher_id) return;

      let total = 0;
      let outOf = 0;

      parameters.forEach(param => {
        const cell = scores[param.id];
        if (cell !== undefined && cell !== null) {
          if (cell === 'NA' || cell.is_na === true || cell.score === 'NA') {
            scores[param.id] = { score: null, is_na: true };
          } else {
            const rawScore = typeof cell === 'object' ? cell.score : cell;
            const numScore = Number(rawScore);
            if (!isNaN(numScore)) {
              const clamped = Math.max(Number(param.min_points), Math.min(Number(param.max_points), numScore));
              total += clamped;
              outOf += Number(param.max_points);
              scores[param.id] = { score: clamped, is_na: false };
            }
          }
        }
      });

      const percentage = outOf > 0 ? Number(((total / outOf) * 100).toFixed(2)) : 0;

      allMap[teacher_id] = {
        teacher_id,
        month,
        academic_year: cleanYear,
        scores,
        total_score: Number(total.toFixed(2)),
        max_possible: Number(outOf.toFixed(2)),
        percentage,
        remarks: remarks || allMap[teacher_id]?.remarks || ''
      };
    });

    // 4. Compute Dense Ranks
    const listToRank = Object.values(allMap).filter(
      ev => ev.max_possible > 0 || ev.total_score > 0
    );
    listToRank.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return b.total_score - a.total_score;
    });

    let currentDenseRank = 0;
    let prevPercentage = null;
    listToRank.forEach(item => {
      if (prevPercentage === null || item.percentage !== prevPercentage) {
        currentDenseRank += 1;
        prevPercentage = item.percentage;
      }
      item.rank = currentDenseRank;
    });

    // 5. Database Transaction Upsert
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const saved = [];

      for (const ev of Object.values(allMap)) {
        const query = `
          INSERT INTO public.teacher_monthly_evaluations (
            tenant_id, teacher_id, month, academic_year, scores,
            max_possible, total_score, percentage, rank, remarks, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (tenant_id, teacher_id, month, academic_year)
          DO UPDATE SET
            scores = EXCLUDED.scores,
            max_possible = EXCLUDED.max_possible,
            total_score = EXCLUDED.total_score,
            percentage = EXCLUDED.percentage,
            rank = EXCLUDED.rank,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING *;
        `;
        const values = [
          tenantId,
          ev.teacher_id,
          ev.month,
          ev.academic_year,
          JSON.stringify(ev.scores || {}),
          ev.max_possible || 0,
          ev.total_score || 0,
          ev.percentage || 0,
          ev.rank || null,
          ev.remarks || ''
        ];
        const res = await client.query(query, values);
        saved.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return saved;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getScorecard(tenantId, teacherId, month = 'August', academicYear = '2026-27') {
    const cleanYear = (academicYear || '2026-27').replace('2026-2027', '2026-27');
    const [teacherRes, tenantRes, paramsRes, evalRes] = await Promise.all([
      pgPool.query(
        `SELECT id, name, email, phone, avatar_url, admission_number
         FROM public."user"
         WHERE tenant_id = $1 AND id = $2;`,
        [tenantId, teacherId]
      ),
      pgPool.query(`SELECT name FROM public.tenants WHERE id = $1;`, [tenantId]),
      pgPool.query(
        `SELECT id, title, code, min_points, max_points, display_order
         FROM public.teacher_scoring_parameters
         WHERE tenant_id = $1 AND (academic_year = $2 OR academic_year = '2026-27' OR academic_year = '2026-2027') AND is_active = TRUE
         ORDER BY display_order ASC;`,
        [tenantId, cleanYear]
      ),
      pgPool.query(
        `SELECT * FROM public.teacher_monthly_evaluations
         WHERE tenant_id = $1 AND teacher_id = $2 AND month = $3 AND (academic_year = $4 OR academic_year = '2026-27' OR academic_year = '2026-2027')
         LIMIT 1;`,
        [tenantId, teacherId, month, cleanYear]
      )
    ]);

    const teacher = teacherRes.rows[0];
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const schoolName = tenantRes.rows[0]?.name || 'School Campus';
    const parameters = paramsRes.rows;
    const evaluation = evalRes.rows[0] || null;
    const scores = evaluation?.scores || {};

    const topics = parameters.map((param, idx) => {
      const cell = scores[param.id];
      let displayValue = '-';
      let isNa = false;

      if (cell) {
        if (cell.is_na === true || cell === 'NA') {
          displayValue = 'NA';
          isNa = true;
        } else if (cell.score !== undefined && cell.score !== null) {
          displayValue = cell.score;
        } else if (typeof cell === 'number') {
          displayValue = cell;
        }
      }

      return {
        sr_no: idx + 1,
        parameter_id: param.id,
        topic: param.title,
        points: displayValue,
        min_points: Number(param.min_points),
        max_points: Number(param.max_points),
        is_na: isNa
      };
    });

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        roll_no: teacher.admission_number || '-',
        email: teacher.email,
        phone: teacher.phone,
        avatar_url: teacher.avatar_url
      },
      header: {
        school_name: schoolName,
        sub_title: `Monthly Score Board (${academicYear})`,
        month
      },
      topics,
      summary: {
        total: evaluation ? Number(evaluation.total_score) : 0,
        out_of: evaluation ? Number(evaluation.max_possible) : 0,
        percentage: evaluation ? Number(evaluation.percentage) : 0,
        rank: evaluation?.rank ? evaluation.rank : '-'
      }
    };
  }

  static async getTeacherAnalytics(tenantId, teacherId, academicYear = '2026-27') {
    const cleanYear = (academicYear || '2026-27').replace('2026-2027', '2026-27');
    const [teacherRes, paramsRes, evalRes] = await Promise.all([
      pgPool.query(
        `SELECT id, name, email, phone, avatar_url, admission_number
         FROM public."user"
         WHERE tenant_id = $1 AND id = $2;`,
        [tenantId, teacherId]
      ),
      pgPool.query(
        `SELECT id, title, code, min_points, max_points, display_order
         FROM public.teacher_scoring_parameters
         WHERE tenant_id = $1 AND (academic_year = $2 OR academic_year = '2026-27' OR academic_year = '2026-2027') AND is_active = TRUE
         ORDER BY display_order ASC;`,
        [tenantId, cleanYear]
      ),
      pgPool.query(
        `SELECT * FROM public.teacher_monthly_evaluations
         WHERE tenant_id = $1 AND teacher_id = $2 AND (academic_year = $3 OR academic_year = '2026-27' OR academic_year = '2026-2027')`,
        [tenantId, teacherId, cleanYear]
      )
    ]);

    const teacher = teacherRes.rows[0];
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const parameters = paramsRes.rows;
    const evalMap = {};
    evalRes.rows.forEach(ev => {
      evalMap[ev.month] = ev;
    });

    const ACADEMIC_MONTHS = [
      'June', 'July', 'August', 'September', 'October', 'November',
      'December', 'January', 'February', 'March', 'April', 'May'
    ];

    let totalScoreSum = 0;
    let totalPctSum = 0;
    let evaluatedCount = 0;
    let bestRank = null;
    let highestMonth = null;
    let highestPct = -1;

    const monthlyHistory = ACADEMIC_MONTHS.map(month => {
      const ev = evalMap[month];
      if (ev && (Number(ev.max_possible) > 0 || Number(ev.total_score) > 0)) {
        evaluatedCount++;
        const pct = Number(ev.percentage) || 0;
        const total = Number(ev.total_score) || 0;
        totalScoreSum += total;
        totalPctSum += pct;

        if (bestRank === null || (ev.rank && ev.rank < bestRank)) {
          bestRank = ev.rank;
        }

        if (pct > highestPct) {
          highestPct = pct;
          highestMonth = month;
        }

        return {
          month,
          has_data: true,
          total_score: total,
          max_possible: Number(ev.max_possible) || 0,
          percentage: pct,
          rank: ev.rank || '-',
          remarks: ev.remarks || null,
          scores: ev.scores || {},
          updated_at: ev.updated_at
        };
      }

      return {
        month,
        has_data: false,
        total_score: 0,
        max_possible: 0,
        percentage: 0,
        rank: '-',
        remarks: null,
        scores: {},
        updated_at: null
      };
    });

    // Parameter performance breakdown
    const parameterPerformance = parameters.map(param => {
      let paramScoreSum = 0;
      let validMonthCount = 0;
      const monthlyBreakdown = {};

      ACADEMIC_MONTHS.forEach(month => {
        const ev = evalMap[month];
        if (!ev) {
          monthlyBreakdown[month] = '-';
          return;
        }
        const cell = ev.scores ? ev.scores[param.id] : null;
        if (!cell) {
          monthlyBreakdown[month] = '-';
        } else if (cell === 'NA' || cell.is_na) {
          monthlyBreakdown[month] = 'NA';
        } else {
          const val = typeof cell === 'object' ? cell.score : Number(cell);
          if (val !== null && !isNaN(val)) {
            monthlyBreakdown[month] = val;
            paramScoreSum += val;
            validMonthCount++;
          } else {
            monthlyBreakdown[month] = '-';
          }
        }
      });

      const avgPoints = validMonthCount > 0 ? Number((paramScoreSum / validMonthCount).toFixed(2)) : 0;
      const maxPts = Number(param.max_points) || 1;
      const performancePct = maxPts > 0 && validMonthCount > 0 ? Number(((avgPoints / maxPts) * 100).toFixed(1)) : 0;

      return {
        parameter_id: param.id,
        title: param.title,
        code: param.code,
        min_points: Number(param.min_points),
        max_points: Number(param.max_points),
        monthly_breakdown: monthlyBreakdown,
        avg_points: avgPoints,
        performance_pct: performancePct
      };
    });

    const avgScore = evaluatedCount > 0 ? Number((totalScoreSum / evaluatedCount).toFixed(2)) : 0;
    const avgPercentage = evaluatedCount > 0 ? Number((totalPctSum / evaluatedCount).toFixed(2)) : 0;

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        roll_no: teacher.admission_number || '-',
        email: teacher.email,
        phone: teacher.phone,
        avatar_url: teacher.avatar_url
      },
      academic_year: academicYear,
      summary: {
        evaluated_months_count: evaluatedCount,
        total_months: ACADEMIC_MONTHS.length,
        avg_score: avgScore,
        avg_percentage: avgPercentage,
        best_rank: bestRank || '-',
        highest_scoring_month: highestMonth || '-'
      },
      monthly_history: monthlyHistory,
      parameters,
      parameter_performance: parameterPerformance
    };
  }
}

