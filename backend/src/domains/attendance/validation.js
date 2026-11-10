import { z } from 'zod';

export const normalizeStatus = (val) => {
  if (!val) return 'Present';
  const lower = String(val).trim().toLowerCase();
  if (lower === 'present') return 'Present';
  if (lower === 'absent') return 'Absent';
  if (lower === 'late') return 'Late';
  if (lower === 'leave') return 'Leave';
  if (lower === 'holiday') return 'Holiday';
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

export const markAttendanceSchema = z.object({
  student_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.string().transform(normalizeStatus)
}).transform(val => ({
  student_id: val.student_id || val.user_id,
  date: val.date,
  status: val.status
}));

// Mobile bulk record item: { student_id, date, status }
export const mobileAttendanceRecordSchema = z.object({
  student_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.string().transform(normalizeStatus)
}).transform(val => ({
  student_id: val.student_id || val.user_id,
  date: val.date,
  status: val.status
}));

// Web ERP bulk attendance schema: { class_id, date, records: [{ student_id, status }] }
export const webBulkAttendanceSchema = z.object({
  class_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.string().transform(normalizeStatus)
  }))
});

export const plannerEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  end_date: z.preprocess(val => (val === '' || val === undefined || val === null ? null : val), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullable().optional()),
  category: z.preprocess(val => val || 'Event', z.string().default('Event')),
  description: z.preprocess(val => (val === null || val === undefined ? '' : String(val)), z.string().optional()),
  target_classes: z.preprocess(val => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return ['All'];
  }, z.array(z.string()).default(['All'])),
  requires_consent: z.preprocess(val => Boolean(val), z.boolean().default(false))
});

