import { z } from 'zod';

const durationTransform = z.union([z.number(), z.string()]).transform(val => {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return null;
  const matchHours = String(val).match(/(\d+(?:\.\d+)?)\s*h/i);
  if (matchHours) return Math.round(parseFloat(matchHours[1]) * 60);
  const parsed = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? null : parsed;
}).optional().nullable();

const marksTransform = z.union([z.number(), z.string()])
  .transform(v => (v !== undefined && v !== null && v !== '') ? parseInt(String(v), 10) : 100)
  .default(100);

export const singleExamSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  class_id: z.string().uuid().optional().nullable(),
  class: z.union([z.string(), z.number()]).optional().nullable(),
  className: z.union([z.string(), z.number()]).optional().nullable(),
  subject: z.string().min(1, 'Subject is required'),
  date: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  duration: durationTransform,
  marks: marksTransform,
  room_number: z.string().optional().nullable(),
  invigilator_id: z.string().optional().nullable()
});

export const batchDateSheetSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  class: z.union([z.string(), z.number()]).optional().nullable(),
  className: z.union([z.string(), z.number()]).optional().nullable(),
  class_id: z.string().optional().nullable(),
  classes: z.array(z.union([z.string(), z.number()])).optional(),
  subjects: z.array(z.object({
    subject: z.string().min(1, 'Subject name is required'),
    date: z.string().optional().nullable(),
    time: z.string().optional().nullable(),
    duration: durationTransform,
    marks: marksTransform,
    room_number: z.string().optional().nullable(),
    invigilator_id: z.string().optional().nullable()
  })).min(1, 'At least one subject is required'),
  sectionsData: z.record(z.any()).optional().nullable()
});

export const createExamScheduleSchema = z.union([batchDateSheetSchema, singleExamSchema]);

export const bulkGradesSchema = z.object({
  exam_id: z.number().int(),
  grades: z.array(z.object({
    student_id: z.string().uuid(),
    marks: z.number().nonnegative(),
    max_marks: z.number().positive().default(100)
  }))
});

export const coScholasticSchema = z.object({
  class_id: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  term: z.string().min(1),
  academic_year: z.string().optional().default('2026-27'),
  academicYear: z.string().optional(),
  grades: z.array(z.object({
    student_id: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    physical_education: z.string().optional(),
    discipline: z.string().optional(),
    work_education: z.string().optional(),
    art_education: z.string().optional(),
    gk: z.string().optional(),
    remarks: z.string().nullable().optional()
  }))
}).transform(data => ({
  class_id: data.class_id || data.classId,
  term: data.term,
  academic_year: data.academic_year || data.academicYear || '2026-27',
  grades: (data.grades || []).map(g => ({
    student_id: g.student_id || g.studentId,
    physical_education: g.physical_education,
    discipline: g.discipline,
    work_education: g.work_education,
    art_education: g.art_education,
    gk: g.gk,
    remarks: g.remarks
  }))
}));

