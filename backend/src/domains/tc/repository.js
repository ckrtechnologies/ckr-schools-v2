import { pgPool } from '../../config/db.js';

function sanitizeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

export class TCRepository {
  /**
   * Get classes accessible to user
   */
  static async getClasses(tenantId, userId, role) {
    if (['admin', 'principal', 'super_admin', 'tc', 'tc_incharge', 'attendance_manager', 'admission', 'teachers_manager'].includes(role)) {
      const res = await pgPool.query(
        `SELECT id, name, section FROM public.class WHERE tenant_id = $1 ORDER BY name ASC`,
        [tenantId]
      );
      return res.rows;
    }

    // For teachers: classes they teach as class teacher or subject teacher
    const res = await pgPool.query(
      `SELECT DISTINCT c.id, c.name, c.section
       FROM public.class c
       LEFT JOIN public.class_teachers ct ON c.id = ct.class_id AND ct.tenant_id = c.tenant_id
       LEFT JOIN public.subject_teachers st ON c.id = st.class_id AND st.tenant_id = c.tenant_id
       WHERE c.tenant_id = $1 AND (ct.teacher_id = $2 OR st.teacher_id = $2)
       ORDER BY c.name ASC`,
      [tenantId, userId]
    );

    // If teacher has no specific class mappings, fallback to all classes for the school
    if (res.rows.length === 0) {
      const allRes = await pgPool.query(
        `SELECT id, name, section FROM public.class WHERE tenant_id = $1 ORDER BY name ASC`,
        [tenantId]
      );
      return allRes.rows;
    }

    return res.rows;
  }

  /**
   * Get students in class (including students who already received TC so they can be re-viewed/printed)
   */
  static async getClassStudents(tenantId, classId) {
    const res = await pgPool.query(
      `SELECT u.id, u.name, u.admission_number, u.father_name, u.mother_name, u.dob,
              u.status, u.leave_school, u.tc_received, u.avatar_url, cs.roll_number
       FROM public."user" u
       JOIN public.class_students cs ON u.id = cs.student_id AND cs.tenant_id = u.tenant_id
       WHERE u.tenant_id = $1 AND cs.class_id = $2
       ORDER BY u.name ASC`,
      [tenantId, classId]
    );
    return res.rows;
  }

  /**
   * Get student pre-fill data for TC & Certificates
   */
  static async getStudentPrefill(tenantId, studentId) {
    const [userRes, classRes, attRes, feeRes, tcRes, tenantRes] = await Promise.all([
      pgPool.query(
        `SELECT * FROM public."user" WHERE tenant_id = $1 AND id = $2`,
        [tenantId, studentId]
      ),
      pgPool.query(
        `SELECT c.id, c.name, c.section, cs.roll_number
         FROM public.class c
         JOIN public.class_students cs ON c.id = cs.class_id AND cs.tenant_id = c.tenant_id
         WHERE c.tenant_id = $1 AND cs.student_id = $2
         LIMIT 1`,
        [tenantId, studentId]
      ),
      pgPool.query(
        `SELECT 
           COUNT(*)::int as total,
           COUNT(CASE WHEN LOWER(status) = 'present' THEN 1 END)::int as present
         FROM public.attendance
         WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, studentId]
      ),
      pgPool.query(
        `SELECT payment_status, total_paid_amount, created_at
         FROM public.student_fees 
         WHERE tenant_id = $1 AND student_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId, studentId]
      ),
      pgPool.query(
        `SELECT * FROM public.transfer_certificates 
         WHERE tenant_id = $1 AND student_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId, studentId]
      ),
      pgPool.query(
        `SELECT id, name, slug, logo_url, affiliation_board, board_affiliation_number, school_code 
         FROM public.tenants WHERE id = $1`,
        [tenantId]
      )
    ]);

    if (userRes.rows.length === 0) return null;

    return {
      student: userRes.rows[0],
      classData: classRes.rows[0] || null,
      attendanceStats: attRes.rows[0] || { total: 0, present: 0 },
      latestFee: feeRes.rows[0] || null,
      existingTC: tcRes.rows[0] || null,
      tenant: tenantRes.rows[0] || null
    };
  }

  /**
   * Save or update Transfer Certificate
   */
  static async saveCertificate(tenantId, userId, tcData) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const sanitizedDob = sanitizeDate(tcData.dob);
      const sanitizedFirstAdmDate = sanitizeDate(tcData.first_admission_date);
      const sanitizedIssueDate = sanitizeDate(tcData.issue_date) || new Date().toISOString().split('T')[0];
      const sanitizedAppDate = sanitizeDate(tcData.application_date) || new Date().toISOString().split('T')[0];

      let savedRecord = null;

      // 1. If an existing record ID is provided and belongs to this tenant, perform direct UPDATE
      if (tcData.id && typeof tcData.id === 'string' && tcData.id.length > 20 && !tcData.id.startsWith('temp-')) {
        const updateQuery = `
          UPDATE public.transfer_certificates SET
            tc_number = $3,
            class_id = $4,
            issued_by = $5,
            issue_date = $6,
            application_date = $7,
            pupil_name = $8,
            mother_name = $9,
            father_name = $10,
            dob = $11,
            dob_words = $12,
            birth_place = $13,
            nationality = $14,
            category = $15,
            first_admission_date = $16,
            first_admission_class = $17,
            last_studied_class_figure = $18,
            last_studied_class_words = $19,
            annual_exam_result = $20,
            failed_status = $21,
            subjects_studied = $22,
            qualified_for_promotion = $23,
            promotion_class_figure = $24,
            promotion_class_words = $25,
            dues_paid_month = $26,
            fee_concession = $27,
            total_working_days = $28,
            days_present = $29,
            ncc_scout = $30,
            extra_curricular = $31,
            general_conduct = $32,
            reason_for_leaving = $33,
            remarks = $34,
            status = $35,
            updated_at = NOW()
          WHERE tenant_id = $1 AND id = $2
          RETURNING *;
        `;
        const updateValues = [
          tenantId,
          tcData.id,
          tcData.tc_number,
          tcData.class_id || null,
          userId || null,
          sanitizedIssueDate,
          sanitizedAppDate,
          tcData.pupil_name,
          tcData.mother_name || null,
          tcData.father_name || null,
          sanitizedDob,
          tcData.dob_words || null,
          tcData.birth_place || null,
          tcData.nationality || 'Indian',
          tcData.category || 'General',
          sanitizedFirstAdmDate,
          tcData.first_admission_class || null,
          tcData.last_studied_class_figure || null,
          tcData.last_studied_class_words || null,
          tcData.annual_exam_result || null,
          tcData.failed_status || 'NA',
          tcData.subjects_studied || null,
          tcData.qualified_for_promotion || 'Yes',
          tcData.promotion_class_figure || null,
          tcData.promotion_class_words || null,
          tcData.dues_paid_month || null,
          tcData.fee_concession || 'NA',
          Number(tcData.total_working_days) || 0,
          Number(tcData.days_present) || 0,
          tcData.ncc_scout || 'NA',
          tcData.extra_curricular || null,
          tcData.general_conduct || 'Good',
          tcData.reason_for_leaving || null,
          tcData.remarks || null,
          tcData.status || 'ISSUED'
        ];
        const updateRes = await client.query(updateQuery, updateValues);
        if (updateRes.rows.length > 0) {
          savedRecord = updateRes.rows[0];
        }
      }

      // 2. If no record was updated by ID, execute UPSERT on (tenant_id, tc_number)
      if (!savedRecord) {
        const insertQuery = `
          INSERT INTO public.transfer_certificates (
            tenant_id, tc_number, student_id, class_id, issued_by,
            issue_date, application_date, pupil_name, mother_name, father_name,
            dob, dob_words, birth_place, nationality, category,
            first_admission_date, first_admission_class,
            last_studied_class_figure, last_studied_class_words,
            annual_exam_result, failed_status, subjects_studied,
            qualified_for_promotion, promotion_class_figure, promotion_class_words,
            dues_paid_month, fee_concession, total_working_days, days_present,
            ncc_scout, extra_curricular, general_conduct, reason_for_leaving, remarks, status
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17,
            $18, $19,
            $20, $21, $22,
            $23, $24, $25,
            $26, $27, $28, $29,
            $30, $31, $32, $33, $34, $35
          )
          ON CONFLICT (tenant_id, tc_number) DO UPDATE SET
            class_id = EXCLUDED.class_id,
            issue_date = EXCLUDED.issue_date,
            application_date = EXCLUDED.application_date,
            pupil_name = EXCLUDED.pupil_name,
            mother_name = EXCLUDED.mother_name,
            father_name = EXCLUDED.father_name,
            dob = EXCLUDED.dob,
            dob_words = EXCLUDED.dob_words,
            birth_place = EXCLUDED.birth_place,
            nationality = EXCLUDED.nationality,
            category = EXCLUDED.category,
            first_admission_date = EXCLUDED.first_admission_date,
            first_admission_class = EXCLUDED.first_admission_class,
            last_studied_class_figure = EXCLUDED.last_studied_class_figure,
            last_studied_class_words = EXCLUDED.last_studied_class_words,
            annual_exam_result = EXCLUDED.annual_exam_result,
            failed_status = EXCLUDED.failed_status,
            subjects_studied = EXCLUDED.subjects_studied,
            qualified_for_promotion = EXCLUDED.qualified_for_promotion,
            promotion_class_figure = EXCLUDED.promotion_class_figure,
            promotion_class_words = EXCLUDED.promotion_class_words,
            dues_paid_month = EXCLUDED.dues_paid_month,
            fee_concession = EXCLUDED.fee_concession,
            total_working_days = EXCLUDED.total_working_days,
            days_present = EXCLUDED.days_present,
            ncc_scout = EXCLUDED.ncc_scout,
            extra_curricular = EXCLUDED.extra_curricular,
            general_conduct = EXCLUDED.general_conduct,
            reason_for_leaving = EXCLUDED.reason_for_leaving,
            remarks = EXCLUDED.remarks,
            status = EXCLUDED.status,
            updated_at = NOW()
          RETURNING *;
        `;
        const insertValues = [
          tenantId,
          tcData.tc_number,
          tcData.student_id,
          tcData.class_id || null,
          userId || null,
          sanitizedIssueDate,
          sanitizedAppDate,
          tcData.pupil_name,
          tcData.mother_name || null,
          tcData.father_name || null,
          sanitizedDob,
          tcData.dob_words || null,
          tcData.birth_place || null,
          tcData.nationality || 'Indian',
          tcData.category || 'General',
          sanitizedFirstAdmDate,
          tcData.first_admission_class || null,
          tcData.last_studied_class_figure || null,
          tcData.last_studied_class_words || null,
          tcData.annual_exam_result || null,
          tcData.failed_status || 'NA',
          tcData.subjects_studied || null,
          tcData.qualified_for_promotion || 'Yes',
          tcData.promotion_class_figure || null,
          tcData.promotion_class_words || null,
          tcData.dues_paid_month || null,
          tcData.fee_concession || 'NA',
          Number(tcData.total_working_days) || 0,
          Number(tcData.days_present) || 0,
          tcData.ncc_scout || 'NA',
          tcData.extra_curricular || null,
          tcData.general_conduct || 'Good',
          tcData.reason_for_leaving || null,
          tcData.remarks || null,
          tcData.status || 'ISSUED'
        ];
        const insertRes = await client.query(insertQuery, insertValues);
        savedRecord = insertRes.rows[0];
      }

      // 3. Mark student as inactive / leave_school with TC date
      await client.query(
        `UPDATE public."user"
         SET status = 'inactive', tc_received = TRUE, tc_date = $3, leave_school = TRUE, updated_at = NOW()
         WHERE tenant_id = $1 AND id = $2`,
        [tenantId, tcData.student_id, savedRecord.issue_date]
      );

      await client.query('COMMIT');
      return savedRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get records of issued TCs with full class and student joins
   */
  static async getRecords(tenantId, filters = {}) {
    let query = `
      SELECT 
        tc.*,
        c.name as class_name, c.section as class_section,
        u.admission_number as admission_no,
        u.avatar_url as student_avatar_url
      FROM public.transfer_certificates tc
      LEFT JOIN public.class c ON tc.class_id = c.id AND c.tenant_id = tc.tenant_id
      LEFT JOIN public."user" u ON tc.student_id = u.id AND u.tenant_id = tc.tenant_id
      WHERE tc.tenant_id = $1
    `;
    const params = [tenantId];

    if (filters.classId && filters.classId !== 'all') {
      params.push(filters.classId);
      query += ` AND tc.class_id = $${params.length}`;
    }
    if (filters.status && filters.status !== 'ALL') {
      params.push(filters.status);
      query += ` AND tc.status = $${params.length}`;
    }
    if (filters.fromDate) {
      params.push(filters.fromDate);
      query += ` AND tc.issue_date >= $${params.length}`;
    }
    if (filters.toDate) {
      params.push(filters.toDate);
      query += ` AND tc.issue_date <= $${params.length}`;
    }
    if (filters.search && filters.search.trim()) {
      params.push(`%${filters.search.trim()}%`);
      query += ` AND (tc.pupil_name ILIKE $${params.length} OR tc.tc_number ILIKE $${params.length} OR tc.father_name ILIKE $${params.length} OR u.admission_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY tc.created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(filters.limit) || 150);

    const res = await pgPool.query(query, params);
    return res.rows.map(r => ({
      ...r,
      admission_no: r.admission_no || '',
      reason_leaving: r.reason_for_leaving || '',
      class: r.class_name ? { id: r.class_id, name: r.class_name, section: r.class_section } : null,
      student: {
        id: r.student_id,
        name: r.pupil_name,
        admission_number: r.admission_no || '',
        avatar_url: r.student_avatar_url || null
      }
    }));
  }

  /**
   * Get single TC by ID or TC number (supports public verify lookup when tenantId is null)
   */
  static async getTCById(tenantId, id) {
    let query = `
      SELECT tc.*, 
             c.name as class_name, c.section as class_section, 
             u.admission_number, u.avatar_url as student_avatar_url,
             t.name as school_name, t.slug as school_slug, t.logo_url as school_logo
      FROM public.transfer_certificates tc
      LEFT JOIN public.tenants t ON tc.tenant_id = t.id
      LEFT JOIN public.class c ON tc.class_id = c.id AND c.tenant_id = tc.tenant_id
      LEFT JOIN public."user" u ON tc.student_id = u.id AND u.tenant_id = tc.tenant_id
      WHERE (tc.id::text = $1 OR tc.tc_number = $1)
    `;
    const params = [id];

    if (tenantId) {
      query += ` AND tc.tenant_id = $2`;
      params.push(tenantId);
    }

    const res = await pgPool.query(query, params);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      ...r,
      admission_no: r.admission_number || '',
      admission_number: r.admission_number || '',
      gr_no: r.admission_number || '',
      class: r.class_name ? { id: r.class_id, name: r.class_name, section: r.class_section } : null,
      student: {
        id: r.student_id,
        name: r.pupil_name,
        admission_number: r.admission_number || '',
        avatar_url: r.student_avatar_url || null
      }
    };
  }
}
