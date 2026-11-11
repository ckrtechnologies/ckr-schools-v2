import { removeFileFromDisk } from "../../utils/fileCleaner.js";
import { pgPool } from '../../config/db.js';

export class UsersRepository {
  /**
   * Fetch all users in a tenant with associated relations
   */
  static async getUsers(tenantId, filters = {}) {
    let userQuery = `
      SELECT 
        id, tenant_id, name, email, phone, alternate_number, type, gender, 
        dob, status, avatar_url, address, admission_number, house,
        father_name, mother_name, monthly_fee, bus_fee, bus_start_date,
        fee_exempted, admission_date, form_submitted, leave_school,
        tc_received, tc_date, slc_received, slc_date,
        character_certificate_received, character_certificate_date,
        tc_document_url, slc_document_url, character_certificate_document_url,
        can_view_revenue, weekly_quota, complaints, last_login_at, created_at, updated_at
      FROM public."user"
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (filters.type) {
      params.push(filters.type);
      userQuery += ` AND type = $${params.length}`;
    }

    userQuery += ` ORDER BY name ASC`;

    // Fetch related datasets in parallel
    const [
      usersRes,
      classStudentsRes,
      classTeachersRes,
      teacherDetailsRes,
      parentsRes,
      studentParentsRes
    ] = await Promise.all([
      pgPool.query(userQuery, params),
      pgPool.query(`
        SELECT cs.class_id, cs.student_id, cs.roll_number, c.name as class_name, c.section as class_section
        FROM public.class_students cs
        LEFT JOIN public.class c ON cs.class_id = c.id AND c.tenant_id = cs.tenant_id
        WHERE cs.tenant_id = $1
      `, [tenantId]),
      pgPool.query(`
        SELECT ct.class_id, ct.teacher_id, c.name as class_name, c.section as class_section
        FROM public.class_teachers ct
        LEFT JOIN public.class c ON ct.class_id = c.id AND c.tenant_id = ct.tenant_id
        WHERE ct.tenant_id = $1
      `, [tenantId]),
      pgPool.query(`SELECT user_id, doj, father_spouse_name FROM public.teacher_details WHERE tenant_id = $1`, [tenantId]),
      pgPool.query(`SELECT id, father_name, mother_name, phone, alternate_number, email FROM public.parents WHERE tenant_id = $1`, [tenantId]),
      pgPool.query(`SELECT parent_id, student_id FROM public.student_parents WHERE tenant_id = $1`, [tenantId])
    ]);

    const classStudentsData = classStudentsRes.rows;
    const classTeachersData = classTeachersRes.rows;
    const teacherDetailsData = teacherDetailsRes.rows;
    const studentParentsData = studentParentsRes.rows;
    const parentsData = parentsRes.rows;

    const mappedUsers = usersRes.rows.map(user => {
      let connections = [];
      let classes = [];
      let studentClassInfo = null;

      if (user.type === 'student') {
        connections = studentParentsData.filter(c => c.student_id === user.id).map(c => c.parent_id);
        const enrolled = classStudentsData.filter(c => c.student_id === user.id);
        classes = enrolled.map(c => c.class_id);
        if (enrolled.length > 0) {
          studentClassInfo = {
            class_id: enrolled[0].class_id,
            class_name: enrolled[0].class_name,
            class_section: enrolled[0].class_section,
            roll_number: enrolled[0].roll_number || user.house || null
          };
        }
      } else if (user.type === 'teacher') {
        classes = classTeachersData.filter(c => c.teacher_id === user.id).map(c => c.class_id);
      } else if (user.type === 'parent') {
        connections = studentParentsData.filter(c => c.parent_id === user.id).map(c => c.student_id);
      }

      const u = {
        ...user,
        connections,
        classes,
        class_name: studentClassInfo?.class_name || null,
        class_section: studentClassInfo?.class_section || null,
        roll_number: studentClassInfo?.roll_number || user.house || null,
        grade: [],
        fees: [],
        notification: [],
        activity: []
      };

      const tDetails = teacherDetailsData.find(t => t.user_id === user.id);
      if (u.type === 'teacher' && tDetails) {
        u.doj = tDetails.doj;
        u.father_spouse_name = tDetails.father_spouse_name;
      }

      return u;
    });

    // Also include synthetic parent entries for parents table
    const mappedParents = parentsData.map(p => {
      const connections = studentParentsData.filter(c => c.parent_id === p.id).map(c => c.student_id);
      const pClasses = new Set();
      connections.forEach(sId => {
        classStudentsData.filter(c => c.student_id === sId).forEach(c => pClasses.add(c.class_id));
      });

      return {
        id: p.id,
        tenant_id: tenantId,
        name: p.father_name ? `${p.father_name}${p.mother_name ? ' & ' + p.mother_name : ''}` : (p.mother_name || 'Parent'),
        father_name: p.father_name || '',
        mother_name: p.mother_name || '',
        email: p.email || null,
        phone: p.phone,
        alternate_number: p.alternate_number,
        type: 'parent',
        status: 'active',
        connections,
        classes: Array.from(pClasses),
        grade: [],
        fees: [],
        notification: [],
        activity: []
      };
    });

    return [...mappedUsers, ...mappedParents];
  }

  /**
   * Get user by ID with relation maps
   */
  static async getUserById(tenantId, userId) {
    const userRes = await pgPool.query(
      `SELECT * FROM public."user" WHERE tenant_id = $1 AND id = $2`,
      [tenantId, userId]
    );

    if (userRes.rows.length === 0) {
      // Check parents table
      const parentRes = await pgPool.query(
        `SELECT * FROM public.parents WHERE tenant_id = $1 AND id = $2`,
        [tenantId, userId]
      );
      if (parentRes.rows.length === 0) return null;

      const p = parentRes.rows[0];
      const spRes = await pgPool.query(
        `SELECT student_id FROM public.student_parents WHERE tenant_id = $1 AND parent_id = $2`,
        [tenantId, userId]
      );
      return {
        id: p.id,
        tenant_id: tenantId,
        name: p.father_name ? `${p.father_name}${p.mother_name ? ' & ' + p.mother_name : ''}` : (p.mother_name || 'Parent'),
        father_name: p.father_name || '',
        mother_name: p.mother_name || '',
        phone: p.phone,
        alternate_number: p.alternate_number,
        email: p.email || null,
        type: 'parent',
        connections: spRes.rows.map(r => r.student_id)
      };
    }

    const user = userRes.rows[0];
    delete user.password_hash;

    if (user.type === 'student') {
      const [classRes, connRes, attRes, feeRes] = await Promise.all([
        pgPool.query(`
          SELECT cs.class_id, cs.roll_number, c.name as class_name, c.section as class_section
          FROM public.class_students cs
          LEFT JOIN public.class c ON cs.class_id = c.id AND c.tenant_id = cs.tenant_id
          WHERE cs.tenant_id = $1 AND cs.student_id = $2
        `, [tenantId, userId]),
        pgPool.query(`SELECT parent_id FROM public.student_parents WHERE tenant_id = $1 AND student_id = $2`, [tenantId, userId]),
        pgPool.query(`
          SELECT 
            COUNT(*)::int as total_days,
            COUNT(*) FILTER (WHERE status = 'present')::int as present_days,
            COUNT(*) FILTER (WHERE status = 'absent')::int as absent_days
          FROM public.attendance
          WHERE tenant_id = $1 AND user_id = $2
        `, [tenantId, userId]),
        pgPool.query(`
          SELECT pl.id, pl.amount_paid, pl.payment_mode, r.receipt_number, pl.created_at
          FROM public.payments_ledger pl
          LEFT JOIN public.receipts r ON pl.receipt_id = r.id AND r.tenant_id = pl.tenant_id
          WHERE pl.tenant_id = $1 AND pl.student_id = $2
          ORDER BY pl.created_at DESC LIMIT 5
        `, [tenantId, userId])
      ]);

      user.classes = classRes.rows.map(r => r.class_id);
      user.connections = connRes.rows.map(r => r.parent_id);
      if (classRes.rows.length > 0) {
        user.class_name = classRes.rows[0].class_name;
        user.class_section = classRes.rows[0].class_section;
        user.roll_number = classRes.rows[0].roll_number || user.house || null;
      }
      user.attendance_summary = attRes.rows[0] || { total_days: 0, present_days: 0, absent_days: 0 };
      user.recent_payments = feeRes.rows.map(p => ({
        ...p,
        amount_paid: Number(p.amount_paid)
      }));
    } else if (user.type === 'teacher') {
      const [classRes, tdRes] = await Promise.all([
        pgPool.query(`SELECT class_id FROM public.class_teachers WHERE tenant_id = $1 AND teacher_id = $2`, [tenantId, userId]),
        pgPool.query(`SELECT doj, father_spouse_name FROM public.teacher_details WHERE tenant_id = $1 AND user_id = $2`, [tenantId, userId])
      ]);
      user.classes = classRes.rows.map(r => r.class_id);
      if (tdRes.rows.length > 0) {
        user.doj = tdRes.rows[0].doj;
        user.father_spouse_name = tdRes.rows[0].father_spouse_name;
      }
    }

    return user;
  }

  /**
   * Create a new user (student, teacher, staff, parent)
   */
  static async createUser(tenantId, data, passwordHash) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Parent creation
      if (data.type === 'parent') {
        let father_name = data.father_name !== undefined ? data.father_name : (data.name || '');
        let mother_name = data.mother_name !== undefined ? data.mother_name : '';
        if (!data.father_name && father_name && father_name.includes('&')) {
          [father_name, mother_name] = father_name.split('&').map(s => s.trim());
        }

        let password_hash = null;
        if (data.password && data.password.trim()) {
          const bcrypt = (await import('bcryptjs')).default;
          password_hash = await bcrypt.hash(data.password.trim(), 10);
        }

        const parentRes = await client.query(
          `INSERT INTO public.parents (tenant_id, father_name, mother_name, phone, alternate_number, email, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [tenantId, father_name, mother_name, data.phone || null, data.alternate_number || null, data.email || null, password_hash]
        );
        const parent = parentRes.rows[0];

        if (data.connections && data.connections.length > 0) {
          for (const studentId of data.connections) {
            await client.query(
              `INSERT INTO public.student_parents (tenant_id, parent_id, student_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (tenant_id, parent_id, student_id) DO NOTHING`,
              [tenantId, parent.id, studentId]
            );
          }
        }

        await client.query('COMMIT');
        return { user: { ...parent, type: 'parent' } };
      }

      // Core user creation
      const userRes = await client.query(
        `INSERT INTO public."user" (
          tenant_id, name, email, phone, alternate_number, password_hash, type,
          gender, dob, address, status, admission_number, house,
          father_name, mother_name, monthly_fee, bus_fee, bus_start_date,
          fee_exempted, admission_date, form_submitted, leave_school,
          tc_received, tc_date, slc_received, slc_date,
          character_certificate_received, character_certificate_date,
          tc_document_url, slc_document_url, character_certificate_document_url,
          avatar_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26,
          $27, $28,
          $29, $30, $31,
          $32
        ) RETURNING *`,
        [
          tenantId,
          data.name,
          data.email || null,
          data.phone || null,
          data.alternate_number || null,
          passwordHash,
          data.type || 'student',
          data.gender || null,
          data.dob || null,
          data.address || null,
          data.status || 'active',
          data.admission_number || null,
          data.house || null,
          data.father_name || null,
          data.mother_name || null,
          data.monthly_fee || 0,
          data.bus_fee || 0,
          data.bus_start_date || null,
          data.fee_exempted || false,
          data.admission_date || null,
          data.form_submitted || false,
          data.leave_school || false,
          data.tc_received || false,
          data.tc_date || null,
          data.slc_received || false,
          data.slc_date || null,
          data.character_certificate_received || false,
          data.character_certificate_date || null,
          data.tc_document_url || null,
          data.slc_document_url || null,
          data.character_certificate_document_url || null,
          data.avatar_url || null
        ]
      );
      const newUser = userRes.rows[0];

      // Student class enrollment
      if (data.type === 'student' && data.classId) {
        await client.query(
          `INSERT INTO public.class_students (tenant_id, class_id, student_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (tenant_id, class_id, student_id) DO NOTHING`,
          [tenantId, data.classId, newUser.id]
        );
      }

      // Teacher class mappings
      if (data.type === 'teacher' && Array.isArray(data.classes) && data.classes.length > 0) {
        for (const cId of data.classes) {
          await client.query(
            `INSERT INTO public.class_teachers (tenant_id, class_id, teacher_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, class_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
            [tenantId, cId, newUser.id]
          );
        }
      }

      // Teacher details
      if (data.type === 'teacher' && (data.doj || data.father_spouse_name)) {
        await client.query(
          `INSERT INTO public.teacher_details (tenant_id, user_id, doj, father_spouse_name)
           VALUES ($1, $2, $3, $4)`,
          [tenantId, newUser.id, data.doj || null, data.father_spouse_name || null]
        );
      }

      // Staff details
      if (['admin', 'admission', 'finance', 'principal', 'tc', 'attendance_manager', 'timetable', 'teachers_manager', 'academic_manager'].includes(data.type)) {
        await client.query(
          `INSERT INTO public.staff_details (tenant_id, user_id, access_level, job_title)
           VALUES ($1, $2, $3, $4)`,
          [tenantId, newUser.id, data.type, data.job_title || data.type]
        );
      }

      // Student-Parent connection
      if (data.connections && data.connections.length > 0) {
        for (const parentId of data.connections) {
          await client.query(
            `INSERT INTO public.student_parents (tenant_id, parent_id, student_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, parent_id, student_id) DO NOTHING`,
            [tenantId, parentId, newUser.id]
          );
        }
      }

      await client.query('COMMIT');
      delete newUser.password_hash;
      return newUser;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(tenantId, userId, data, newPasswordHash = null) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Check if parent
      if (data.type === 'parent') {
        let father_name = data.father_name !== undefined ? data.father_name : (data.name || '');
        let mother_name = data.mother_name !== undefined ? data.mother_name : '';
        if (!data.father_name && father_name && father_name.includes('&')) {
          [father_name, mother_name] = father_name.split('&').map(s => s.trim());
        }

        let password_hash = null;
        if (data.password && data.password.trim()) {
          const bcrypt = (await import('bcryptjs')).default;
          password_hash = await bcrypt.hash(data.password.trim(), 10);
        } else if (newPasswordHash) {
          password_hash = newPasswordHash;
        }

        await client.query(
          `UPDATE public.parents
           SET father_name = COALESCE($3, father_name),
               mother_name = COALESCE($4, mother_name),
               phone = COALESCE($5, phone),
               alternate_number = COALESCE($6, alternate_number),
               email = COALESCE($7, email),
               password_hash = CASE WHEN $8::text IS NOT NULL THEN $8::text ELSE password_hash END
           WHERE tenant_id = $1 AND id = $2`,
          [tenantId, userId, father_name, mother_name, data.phone || null, data.alternate_number || null, data.email || null, password_hash]
        );

        if (Array.isArray(data.connections)) {
          await client.query(`DELETE FROM public.student_parents WHERE tenant_id = $1 AND parent_id = $2`, [tenantId, userId]);
          for (const sId of data.connections) {
            await client.query(
              `INSERT INTO public.student_parents (tenant_id, parent_id, student_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (tenant_id, parent_id, student_id) DO NOTHING`,
              [tenantId, userId, sId]
            );
          }
        }

        await client.query('COMMIT');
        return true;
      }

      // Update public."user"
      const updateFields = [];
      const values = [tenantId, userId];

      const updatableCols = [
        'name', 'email', 'phone', 'alternate_number', 'gender', 'dob', 'address', 'status',
        'admission_number', 'house', 'father_name', 'mother_name', 'monthly_fee', 'bus_fee',
        'bus_start_date', 'fee_exempted', 'admission_date', 'form_submitted', 'leave_school',
        'tc_received', 'tc_date', 'slc_received', 'slc_date', 'character_certificate_received',
        'character_certificate_date', 'tc_document_url', 'slc_document_url', 'character_certificate_document_url',
        'avatar_url'
      ];

      for (const col of updatableCols) {
        if (data[col] !== undefined) {
          values.push(data[col] === '' ? null : data[col]);
          updateFields.push(`${col} = $${values.length}`);
        }
      }

      if (newPasswordHash) {
        values.push(newPasswordHash);
        updateFields.push(`password_hash = $${values.length}`);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`);
        await client.query(
          `UPDATE public."user" SET ${updateFields.join(', ')} WHERE tenant_id = $1 AND id = $2`,
          values
        );
      }

      // Update student class mapping
      if ((data.type === 'student' || data.classId !== undefined) && data.classId !== undefined) {
        await client.query(`DELETE FROM public.class_students WHERE tenant_id = $1 AND student_id = $2`, [tenantId, userId]);
        if (data.classId) {
          await client.query(
            `INSERT INTO public.class_students (tenant_id, class_id, student_id) VALUES ($1, $2, $3)`,
            [tenantId, data.classId, userId]
          );
        }
      }

      // Update teacher classes (ONLY for teachers)
      if (data.type === 'teacher' && Array.isArray(data.classes)) {
        await client.query(`DELETE FROM public.class_teachers WHERE tenant_id = $1 AND teacher_id = $2`, [tenantId, userId]);
        for (const cId of data.classes) {
          await client.query(
            `INSERT INTO public.class_teachers (tenant_id, class_id, teacher_id) VALUES ($1, $2, $3)
             ON CONFLICT (tenant_id, class_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
            [tenantId, cId, userId]
          );
        }
      }

      // Update teacher details (ONLY for teachers)
      if (data.type === 'teacher' && (data.doj !== undefined || data.father_spouse_name !== undefined)) {
        await client.query(
          `INSERT INTO public.teacher_details (tenant_id, user_id, doj, father_spouse_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [tenantId, userId, data.doj || null, data.father_spouse_name || null]
        );
        await client.query(
          `UPDATE public.teacher_details
           SET doj = COALESCE($3, doj), father_spouse_name = COALESCE($4, father_spouse_name)
           WHERE tenant_id = $1 AND user_id = $2`,
          [tenantId, userId, data.doj || null, data.father_spouse_name || null]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(tenantId, userId) {
    const res = await pgPool.query(
      `DELETE FROM public."user" WHERE tenant_id = $1 AND id = $2 RETURNING id, avatar_url, tc_document_url, slc_document_url, character_certificate_document_url`,
      [tenantId, userId]
    );
    if (res.rows[0]) {
      const u = res.rows[0];
      removeFileFromDisk([u.avatar_url, u.tc_document_url, u.slc_document_url, u.character_certificate_document_url]);
    }
    if (res.rowCount === 0) {
      await pgPool.query(`DELETE FROM public.parents WHERE tenant_id = $1 AND id = $2`, [tenantId, userId]);
    }
    return true;
  }

  /**
   * Bulk delete users
   */
  static async bulkDeleteUsers(tenantId, userIds) {
    const res = await pgPool.query(
      `DELETE FROM public."user" WHERE tenant_id = $1 AND id = ANY($2::uuid[]) RETURNING id, avatar_url, tc_document_url, slc_document_url, character_certificate_document_url`,
      [tenantId, userIds]
    );
    if (res.rows && res.rows.length > 0) {
      for (const u of res.rows) {
        removeFileFromDisk([u.avatar_url, u.tc_document_url, u.slc_document_url, u.character_certificate_document_url]);
      }
    }
    return { deletedCount: res.rowCount };
  }
}

