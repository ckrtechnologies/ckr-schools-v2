import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional().default(''),
  teachers: z.array(z.string()).optional(),
  students: z.array(z.string()).optional(),
  subject: z.string().optional()
}).refine(data => data.name || data.className, {
  message: 'Class name or className is required'
});

export const updateClassSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
  teachers: z.array(z.string()).optional(),
  students: z.array(z.string()).optional(),
  subject: z.string().optional()
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  category: z.string().optional().default('Scholastic'),
  classIds: z.array(z.string()).optional()
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').optional(),
  category: z.string().optional(),
  classIds: z.array(z.string()).optional()
});

export const assignSubjectTeacherSchema = z.object({
  subjectId: z.string().uuid('Valid subject ID is required'),
  classId: z.string().uuid('Valid class ID is required'),
  teacherId: z.string().uuid('Valid teacher ID is required').nullable().optional()
});

export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.preprocess(
    val => (val === null || val === undefined || val === '' ? null : Number(val)),
    z.number().int().positive().nullable().optional()
  )
});

