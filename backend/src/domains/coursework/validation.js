import { z } from 'zod';

function unwrapPayload(val) {
  if (val && typeof val === 'object' && val.data && typeof val.data === 'object' && !Array.isArray(val.data)) {
    return val.data;
  }
  return val;
}

export const createCourseworkSchema = z.preprocess(unwrapPayload, z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  class_id: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  class: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  chapter: z.string().optional().nullable(),
  duedate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  file_url: z.string().optional().nullable(),
  content: z.array(z.string()).optional().nullable(),
  type: z.string().default('homework'),
  date: z.string().optional().nullable(),
  day: z.string().optional().nullable(),
  topics_taught: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  lesson_no: z.string().optional().nullable(),
  page_number: z.string().optional().nullable(),
  others: z.string().optional().nullable(),
  points: z.string().optional().nullable(),
  homework: z.string().optional().nullable(),
})).transform(d => ({
  title: d.title,
  subject: d.subject,
  class_id: d.class_id || d.classId || null,
  class: d.class || null,
  section: d.section || null,
  chapter: d.chapter || null,
  duedate: d.duedate || d.dueDate || null,
  description: d.description || null,
  file_url: d.file_url || (Array.isArray(d.content) && d.content.length > 0 ? d.content[0] : null),
  type: d.type || 'homework',
  date: d.date || null,
  day: d.day || null,
  topics_taught: d.topics_taught || null,
  unit: d.unit || null,
  lesson_no: d.lesson_no || null,
  page_number: d.page_number || null,
  others: d.others || d.points || null,
  homework: d.homework || null,
}));

export const updateCourseworkSchema = z.preprocess(unwrapPayload, z.object({
  title: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  class_id: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  class: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  chapter: z.string().optional().nullable(),
  duedate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  file_url: z.string().optional().nullable(),
  content: z.array(z.string()).optional().nullable(),
  type: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  day: z.string().optional().nullable(),
  topics_taught: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  lesson_no: z.string().optional().nullable(),
  page_number: z.string().optional().nullable(),
  others: z.string().optional().nullable(),
  points: z.string().optional().nullable(),
  homework: z.string().optional().nullable(),
})).transform(d => {
  const result = {};
  if (d.title !== undefined) result.title = d.title;
  if (d.subject !== undefined) result.subject = d.subject;
  if (d.class_id !== undefined || d.classId !== undefined) result.class_id = d.class_id || d.classId;
  if (d.class !== undefined) result.class = d.class;
  if (d.section !== undefined) result.section = d.section;
  if (d.chapter !== undefined) result.chapter = d.chapter;
  if (d.duedate !== undefined || d.dueDate !== undefined) result.duedate = d.duedate || d.dueDate;
  if (d.description !== undefined) result.description = d.description;
  if (d.file_url !== undefined) result.file_url = d.file_url;
  else if (Array.isArray(d.content) && d.content.length > 0) result.file_url = d.content[0];
  if (d.type !== undefined) result.type = d.type;
  if (d.date !== undefined) result.date = d.date;
  if (d.day !== undefined) result.day = d.day;
  if (d.topics_taught !== undefined) result.topics_taught = d.topics_taught;
  if (d.unit !== undefined) result.unit = d.unit;
  if (d.lesson_no !== undefined) result.lesson_no = d.lesson_no;
  if (d.page_number !== undefined) result.page_number = d.page_number;
  if (d.others !== undefined || d.points !== undefined) result.others = d.others || d.points;
  if (d.homework !== undefined) result.homework = d.homework;
  return result;
});

export const createConsentSchema = z.object({
  title: z.string().min(1, 'Consent title is required'),
  description: z.string().min(1, 'Description is required'),
  class_id: z.preprocess(
    val => (!val || val === '' || val === 'null' || val === 'undefined' ? null : val),
    z.string().uuid().optional().nullable()
  ),
  event_date: z.preprocess(
    val => (!val || val === '' || val === 'null' ? null : val),
    z.string().optional().nullable()
  )
});

export const updateConsentSchema = z.object({
  title: z.string().min(1, 'Consent title is required').optional(),
  description: z.string().optional(),
  class_id: z.preprocess(
    val => (!val || val === '' || val === 'null' || val === 'undefined' ? null : val),
    z.string().uuid().optional().nullable()
  ),
  event_date: z.preprocess(
    val => (!val || val === '' || val === 'null' ? null : val),
    z.string().optional().nullable()
  )
});

export const updateConsentResponseSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
});
