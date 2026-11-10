import { z } from 'zod';

function unwrapPayload(val) {
  if (val && typeof val === 'object' && val.data && typeof val.data === 'object' && !Array.isArray(val.data)) {
    return val.data;
  }
  return val;
}

export const createCircularSchema = z.preprocess(unwrapPayload, z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().default(''),
  attachment_url: z.preprocess(val => (val === '' ? null : val), z.string().optional().nullable()),
  target_audience: z.preprocess((val) => {
    if (!val) return 'all';
    const s = String(val).toLowerCase().trim();
    if (s.includes('all')) return 'all';
    if (s.includes('parent')) return 'parent';
    if (s.includes('teacher')) return 'teacher';
    if (s.includes('student')) return 'student';
    return 'all';
  }, z.enum(['all', 'parent', 'teacher', 'student'])).default('all'),
  class_id: z.preprocess(
    val => (!val || val === '' || val === 'null' || val === 'undefined' ? null : val),
    z.string().uuid('Invalid class ID').optional().nullable()
  ),
  publish_to_marketplace: z.boolean().optional().default(false),
  marketplace_category: z.string().optional().default('General'),
}));

export const sendMessageSchema = z.preprocess(unwrapPayload, z.object({
  receiver_id: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  secondPerson: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
  message: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional().default('text'),
})).transform(d => {
  let receiverId = d.receiver_id || d.receiverId;
  if (!receiverId && d.secondPerson) {
    receiverId = Array.isArray(d.secondPerson) ? d.secondPerson[0] : d.secondPerson;
  }
  const message = d.message || d.title;
  if (!receiverId) throw new Error('Receiver ID is required');
  if (!message) throw new Error('Message cannot be empty');

  return {
    receiver_id: receiverId,
    message,
    type: d.type || 'text',
  };
});

export const complaintSchema = z.preprocess(unwrapPayload, z.object({
  student: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
  student_id: z.string().uuid().optional().nullable(),
  studentId: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  type: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  status: z.string().optional().default('pending'),
})).transform(d => {
  let students = [];
  if (Array.isArray(d.student)) {
    students = d.student;
  } else if (d.student) {
    students = [d.student];
  } else if (d.student_id || d.studentId || d.user_id || d.userId) {
    students = [d.student_id || d.studentId || d.user_id || d.userId];
  }

  return {
    student_ids: students,
    title: d.type || d.title || 'Disciplinary',
    type: d.type || d.title || 'Disciplinary',
    date: d.date || new Date().toISOString().split('T')[0],
    description: d.description,
    status: d.status || 'pending',
  };
});
