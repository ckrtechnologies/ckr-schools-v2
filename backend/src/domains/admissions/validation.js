import { z } from 'zod';

export const createEnquirySchema = z.object({
  name: z.string().min(2, 'Student name is required (minimum 2 characters)'),
  parent: z.string().min(2, 'Parent name is required (minimum 2 characters)'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), z.string().email('Invalid email address format').optional().nullable()),
  gender: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  class_id: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), z.string().uuid('Class ID must be a valid UUID').optional().nullable()),
  academic_year: z.string().default('2026-2027'),
  referral_source: z.string().optional().nullable(),
  enquiry_remarks: z.string().optional().nullable(),
  status: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase().trim() : val), z.enum(['pending', 'approved', 'rejected', 'enquiry'])).default('pending'),
  assigned_to: z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), z.string().uuid().optional().nullable()),
  father_name: z.string().optional().nullable(),
  father_occupation: z.string().optional().nullable(),
  father_mobile: z.string().optional().nullable(),
  mother_name: z.string().optional().nullable(),
  mother_occupation: z.string().optional().nullable(),
  mother_mobile: z.string().optional().nullable(),
  alternate_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  prev_school: z.string().optional().nullable(),
  prev_board: z.string().optional().nullable(),
  preferred_visit_date: z.string().optional().nullable(),
  documents: z.any().optional().nullable(),
  parentEmail: z.string().optional().nullable()
});

export const updateEnquiryStatusSchema = z.object({
  status: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase().trim() : val), z.enum(['pending', 'approved', 'rejected', 'enquiry'])),
  school_tour_status: z.string().optional().nullable(),
  principal_meet_status: z.string().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  office_remarks: z.string().optional().nullable()
});

export const convertToStudentSchema = z.object({
  admission_number: z.string().min(1, 'Admission number is required'),
  admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().split('T')[0]),
  class_id: z.string().uuid().optional().nullable().or(z.literal('')),
  monthly_fee: z.number().optional().default(0),
  bus_fee: z.number().optional().default(0),
  house: z.string().optional()
});

export const createTcSchema = z.object({
  tc_number: z.string().min(1, 'TC number is required'),
  student_id: z.string().uuid('Student ID is required'),
  class_id: z.string().uuid().optional().nullable(),
  pupil_name: z.string().min(2, 'Pupil name is required'),
  mother_name: z.string().optional(),
  father_name: z.string().optional(),
  dob: z.string().optional(),
  dob_words: z.string().optional(),
  nationality: z.string().default('Indian'),
  category: z.string().default('General'),
  last_studied_class_figure: z.string().optional(),
  last_studied_class_words: z.string().optional(),
  annual_exam_result: z.string().optional(),
  qualified_for_promotion: z.string().default('Yes'),
  dues_paid_month: z.string().optional(),
  general_conduct: z.string().default('Good'),
  reason_for_leaving: z.string().optional(),
  remarks: z.string().optional()
});

