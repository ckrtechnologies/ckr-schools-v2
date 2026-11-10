import bcrypt from 'bcryptjs';
import { UsersRepository } from './repository.js';
import { pgPool } from '../../config/db.js';

export class UserService {
  static parseSafeDate(dateString) {
    if (!dateString) return null;

    // Excel serial date (e.g., "44760")
    if (/^\d{4,5}$/.test(String(dateString))) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = parseInt(dateString, 10);
      let d = new Date(excelEpoch.getTime() + days * 86400000);
      return d.toISOString().split('T')[0];
    }

    // Check DD/MM/YYYY or DD-MM-YYYY first
    if (String(dateString).includes('/') || String(dateString).includes('-')) {
      const delimiter = String(dateString).includes('/') ? '/' : '-';
      const parts = String(dateString).trim().split(delimiter);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } else if (parts[2].length === 4) {
          // DD/MM/YYYY
          const d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
      }
    }

    let d = new Date(dateString);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    if (year < 1900 || year > 2100) return null;

    return d.toISOString().split('T')[0];
  }

  static async getUsers(tenantId, filters = {}) {
    return UsersRepository.getUsers(tenantId, filters);
  }

  static async getUserById(tenantId, userId) {
    const user = await UsersRepository.getUserById(tenantId, userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async createUser(tenantId, data) {
    let passwordHash = null;
    const rawPassword = data.password || 'Vision@2026';
    passwordHash = await bcrypt.hash(rawPassword, 10);

    const formattedData = {
      ...data,
      dob: this.parseSafeDate(data.dob),
      admission_date: this.parseSafeDate(data.admission_date),
      bus_start_date: this.parseSafeDate(data.bus_start_date),
      doj: this.parseSafeDate(data.doj)
    };

    return UsersRepository.createUser(tenantId, formattedData, passwordHash);
  }

  static async updateUser(tenantId, data) {
    if (!data.id) {
      throw new Error('User ID is required');
    }

    let newPasswordHash = null;
    if (data.password && data.password.trim() !== '') {
      newPasswordHash = await bcrypt.hash(data.password, 10);
    }

    const parseOrNull = (val) => {
      if (val === undefined) return undefined;
      if (val === '' || val === null) return null;
      return this.parseSafeDate(val);
    };

    const formattedData = {
      ...data,
      dob: parseOrNull(data.dob),
      admission_date: parseOrNull(data.admission_date),
      bus_start_date: parseOrNull(data.bus_start_date),
      doj: parseOrNull(data.doj)
    };

    return UsersRepository.updateUser(tenantId, data.id, formattedData, newPasswordHash);
  }

  static async deleteUser(tenantId, userId) {
    return UsersRepository.deleteUser(tenantId, userId);
  }

  static async bulkDeleteUsers(tenantId, userIds) {
    return UsersRepository.bulkDeleteUsers(tenantId, userIds);
  }

  static async uploadBulkUser(tenantId, usersList) {
    const createdUsers = [];
    for (const userData of usersList) {
      try {
        const u = await this.createUser(tenantId, userData);
        createdUsers.push(u);
      } catch (err) {
        console.error(`Error creating bulk user: ${userData.name || userData.email}`, err.message);
      }
    }
    return createdUsers;
  }

  static async forgetPassword(tenantId, email, phone, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const res = await pgPool.query(
      `UPDATE public."user"
       SET password_hash = $3, updated_at = NOW()
       WHERE tenant_id = $1 AND (email = $2 OR phone = $4)
       RETURNING id`,
      [tenantId, email || null, passwordHash, phone || null]
    );
    if (res.rowCount === 0) {
      throw new Error('User not found with provided email or phone');
    }
    return true;
  }

  static async updateNotification(tenantId, userId) {
    await pgPool.query(
      `UPDATE public.notifications
       SET is_read = TRUE
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    );
    return true;
  }

  static async getTeacherWeek(tenantId) {
    // Returns active teacher of the week if marked, or latest teacher
    const res = await pgPool.query(
      `SELECT u.id
       FROM public."user" u
       WHERE u.tenant_id = $1 AND u.type = 'teacher'
       ORDER BY u.created_at DESC LIMIT 1`,
      [tenantId]
    );
    return res.rows[0]?.id || null;
  }

  static async getTopper(tenantId) {
    try {
      const query = `
        WITH student_grades AS (
          SELECT 
            student_id,
            ROUND(AVG((marks / NULLIF(COALESCE(max_marks, 100), 0)) * 100)::numeric, 1) as grades_score,
            COUNT(id) as grades_count
          FROM public.grades
          WHERE tenant_id = $1 AND marks IS NOT NULL
          GROUP BY student_id
        ),
        student_attendance AS (
          SELECT 
            user_id as student_id,
            ROUND((COUNT(CASE WHEN status = 'Present' THEN 1 END)::numeric / NULLIF(COUNT(id), 0) * 100)::numeric, 1) as attendance_score,
            COUNT(id) as attendance_count
          FROM public.attendance
          WHERE tenant_id = $1
          GROUP BY user_id
        )
        SELECT 
          u.id, 
          u.name, 
          u.avatar_url,
          sg.grades_score,
          sa.attendance_score,
          ROUND(
            CASE 
              WHEN sg.grades_score IS NOT NULL AND sa.attendance_score IS NOT NULL THEN (sg.grades_score + sa.attendance_score) / 2
              WHEN sg.grades_score IS NOT NULL THEN sg.grades_score
              WHEN sa.attendance_score IS NOT NULL THEN sa.attendance_score
              ELSE NULL
            END::numeric, 1
          ) as score
        FROM public."user" u
        LEFT JOIN student_grades sg ON sg.student_id = u.id
        LEFT JOIN student_attendance sa ON sa.student_id = u.id
        WHERE u.tenant_id = $1 
          AND u.type = 'student'
          AND (sg.grades_score IS NOT NULL OR sa.attendance_score IS NOT NULL)
        ORDER BY score DESC, u.name ASC
        LIMIT 1;
      `;
      const res = await pgPool.query(query, [tenantId]);
      if (res.rows.length > 0) {
        return { 
          topper: res.rows[0], 
          score: Number(res.rows[0].score),
          attendanceScore: res.rows[0].attendance_score !== null ? Number(res.rows[0].attendance_score) : null,
          gradesScore: res.rows[0].grades_score !== null ? Number(res.rows[0].grades_score) : null
        };
      }

      return { topper: null, score: 0 };
    } catch (e) {
      console.error("Error in getTopper:", e);
      return { topper: null, score: 0 };
    }
  }
}

