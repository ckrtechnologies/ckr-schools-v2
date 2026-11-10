import { pgPool } from '../../config/db.js';

/**
 * Timetable & Proxy Substitution Repository (ADO)
 */

// ============================================================================
// 1. TIMETABLE SETTINGS (Bell Schedule)
// ============================================================================

export async function getSettings(tenantId, academicYear = '2026-2027') {
  const cleanYear = (academicYear || '2026-2027').replace(/\s+/g, '');
  const query = `
    SELECT * FROM timetable_settings
    WHERE tenant_id = $1 AND (REPLACE(academic_year, ' ', '') = $2 OR academic_year = $3)
    ORDER BY updated_at DESC
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, cleanYear, academicYear || '2026-2027']);
  return rows[0] || null;
}

export async function upsertSettings(tenantId, data) {
  const query = `
    INSERT INTO timetable_settings (
      tenant_id, academic_year, school_start_time, period_duration_minutes,
      assembly_duration_minutes, recess_after_period, recess_duration_minutes,
      lunch_after_period, lunch_duration_minutes, periods_per_day,
      saturday_periods, max_daily_subject_periods, is_active, updated_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13, NOW()
    )
    ON CONFLICT (tenant_id, academic_year)
    DO UPDATE SET 
      school_start_time = EXCLUDED.school_start_time,
      period_duration_minutes = EXCLUDED.period_duration_minutes,
      assembly_duration_minutes = EXCLUDED.assembly_duration_minutes,
      recess_after_period = EXCLUDED.recess_after_period,
      recess_duration_minutes = EXCLUDED.recess_duration_minutes,
      lunch_after_period = EXCLUDED.lunch_after_period,
      lunch_duration_minutes = EXCLUDED.lunch_duration_minutes,
      periods_per_day = EXCLUDED.periods_per_day,
      saturday_periods = EXCLUDED.saturday_periods,
      max_daily_subject_periods = EXCLUDED.max_daily_subject_periods,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.academic_year || '2026-2027',
    data.school_start_time || '08:00 AM',
    data.period_duration_minutes ? Number(data.period_duration_minutes) : 50,
    data.assembly_duration_minutes !== undefined && data.assembly_duration_minutes !== null ? Number(data.assembly_duration_minutes) : 0,
    data.recess_after_period ? Number(data.recess_after_period) : 4,
    data.recess_duration_minutes !== undefined && data.recess_duration_minutes !== null ? Number(data.recess_duration_minutes) : 0,
    data.lunch_after_period ? Number(data.lunch_after_period) : 6,
    data.lunch_duration_minutes !== undefined && data.lunch_duration_minutes !== null ? Number(data.lunch_duration_minutes) : 0,
    data.periods_per_day ? Number(data.periods_per_day) : 8,
    data.saturday_periods !== undefined && data.saturday_periods !== null ? Number(data.saturday_periods) : 5,
    data.max_daily_subject_periods ? Number(data.max_daily_subject_periods) : 1,
    data.is_active !== undefined ? Boolean(data.is_active) : true
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

// ============================================================================
// 2. TIMETABLE PERIOD ENTRIES
// ============================================================================

export async function getAllTimetablesGrouped(tenantId, classId = null) {
  let query = `
    SELECT 
      t.id, t.class_id, t.day_of_week, t.time_slot, t.subject,
      t.teacher_id, t.room_number, t.is_break, 
      TO_CHAR(t.date, 'YYYY-MM-DD') as date, 
      t.teacher, t.created_at,
      u.name as teacher_name,
      c.name as class_name, c.section as class_section
    FROM timetable t
    LEFT JOIN "user" u ON t.teacher_id = u.id AND u.tenant_id = t.tenant_id
    LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1
  `;
  const values = [tenantId];
  if (classId) {
    query += ` AND t.class_id = $2`;
    values.push(classId);
  }
  query += ` ORDER BY t.date ASC NULLS LAST, t.time_slot ASC;`;

  const { rows } = await pgPool.query(query, values);

  const groupedData = {};
  rows.forEach(row => {
    const cId = row.class_id;
    if (!groupedData[cId]) {
      groupedData[cId] = {
        id: row.id,
        classId: cId,
        className: row.class_name || 'Class',
        section: row.class_section || '',
        dates: {}
      };
    }
    const dateStr = row.date || 'Regular';

    if (!groupedData[cId].dates[dateStr]) {
      groupedData[cId].dates[dateStr] = [];
    }

    const periodObj = {
      id: row.id,
      teacher: row.teacher_id,
      teacherName: row.teacher_name || row.teacher,
      time: row.time_slot,
      subject: row.subject,
      isBreak: row.is_break,
      roomNumber: row.room_number
    };

    const existingIdx = groupedData[cId].dates[dateStr].findIndex(p => p.time === row.time_slot);
    if (existingIdx !== -1) {
      if ((!groupedData[cId].dates[dateStr][existingIdx].subject || groupedData[cId].dates[dateStr][existingIdx].subject === 'Unassigned') && row.subject) {
        groupedData[cId].dates[dateStr][existingIdx] = periodObj;
      }
    } else {
      groupedData[cId].dates[dateStr].push(periodObj);
    }
  });

  return Object.values(groupedData);
}

export async function updatePeriod(tenantId, id, data) {
  const payload = data?.data || data;
  const timeSlot = payload.time || payload.time_slot;
  const subject = payload.subject || null;
  const rawTeacher = payload.teacher || payload.teacher_id || null;
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const teacherId = (rawTeacher && UUID_REGEX.test(rawTeacher)) ? rawTeacher : null;
  const teacherName = (rawTeacher && !UUID_REGEX.test(rawTeacher)) ? rawTeacher : null;
  const isBreak = payload.isBreak !== undefined ? payload.isBreak : (payload.is_break !== undefined ? payload.is_break : null);
  const roomNumber = payload.roomNumber || payload.room_number || null;

  let date = payload.date || null;
  if (date && typeof date === 'string' && date.includes('T')) {
    date = date.split('T')[0];
  }
  let dayOfWeek = null;
  if (date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parsed = new Date(date + 'T00:00:00');
    dayOfWeek = days[parsed.getDay()] || 'Monday';
  }

  const query = `
    UPDATE timetable
    SET time_slot = COALESCE($3, time_slot),
        subject = COALESCE($4, subject),
        teacher_id = COALESCE($5, teacher_id),
        is_break = COALESCE($6, is_break),
        room_number = COALESCE($7, room_number),
        teacher = COALESCE($8, teacher),
        date = COALESCE($9::date, date),
        day_of_week = COALESCE($10, day_of_week)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id, class_id, TO_CHAR(date, 'YYYY-MM-DD') as date, day_of_week, teacher_id, time_slot, subject, is_break, room_number, teacher, created_at;
  `;
  const { rows } = await pgPool.query(query, [id, tenantId, timeSlot, subject, teacherId, isBreak, roomNumber, teacherName, date, dayOfWeek]);
  return rows[0] || null;
}

export async function duplicateDaySchedule(tenantId, { classId, sourceDate, targetStartDate, targetEndDate }) {
  const { rows: sourcePeriods } = await pgPool.query(
    `SELECT * FROM timetable WHERE tenant_id = $1 AND class_id = $2 AND date = $3::date;`,
    [tenantId, classId, sourceDate]
  );
  if (!sourcePeriods.length) {
    const error = new Error('No periods found on source date to duplicate.');
    error.status = 404;
    throw error;
  }

  const start = new Date(targetStartDate);
  const end = new Date(targetEndDate);
  let copiedCount = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });

    for (const p of sourcePeriods) {
      await pgPool.query(
        `INSERT INTO timetable (tenant_id, class_id, day_of_week, time_slot, subject, teacher_id, room_number, is_break, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date)
         ON CONFLICT DO NOTHING;`,
        [tenantId, classId, dayOfWeek, p.time_slot, p.subject, p.teacher_id, p.room_number, p.is_break, dateStr]
      );
      copiedCount++;
    }
  }

  return { success: true, message: `Successfully duplicated schedule to target dates (${copiedCount} periods).` };
}

export async function getClassTimetable(tenantId, classId) {
  const query = `
    SELECT 
      t.id, t.class_id, t.day_of_week, t.time_slot, t.subject,
      t.teacher_id, t.room_number, t.is_break, t.created_at,
      u.name as teacher_name
    FROM timetable t
    LEFT JOIN "user" u ON t.teacher_id = u.id AND u.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.class_id = $2
    ORDER BY 
      CASE t.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        ELSE 7
      END,
      t.time_slot ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, classId]);
  return rows;
}

export async function createPeriod(tenantId, data) {
  // If a period already exists for this tenant, class, date, and exact time_slot, update it instead of duplicating
  if (data.date && data.time_slot) {
    const existing = await pgPool.query(
      `SELECT id FROM timetable WHERE tenant_id = $1 AND class_id = $2 AND date = $3::date AND time_slot = $4 LIMIT 1;`,
      [tenantId, data.class_id, data.date, data.time_slot]
    );
    if (existing.rows.length > 0) {
      const updateQuery = `
        UPDATE timetable
        SET subject = $4,
            teacher_id = $5,
            room_number = $6,
            is_break = $7,
            teacher = $8,
            day_of_week = $9
        WHERE id = $1 AND tenant_id = $2 AND class_id = $3
        RETURNING id, tenant_id, class_id, TO_CHAR(date, 'YYYY-MM-DD') as date, day_of_week, teacher_id, time_slot, subject, is_break, room_number, teacher, created_at;
      `;
      const upRes = await pgPool.query(updateQuery, [
        existing.rows[0].id,
        tenantId,
        data.class_id,
        data.subject,
        data.teacher_id || null,
        data.room_number || null,
        data.is_break || false,
        data.teacher_name || data.teacher || null,
        data.day_of_week || 'Monday'
      ]);
      return upRes.rows[0];
    }
  }

  const query = `
    INSERT INTO timetable (
      tenant_id, class_id, day_of_week, time_slot, subject,
      teacher_id, room_number, is_break, date, teacher
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9::date, $10
    )
    RETURNING id, tenant_id, class_id, TO_CHAR(date, 'YYYY-MM-DD') as date, day_of_week, teacher_id, time_slot, subject, is_break, room_number, teacher, created_at;
  `;
  const values = [
    tenantId,
    data.class_id,
    data.day_of_week || 'Monday',
    data.time_slot,
    data.subject,
    data.teacher_id || null,
    data.room_number || null,
    data.is_break || false,
    data.date || null,
    data.teacher_name || data.teacher || null
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function deletePeriod(tenantId, periodId) {
  const query = `
    DELETE FROM timetable
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [periodId, tenantId]);
  return rows[0] || null;
}

// ============================================================================
// 3. DAILY PROXIES & SUBSTITUTIONS
// ============================================================================

export async function listDailyProxies(tenantId, date) {
  const query = `
    SELECT 
      dpa.id, dpa.date, dpa.period_index, dpa.time_slot, dpa.class_id,
      dpa.original_faculty_id, dpa.substitute_faculty_id, dpa.subject,
      dpa.room_number, dpa.reason, dpa.status, dpa.created_at,
      c.name as class_name, c.section as class_section,
      orig.name as original_faculty_name,
      subst.name as substitute_faculty_name
    FROM daily_proxy_assignments dpa
    INNER JOIN class c ON dpa.class_id = c.id AND c.tenant_id = dpa.tenant_id
    LEFT JOIN "user" orig ON dpa.original_faculty_id = orig.id AND orig.tenant_id = dpa.tenant_id
    INNER JOIN "user" subst ON dpa.substitute_faculty_id = subst.id AND subst.tenant_id = dpa.tenant_id
    WHERE dpa.tenant_id = $1 AND dpa.date = $2::date
    ORDER BY dpa.period_index ASC;
  `;
  const { rows } = await pgPool.query(query, [tenantId, date]);
  return rows;
}

export async function createProxy(tenantId, createdBy, data) {
  let validCreatedBy = null;
  if (createdBy) {
    const userCheck = await pgPool.query(
      `SELECT id FROM "user" WHERE id = $1 AND tenant_id = $2;`,
      [createdBy, tenantId]
    );
    if (userCheck.rows.length > 0) {
      validCreatedBy = createdBy;
    }
  }

  const query = `
    INSERT INTO daily_proxy_assignments (
      tenant_id, date, period_index, time_slot, class_id,
      original_faculty_id, substitute_faculty_id, subject,
      room_number, reason, status, created_by
    ) VALUES (
      $1, $2::date, $3, $4, $5,
      $6, $7, $8,
      $9, $10, 'assigned', $11
    )
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.date,
    data.period_index,
    data.time_slot,
    data.class_id,
    data.original_faculty_id || null,
    data.substitute_faculty_id,
    data.subject || null,
    data.room_number || null,
    data.reason || null,
    validCreatedBy
  ];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
}

export async function removeProxy(tenantId, proxyId) {
  const query = `
    DELETE FROM daily_proxy_assignments
    WHERE id = $1 AND tenant_id = $2
    RETURNING id;
  `;
  const { rows } = await pgPool.query(query, [proxyId, tenantId]);
  return rows[0] || null;
}

export async function getFreeTeachers(tenantId, filters = {}) {
  const queryDate = filters.date || new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date(queryDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // 1. All active teachers
  const teachersRes = await pgPool.query(
    `SELECT id, name, email, phone, avatar_url, weekly_quota
     FROM "user"
     WHERE tenant_id = $1 AND type = 'teacher' AND (status IS NULL OR status != 'inactive')
     ORDER BY name ASC;`,
    [tenantId]
  );
  const teachers = teachersRes.rows;

  // 2. Timetable for today or recurring day_of_week
  let ttRes = await pgPool.query(
    `SELECT t.id, t.date, t.day_of_week, t.time_slot, t.subject, t.is_break, t.room_number, t.class_id, t.teacher_id,
            c.name as class_name, c.section as class_section
     FROM timetable t
     LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
     WHERE t.tenant_id = $1 AND t.date = $2::date;`,
    [tenantId, queryDate]
  );

  if (ttRes.rows.length === 0) {
    ttRes = await pgPool.query(
      `SELECT t.id, t.date, t.day_of_week, t.time_slot, t.subject, t.is_break, t.room_number, t.class_id, t.teacher_id,
              c.name as class_name, c.section as class_section
       FROM timetable t
       LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
       WHERE t.tenant_id = $1 AND LOWER(t.day_of_week) = LOWER($2);`,
      [tenantId, dayOfWeek]
    );
  }
  const timetables = ttRes.rows;

  // 3. Daily proxies for today
  const proxiesRes = await pgPool.query(
    `SELECT dpa.*, c.name as class_name, c.section as class_section,
            orig.name as original_faculty_name, subst.name as substitute_faculty_name
     FROM daily_proxy_assignments dpa
     LEFT JOIN class c ON dpa.class_id = c.id AND c.tenant_id = dpa.tenant_id
     LEFT JOIN "user" orig ON dpa.original_faculty_id = orig.id AND orig.tenant_id = dpa.tenant_id
     LEFT JOIN "user" subst ON dpa.substitute_faculty_id = subst.id AND subst.tenant_id = dpa.tenant_id
     WHERE dpa.tenant_id = $1 AND dpa.date = $2::date AND (dpa.status IS NULL OR dpa.status != 'cancelled')
     ORDER BY dpa.period_index ASC;`,
    [tenantId, queryDate]
  );
  const dailyProxies = proxiesRes.rows;

  const slotSet = new Set();
  const teacherLoadToday = {};
  const primarySubjectsMap = {};

  teachers.forEach(t => {
    teacherLoadToday[t.id] = 0;
    primarySubjectsMap[t.id] = new Set();
  });

  timetables.forEach(r => {
    if (r.time_slot) slotSet.add(r.time_slot.trim());
    if (r.teacher_id && !r.is_break) {
      teacherLoadToday[r.teacher_id] = (teacherLoadToday[r.teacher_id] || 0) + 1;
      if (r.subject) primarySubjectsMap[r.teacher_id]?.add(r.subject);
    }
  });

  dailyProxies.forEach(p => {
    if (p.time_slot) slotSet.add(p.time_slot.trim());
    if (p.substitute_faculty_id) {
      teacherLoadToday[p.substitute_faculty_id] = (teacherLoadToday[p.substitute_faculty_id] || 0) + 1;
    }
  });

  const allSlots = Array.from(slotSet).sort((a, b) => a.localeCompare(b));
  const activeSlot = (filters.timeSlot && filters.timeSlot.trim()) || allSlots[0] || 'Period 1 (08:00 AM - 08:50 AM)';

  const engagedMap = new Map();
  timetables.forEach(r => {
    if (r.time_slot && r.time_slot.trim() === activeSlot.trim() && r.teacher_id && !r.is_break) {
      const className = r.class_name ? `${r.class_name}${r.class_section ? ` - ${r.class_section}` : ''}` : 'Class';
      engagedMap.set(r.teacher_id, {
        timetableId: r.id,
        subject: r.subject,
        className,
        roomNumber: r.room_number || '-',
        isProxy: false
      });
    }
  });

  dailyProxies.forEach(p => {
    if (p.time_slot && p.time_slot.trim() === activeSlot.trim() && p.substitute_faculty_id) {
      const className = p.class_name ? `${p.class_name}${p.class_section ? ` - ${p.class_section}` : ''}` : 'Class';
      engagedMap.set(p.substitute_faculty_id, {
        proxyId: p.id,
        subject: p.subject || 'Substitution',
        className,
        roomNumber: p.room_number || '-',
        isProxy: true,
        originalTeacherName: p.original_faculty_name || 'Absent Staff',
        reason: p.reason
      });
    }
  });

  const engagedTeachers = [];
  const freeTeachers = [];

  teachers.forEach(t => {
    const meta = {
      id: t.id,
      name: t.name || 'Teacher',
      email: t.email,
      phone: t.phone,
      avatarUrl: t.avatar_url,
      weeklyQuota: t.weekly_quota ? Number(t.weekly_quota) : 28,
      periodsToday: teacherLoadToday[t.id] || 0,
      primarySubjects: Array.from(primarySubjectsMap[t.id] || [])
    };

    if (engagedMap.has(t.id)) {
      engagedTeachers.push({ ...meta, currentDuty: engagedMap.get(t.id) });
    } else {
      freeTeachers.push({ ...meta, isFree: true });
    }
  });

  freeTeachers.sort((a, b) => a.periodsToday - b.periodsToday);

  return {
    date: queryDate,
    dayOfWeek,
    selectedSlot: activeSlot,
    allSlots,
    summary: {
      totalTeachers: teachers.length,
      engagedCount: engagedTeachers.length,
      freeCount: freeTeachers.length,
      proxyCount: dailyProxies.length
    },
    engagedTeachers,
    freeTeachers,
    dailyProxies
  };
}

export async function assignAllotment(tenantId, data) {
  const classId = data.classId || data.class_id;
  const subjectId = data.subjectId || data.subject_id;
  const teacherId = data.teacherId || data.teacher_id;
  const quota = data.quota !== undefined ? data.quota : data.weeklyQuota;
  const subjectName = data.subjectName || data.name;
  let resolvedSubjectId = subjectId;

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!resolvedSubjectId || !UUID_REGEX.test(resolvedSubjectId)) {
    if (subjectName && subjectName.trim()) {
      const subRes = await pgPool.query(
        `SELECT id FROM subject WHERE tenant_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1;`,
        [tenantId, subjectName.trim()]
      );
      if (subRes.rows.length > 0) {
        resolvedSubjectId = subRes.rows[0].id;
      } else {
        const insertSub = await pgPool.query(
          `INSERT INTO subject (tenant_id, name) VALUES ($1, $2) RETURNING id;`,
          [tenantId, subjectName.trim()]
        );
        resolvedSubjectId = insertSub.rows[0].id;
      }
    }
  }

  if (!resolvedSubjectId) {
    throw new Error('Valid subjectId or subjectName is required');
  }

  // Handle teacher allotment in subject_teachers
  if (teacherId && UUID_REGEX.test(teacherId)) {
    await pgPool.query(
      `INSERT INTO subject_teachers (tenant_id, class_id, subject_id, teacher_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, subject_id, class_id)
       DO UPDATE SET teacher_id = EXCLUDED.teacher_id;`,
      [tenantId, classId, resolvedSubjectId, teacherId]
    );
  } else {
    // Empty teacher -> unassign
    await pgPool.query(
      `DELETE FROM subject_teachers
       WHERE tenant_id = $1 AND class_id = $2 AND subject_id = $3;`,
      [tenantId, classId, resolvedSubjectId]
    );
  }

  // Handle weekly quota in class_subjects
  if (quota !== undefined && quota !== null && !isNaN(Number(quota))) {
    const q = Number(quota);
    await pgPool.query(
      `INSERT INTO class_subjects (tenant_id, class_id, subject_id, weekly_quota)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, class_id, subject_id)
       DO UPDATE SET weekly_quota = EXCLUDED.weekly_quota;`,
      [tenantId, classId, resolvedSubjectId, q]
    );
  }

  return { success: true, message: 'Teacher allotment updated successfully', subjectId: resolvedSubjectId };
}

export async function getStudentClassId(tenantId, studentId) {
  const query = `
    SELECT class_id FROM class_students
    WHERE tenant_id = $1 AND student_id = $2
    LIMIT 1;
  `;
  const { rows } = await pgPool.query(query, [tenantId, studentId]);
  return rows[0]?.class_id || null;
}

// ============================================================================
// 4. TEACHER SCHEDULE, WORKLOAD & ALLOTMENT MATRICES
// ============================================================================

export async function listTeachersWithScheduleStats(tenantId) {
  const teachersRes = await pgPool.query(
    `SELECT id, name, email, phone, avatar_url, weekly_quota
     FROM "user"
     WHERE tenant_id = $1 AND type = 'teacher' AND (status IS NULL OR status != 'inactive')
     ORDER BY name ASC;`,
    [tenantId]
  );
  const teachers = teachersRes.rows;

  const ttRes = await pgPool.query(
    `SELECT t.teacher_id, t.subject, t.time_slot, t.day_of_week, t.is_break,
            c.name as class_name, c.section as class_section
     FROM timetable t
     LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
     WHERE t.tenant_id = $1 AND t.teacher_id IS NOT NULL;`,
    [tenantId]
  );

  const teacherStatsMap = new Map();
  ttRes.rows.forEach(row => {
    const tid = row.teacher_id;
    if (!teacherStatsMap.has(tid)) {
      teacherStatsMap.set(tid, {
        subjects: new Set(),
        classes: new Set(),
        weeklySlots: new Set(),
        totalPeriodsCount: 0
      });
    }
    const stats = teacherStatsMap.get(tid);
    if (row.subject && !row.is_break) stats.subjects.add(row.subject);
    if (row.class_name) {
      stats.classes.add(`${row.class_name}${row.class_section ? ` - ${row.class_section}` : ''}`);
    }
    if (row.day_of_week && row.time_slot && !row.is_break) {
      stats.weeklySlots.add(`${row.day_of_week.toLowerCase()}__${row.time_slot}`);
    }
    stats.totalPeriodsCount += 1;
  });

  return teachers.map(t => {
    const stats = teacherStatsMap.get(t.id);
    return {
      id: t.id,
      name: t.name || 'Unnamed Teacher',
      email: t.email || '',
      phone: t.phone || '',
      profileUrl: t.avatar_url || null,
      weeklyQuota: t.weekly_quota || 30,
      subjectsTaught: stats ? Array.from(stats.subjects) : [],
      assignedClasses: stats ? Array.from(stats.classes) : [],
      weeklyRoutineLoad: stats ? stats.weeklySlots.size : 0,
      totalScheduledSessions: stats ? stats.totalPeriodsCount : 0
    };
  });
}

export async function getTeacherWeeklyRoutine(tenantId, teacherId, filters = {}) {
  const teacherRes = await pgPool.query(
    `SELECT id, name, email, phone, avatar_url, weekly_quota FROM "user" WHERE id = $1 AND tenant_id = $2;`,
    [teacherId, tenantId]
  );
  const teacher = teacherRes.rows[0];
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.status = 404;
    throw err;
  }

  let query = `
    SELECT t.id, TO_CHAR(t.date, 'YYYY-MM-DD') as date, t.day_of_week, t.time_slot,
           t.subject, t.is_break, t.room_number, t.class_id,
           c.name as class_name, c.section as class_section
    FROM timetable t
    LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.teacher_id = $2
  `;
  const params = [tenantId, teacherId];
  if (filters.startDate) {
    params.push(filters.startDate);
    query += ` AND t.date >= $${params.length}::date`;
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    query += ` AND t.date <= $${params.length}::date`;
  }
  query += ` ORDER BY t.time_slot ASC;`;

  const { rows: periods } = await pgPool.query(query, params);

  const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const routineByDay = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
  };
  const seenDaySlots = new Set();
  const allTimeSlotsSet = new Set();
  const subjectsCount = {};
  const classesCount = {};

  periods.forEach(p => {
    let day = (p.day_of_week || '').toLowerCase();
    if (!day && p.date) {
      day = new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    }
    if (!DAYS_OF_WEEK.includes(day)) return;

    const slotKey = `${day}__${p.time_slot}`;
    if (!seenDaySlots.has(slotKey)) {
      seenDaySlots.add(slotKey);
      const className = p.class_name ? `${p.class_name}${p.class_section ? ` - ${p.class_section}` : ''}` : 'General';
      const periodObj = {
        id: p.id,
        timeSlot: p.time_slot,
        subject: p.subject || (p.is_break ? 'Break / Lunch' : 'Class'),
        isBreak: !!p.is_break,
        roomNumber: p.room_number || '-',
        classId: p.class_id,
        className,
        date: p.date
      };
      routineByDay[day].push(periodObj);
      if (p.time_slot) allTimeSlotsSet.add(p.time_slot);

      if (!p.is_break && p.subject) {
        subjectsCount[p.subject] = (subjectsCount[p.subject] || 0) + 1;
        classesCount[className] = (classesCount[className] || 0) + 1;
      }
    }
  });

  const sortedTimeSlots = Array.from(allTimeSlotsSet).sort((a, b) => a.localeCompare(b));
  DAYS_OF_WEEK.forEach(day => {
    routineByDay[day].sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  });

  const totalPeriodsPerWeek = seenDaySlots.size;
  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      profileUrl: teacher.avatar_url,
      weeklyQuota: teacher.weekly_quota || 30
    },
    routine: routineByDay,
    allTimeSlots: sortedTimeSlots,
    summary: {
      totalPeriodsPerWeek,
      uniqueSubjectsCount: Object.keys(subjectsCount).length,
      uniqueClassesCount: Object.keys(classesCount).length,
      subjectsBreakdown: subjectsCount,
      classesBreakdown: classesCount
    }
  };
}

export async function getTeacherFullYearSchedule(tenantId, teacherId, filters = {}) {
  const teacherRes = await pgPool.query(
    `SELECT id, name, email, phone, avatar_url, weekly_quota FROM "user" WHERE id = $1 AND tenant_id = $2;`,
    [teacherId, tenantId]
  );
  const teacher = teacherRes.rows[0];
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.status = 404;
    throw err;
  }

  let query = `
    SELECT t.id, TO_CHAR(t.date, 'YYYY-MM-DD') as date, t.day_of_week, t.time_slot,
           t.subject, t.is_break, t.room_number, t.class_id,
           c.name as class_name, c.section as class_section
    FROM timetable t
    LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
    WHERE t.tenant_id = $1 AND t.teacher_id = $2 AND t.date IS NOT NULL
  `;
  const params = [tenantId, teacherId];
  if (filters.startDate) {
    params.push(filters.startDate);
    query += ` AND t.date >= $${params.length}::date`;
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    query += ` AND t.date <= $${params.length}::date`;
  }
  query += ` ORDER BY t.date ASC, t.time_slot ASC;`;

  const { rows } = await pgPool.query(query, params);

  const monthlyBreakdown = {};
  let upcomingCount = 0;
  const todayStr = new Date().toISOString().split('T')[0];

  const scheduledPeriods = rows.map(r => {
    if (r.date && r.date >= todayStr) upcomingCount++;
    if (r.date) {
      const monthKey = r.date.substring(0, 7);
      monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1;
    }
    return {
      id: r.id,
      date: r.date,
      dayOfWeek: r.day_of_week,
      timeSlot: r.time_slot,
      subject: r.subject,
      isBreak: r.is_break,
      roomNumber: r.room_number,
      classId: r.class_id,
      className: r.class_name ? `${r.class_name}${r.class_section ? ` - ${r.class_section}` : ''}` : 'General'
    };
  });

  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      profileUrl: teacher.avatar_url,
      weeklyQuota: teacher.weekly_quota || 30
    },
    sessions: scheduledPeriods,
    scheduledPeriods,
    totalScheduledCount: scheduledPeriods.length,
    totalSessions: scheduledPeriods.length,
    monthlyDistribution: monthlyBreakdown,
    monthlyBreakdown,
    upcomingCount
  };
}

export async function getWorkloadMatrix(tenantId) {
  const teachersRes = await pgPool.query(
    `SELECT id, name, email, phone, avatar_url, weekly_quota
     FROM "user"
     WHERE tenant_id = $1 AND type = 'teacher' AND (status IS NULL OR status != 'inactive')
     ORDER BY name ASC;`,
    [tenantId]
  );

  const ttRes = await pgPool.query(
    `SELECT t.teacher_id, t.day_of_week, t.time_slot, t.is_break, t.subject,
            c.name as class_name, c.section as class_section
     FROM timetable t
     LEFT JOIN class c ON t.class_id = c.id AND c.tenant_id = t.tenant_id
     WHERE t.tenant_id = $1 AND t.teacher_id IS NOT NULL AND (t.is_break IS FALSE OR t.is_break IS NULL);`,
    [tenantId]
  );

  const matrixMap = new Map();
  teachersRes.rows.forEach(t => {
    matrixMap.set(t.id, {
      id: t.id,
      name: t.name || 'Unnamed Teacher',
      email: t.email,
      phone: t.phone,
      avatarUrl: t.avatar_url,
      quota: t.weekly_quota || 30,
      monday: new Set(),
      tuesday: new Set(),
      wednesday: new Set(),
      thursday: new Set(),
      friday: new Set(),
      saturday: new Set(),
      subjects: new Set(),
      classes: new Set()
    });
  });

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  ttRes.rows.forEach(r => {
    const tid = r.teacher_id;
    const item = matrixMap.get(tid);
    if (!item) return;

    const day = (r.day_of_week || '').toLowerCase();
    if (DAYS.includes(day) && r.time_slot) {
      item[day].add(r.time_slot);
    }
    if (r.subject) item.subjects.add(r.subject);
    if (r.class_name) item.classes.add(`${r.class_name}${r.class_section ? ` - ${r.class_section}` : ''}`);
  });

  let totalWeeklyPeriods = 0;
  let highLoadCount = 0;
  let underutilizedCount = 0;

  const teachers = Array.from(matrixMap.values()).map(m => {
    const mon = m.monday.size;
    const tue = m.tuesday.size;
    const wed = m.wednesday.size;
    const thu = m.thursday.size;
    const fri = m.friday.size;
    const sat = m.saturday.size;
    const weeklyTotal = mon + tue + wed + thu + fri + sat;
    totalWeeklyPeriods += weeklyTotal;

    const utilizationPercent = m.quota > 0 ? Math.round((weeklyTotal / m.quota) * 100) : 0;
    if (utilizationPercent > 100) highLoadCount++;
    else if (utilizationPercent < 60) underutilizedCount++;

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      avatarUrl: m.avatarUrl,
      quota: m.quota,
      weeklyQuota: m.quota,
      totalPeriods: weeklyTotal,
      weeklyTotal,
      teacher: {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        avatarUrl: m.avatarUrl,
        weeklyQuota: m.quota
      },
      monday: mon,
      tuesday: tue,
      wednesday: wed,
      thursday: thu,
      friday: fri,
      saturday: sat,
      utilizationPercent,
      subjectsTaught: Array.from(m.subjects),
      assignedClasses: Array.from(m.classes)
    };
  });

  const totalTeachers = teachers.length;
  const avgPeriodsPerTeacher = totalTeachers > 0 ? Math.round(totalWeeklyPeriods / totalTeachers) : 0;

  return {
    matrix: teachers,
    teachers,
    days: DAYS,
    timeSlots: ['08:00 - 08:45', '08:45 - 09:30', '09:45 - 10:30', '10:30 - 11:15', '11:15 - 12:00', '12:45 - 01:30', '01:30 - 02:15'],
    summary: {
      totalTeachers,
      totalWeeklyPeriods,
      avgPeriodsPerTeacher,
      highLoadTeachers: highLoadCount,
      underutilizedTeachers: underutilizedCount
    }
  };
}

export async function getMasterAllotmentMatrix(tenantId) {
  const [classesRes, subjectsRes, classSubRes, subTeachRes, ttRes, classTeachersRes] = await Promise.all([
    pgPool.query(`SELECT id, name, section FROM class WHERE tenant_id = $1 ORDER BY name, section;`, [tenantId]),
    pgPool.query(`SELECT id, name, category FROM subject WHERE tenant_id = $1 ORDER BY name;`, [tenantId]),
    pgPool.query(`SELECT class_id, subject_id, weekly_quota, is_lab_required, allow_double_period FROM class_subjects WHERE tenant_id = $1;`, [tenantId]),
    pgPool.query(
      `SELECT st.class_id, st.subject_id, st.teacher_id, u.name as teacher_name
       FROM subject_teachers st
       JOIN "user" u ON st.teacher_id = u.id AND u.tenant_id = st.tenant_id
       WHERE st.tenant_id = $1;`,
      [tenantId]
    ),
    pgPool.query(
      `SELECT DISTINCT class_id, subject, day_of_week, time_slot
       FROM timetable
       WHERE tenant_id = $1 AND (is_break IS FALSE OR is_break IS NULL) AND subject IS NOT NULL;`,
      [tenantId]
    ),
    pgPool.query(
      `SELECT ct.class_id, ct.teacher_id, u.name as teacher_name
       FROM class_teachers ct
       JOIN "user" u ON ct.teacher_id = u.id AND u.tenant_id = ct.tenant_id
       WHERE ct.tenant_id = $1;`,
      [tenantId]
    ).catch(() => ({ rows: [] }))
  ]);

  const classTeachersMap = {};
  (classTeachersRes.rows || []).forEach(ct => {
    if (!classTeachersMap[ct.class_id]) classTeachersMap[ct.class_id] = [];
    if (ct.teacher_name && !classTeachersMap[ct.class_id].includes(ct.teacher_name)) {
      classTeachersMap[ct.class_id].push(ct.teacher_name);
    }
  });

  const classes = classesRes.rows.map(c => {
    const teachersList = classTeachersMap[c.id] || [];
    const count = teachersList.length;
    let display = "In-Charge";
    if (count === 1) {
      display = teachersList[0].split(/\s+/)[0] || teachersList[0];
    } else if (count > 1) {
      display = `${teachersList[0].split(/\s+/)[0]} +${count - 1} others`;
    }
    const label = `${c.name}${c.section ? ` ${c.section}` : ''}`.trim();
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      label,
      displayName: label,
      classTeacher: display,
      classTeachersCount: count,
      classTeachersList: teachersList
    };
  });

  const subjects = subjectsRes.rows.map(s => {
    const rawCat = (s.category || '').toLowerCase();
    const isAcademic = rawCat === 'academics' || rawCat === 'scholastic' || rawCat === 'academic' || rawCat === 'core';
    return {
      id: s.id,
      name: s.name,
      category: isAcademic ? 'academics' : (s.category || 'co_curricular'),
      originalCategory: s.category
    };
  });

  const quotaMap = new Map();
  classSubRes.rows.forEach(cs => {
    quotaMap.set(`${cs.class_id}__${cs.subject_id}`, cs.weekly_quota || 0);
  });

  const teacherMap = new Map();
  subTeachRes.rows.forEach(st => {
    const key = `${st.class_id}__${st.subject_id}`;
    if (!teacherMap.has(key)) teacherMap.set(key, []);
    teacherMap.get(key).push({ id: st.teacher_id, name: st.teacher_name });
  });

  const scheduledCountMap = new Map();
  ttRes.rows.forEach(t => {
    const subMatch = subjects.find(s => s.name.toLowerCase() === (t.subject || '').trim().toLowerCase());
    if (subMatch) {
      const key = `${t.class_id}__${subMatch.id}`;
      scheduledCountMap.set(key, (scheduledCountMap.get(key) || 0) + 1);
    }
  });

  const matrix = {};
  const totals = {};
  const classQuotas = {};

  classes.forEach(c => {
    matrix[c.id] = {};
    totals[c.id] = {
      academics: 0,
      coCurricular: 0,
      total: 0,
      academicsTarget: 0,
      coCurricularTarget: 0,
      totalTarget: 0
    };
    classQuotas[c.id] = {};

    subjects.forEach(s => {
      const key = `${c.id}__${s.id}`;
      const quota = quotaMap.get(key) || 0;
      const scheduled = scheduledCountMap.get(key) || 0;
      const assignedTeachers = teacherMap.get(key) || [];
      const primaryTeacher = assignedTeachers[0] || null;
      const primaryTeacherName = primaryTeacher ? primaryTeacher.name : '';
      const primaryTeacherShort = primaryTeacherName ? primaryTeacherName.split(/\s+/)[0] : '';
      const primaryTeacherId = primaryTeacher ? primaryTeacher.id : null;

      classQuotas[c.id][s.id] = quota;

      const isAcademic = s.category === 'academics';
      if (quota > 0) {
        if (isAcademic) totals[c.id].academicsTarget += quota;
        else totals[c.id].coCurricularTarget += quota;
        totals[c.id].totalTarget += quota;
      }
      if (scheduled > 0) {
        if (isAcademic) totals[c.id].academics += scheduled;
        else totals[c.id].coCurricular += scheduled;
        totals[c.id].total += scheduled;
      }

      matrix[c.id][s.id] = {
        periods: scheduled,
        teacher: primaryTeacherName,
        shortTeacher: primaryTeacherShort,
        teacherId: primaryTeacherId,
        quota: quota > 0 ? quota : null,
        classId: c.id,
        subjectId: s.id,
        allTeachers: assignedTeachers,
        status: scheduled === quota && quota > 0 ? 'MATCHED' : (scheduled < quota ? 'DEFICIT' : (scheduled > quota && quota > 0 ? 'EXCEEDED' : 'UNSET'))
      };
    });
  });

  const allotmentsList = classes.map(c => ({
    classId: c.id,
    className: c.displayName,
    allotments: subjects.map(s => {
      const cell = matrix[c.id][s.id];
      return {
        subjectId: s.id,
        subjectName: s.name,
        category: s.category,
        requiredQuota: cell.quota || 0,
        scheduledPeriods: cell.periods || 0,
        assignedTeachers: cell.allTeachers || [],
        status: cell.status
      };
    })
  }));

  return {
    classes,
    subjects,
    matrix,
    allotments: allotmentsList,
    totals,
    classQuotas
  };
}

export async function getSubjectQuotas(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT class_id, subject_id, weekly_quota, is_lab_required, allow_double_period
     FROM class_subjects
     WHERE tenant_id = $1;`,
    [tenantId]
  );
  const flatQuotas = {};
  const nestedQuotas = {};
  rows.forEach(r => {
    const q = r.weekly_quota !== null && r.weekly_quota !== undefined ? Number(r.weekly_quota) : 0;
    flatQuotas[`${r.class_id}__${r.subject_id}`] = {
      weeklyQuota: q,
      isLabRequired: !!r.is_lab_required,
      allowDoublePeriod: !!r.allow_double_period
    };
    if (!nestedQuotas[r.class_id]) nestedQuotas[r.class_id] = {};
    nestedQuotas[r.class_id][r.subject_id] = q;
  });
  return { classSubjectQuotas: nestedQuotas, quotas: nestedQuotas, flatQuotas };
}

export async function saveSubjectQuotas(tenantId, payload) {
  const items = [];

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (item && typeof item === 'object') {
        items.push({
          classId: item.classId || item.class_id,
          subjectId: item.subjectId || item.subject_id,
          weeklyQuota: item.weeklyQuota ?? item.quota ?? null,
          isLabRequired: Boolean(item.isLabRequired),
          allowDoublePeriod: Boolean(item.allowDoublePeriod)
        });
      }
    }
  } else if (payload && typeof payload === 'object') {
    // Format A: { classSubjectQuotas: { [classId]: { [subjectId]: quota } } }
    if (payload.classSubjectQuotas && typeof payload.classSubjectQuotas === 'object') {
      for (const [classId, subjMap] of Object.entries(payload.classSubjectQuotas)) {
        if (subjMap && typeof subjMap === 'object') {
          for (const [subjectId, qVal] of Object.entries(subjMap)) {
            const quota = typeof qVal === 'number' ? qVal : (qVal && typeof qVal === 'object' ? (qVal.weeklyQuota ?? qVal.quota) : (qVal !== '' && qVal !== null ? Number(qVal) : null));
            items.push({
              classId,
              subjectId,
              weeklyQuota: quota !== null && !isNaN(quota) ? quota : null,
              isLabRequired: Boolean(qVal?.isLabRequired),
              allowDoublePeriod: Boolean(qVal?.allowDoublePeriod)
            });
          }
        }
      }
    }
    // Format B: { quotas: { "classId__subjectId": quota } } or { quotas: { [subjectId]: quota }, classId }
    else if (payload.quotas && typeof payload.quotas === 'object') {
      for (const [key, v] of Object.entries(payload.quotas)) {
        let classId = payload.classId || payload.class_id;
        let subjectId = key;
        if (key.includes('__')) {
          [classId, subjectId] = key.split('__');
        }
        const quota = typeof v === 'number' ? v : (v && typeof v === 'object' ? (v.weeklyQuota ?? v.quota) : (v !== '' && v !== null ? Number(v) : null));
        items.push({
          classId,
          subjectId,
          weeklyQuota: quota !== null && !isNaN(quota) ? quota : null,
          isLabRequired: Boolean(v?.isLabRequired),
          allowDoublePeriod: Boolean(v?.allowDoublePeriod)
        });
      }
    }
    // Format C: Single item { classId, subjectId, weeklyQuota }
    else if ((payload.classId || payload.class_id) && (payload.subjectId || payload.subject_id)) {
      items.push({
        classId: payload.classId || payload.class_id,
        subjectId: payload.subjectId || payload.subject_id,
        weeklyQuota: payload.weeklyQuota ?? payload.quota ?? null,
        isLabRequired: Boolean(payload.isLabRequired),
        allowDoublePeriod: Boolean(payload.allowDoublePeriod)
      });
    }
  }

  let savedCount = 0;
  for (const item of items) {
    if (item.classId && item.subjectId) {
      await pgPool.query(
        `INSERT INTO class_subjects (tenant_id, class_id, subject_id, weekly_quota, is_lab_required, allow_double_period)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, class_id, subject_id)
         DO UPDATE SET 
           weekly_quota = EXCLUDED.weekly_quota,
           is_lab_required = EXCLUDED.is_lab_required,
           allow_double_period = EXCLUDED.allow_double_period;`,
        [
          tenantId,
          item.classId,
          item.subjectId,
          item.weeklyQuota !== undefined && item.weeklyQuota !== null ? Number(item.weeklyQuota) : null,
          item.isLabRequired ?? false,
          item.allowDoublePeriod ?? false
        ]
      );
      savedCount++;
    }
  }
  return { success: true, message: 'Class quotas updated successfully', savedCount };
}

export async function getTeacherQuotas(tenantId) {
  const { rows } = await pgPool.query(
    `SELECT id, name, weekly_quota FROM "user" WHERE tenant_id = $1 AND type = 'teacher';`,
    [tenantId]
  );
  const teacherQuotas = {};
  rows.forEach(r => {
    teacherQuotas[r.id] = r.weekly_quota || 30;
  });
  return { teacherQuotas, quotas: teacherQuotas, data: teacherQuotas };
}

export async function saveTeacherQuotas(tenantId, payload) {
  const list = [];
  if (Array.isArray(payload)) {
    list.push(...payload);
  } else if (payload && typeof payload === 'object') {
    if (payload.teacherQuotas && typeof payload.teacherQuotas === 'object') {
      Object.entries(payload.teacherQuotas).forEach(([id, q]) => list.push({ id, quota: q }));
    } else if (payload.quotas && typeof payload.quotas === 'object') {
      Object.entries(payload.quotas).forEach(([id, q]) => list.push({ id, quota: q }));
    } else if (payload.id || payload.teacherId) {
      list.push(payload);
    } else {
      // Direct dictionary { [teacherId]: quota }
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      Object.entries(payload).forEach(([key, val]) => {
        if (uuidRegex.test(key)) {
          list.push({ id: key, quota: val });
        }
      });
    }
  }

  let savedCount = 0;
  for (const item of list) {
    const tid = item.id || item.teacherId;
    if (tid) {
      const q = item.quota ?? item.weeklyQuota;
      await pgPool.query(
        `UPDATE "user" SET weekly_quota = $1 WHERE id = $2 AND tenant_id = $3;`,
        [q !== undefined && q !== null ? Number(q) : 30, tid, tenantId]
      );
      savedCount++;
    }
  }
  return { success: true, message: 'Teacher quotas updated successfully', savedCount };
}

