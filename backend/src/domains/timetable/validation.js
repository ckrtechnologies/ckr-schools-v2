import { z } from 'zod';

export const timetableSettingsSchema = z.object({
  academic_year: z.string().default('2026-2027'),
  school_start_time: z.string().default('08:00 AM'),
  period_duration_minutes: z.coerce.number().int().positive().default(50),
  assembly_duration_minutes: z.coerce.number().int().nonnegative().default(20),
  recess_after_period: z.coerce.number().int().nonnegative().default(4),
  recess_duration_minutes: z.coerce.number().int().nonnegative().default(20),
  lunch_after_period: z.coerce.number().int().nonnegative().default(6),
  lunch_duration_minutes: z.coerce.number().int().nonnegative().default(40),
  periods_per_day: z.coerce.number().int().positive().default(8),
  saturday_periods: z.coerce.number().int().nonnegative().default(5),
  max_daily_subject_periods: z.coerce.number().int().positive().default(1),
  is_active: z.boolean().default(true)
});

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function preprocessPeriod(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const item = raw.data || raw;

  const class_id = item.class_id || item.classId;
  const time_slot = item.time_slot || item.time || item.slot || '';
  const subject = item.subject || 'Unassigned';

  let date = item.date || null;
  if (date && typeof date === 'string' && date.includes('T')) {
    date = date.split('T')[0];
  }

  let day_of_week = item.day_of_week;
  if (!day_of_week && date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const parsed = new Date(date + 'T00:00:00');
    day_of_week = days[parsed.getDay()] || 'Monday';
  }
  if (!day_of_week) {
    day_of_week = 'Monday';
  }

  const rawTeacher = item.teacher_id || item.teacherId || item.teacher;
  let teacher_id = null;
  let teacher_name = null;
  if (rawTeacher && typeof rawTeacher === 'string' && rawTeacher.trim()) {
    if (UUID_REGEX.test(rawTeacher.trim())) {
      teacher_id = rawTeacher.trim();
    } else {
      teacher_name = rawTeacher.trim();
    }
  }

  const room_number = item.room_number || item.roomNumber || null;
  const is_break = item.is_break !== undefined ? Boolean(item.is_break) : Boolean(item.isBreak || item.isAssembly);

  return {
    class_id,
    date,
    day_of_week,
    time_slot,
    subject,
    teacher_id,
    teacher_name,
    room_number,
    is_break
  };
}

export const addPeriodSchema = z.preprocess(preprocessPeriod, z.object({
  class_id: z.string().uuid('Valid Class ID is required'),
  date: z.string().optional().nullable(),
  day_of_week: z.string().default('Monday'),
  time_slot: z.string().min(1, 'Time slot is required'),
  subject: z.string().min(1, 'Subject name is required'),
  teacher_id: z.string().uuid().optional().nullable(),
  teacher_name: z.string().optional().nullable(),
  room_number: z.string().optional().nullable(),
  is_break: z.boolean().default(false)
}));

export const assignProxySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    date: raw.date,
    period_index: raw.period_index !== undefined ? Number(raw.period_index) : (raw.periodIndex !== undefined ? Number(raw.periodIndex) : 1),
    time_slot: raw.time_slot || raw.timeSlot || raw.slot || '',
    class_id: raw.class_id || raw.classId,
    original_faculty_id: raw.original_faculty_id || raw.original_teacher_id || raw.originalFacultyId || raw.originalTeacherId || null,
    substitute_faculty_id: raw.substitute_faculty_id || raw.substitute_teacher_id || raw.substituteFacultyId || raw.substituteTeacherId,
    subject: raw.subject || 'Substitution',
    room_number: raw.room_number || raw.roomNumber || null,
    reason: raw.reason || null
  };
}, z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_index: z.number().int().min(1).max(12).default(1),
  time_slot: z.string().min(1),
  class_id: z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Valid Class ID is required'),
  original_faculty_id: z.string().regex(/^[0-9a-fA-F-]{36}$/).optional().nullable(),
  substitute_faculty_id: z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Substitute Faculty ID is required'),
  subject: z.string().optional().nullable(),
  room_number: z.string().optional().nullable(),
  reason: z.string().optional().nullable()
}));

