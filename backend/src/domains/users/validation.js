import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  password: z.string().min(4).optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  alternate_number: z.string().optional().nullable().or(z.literal('')),
  type: z.string().default('student'),
  gender: z.string().optional().nullable().or(z.literal('')),
  dob: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
  status: z.string().default('active'),
  avatar_url: z.string().optional().nullable().or(z.literal('')),
  admission_number: z.string().optional().nullable().or(z.literal('')),
  house: z.string().optional().nullable().or(z.literal('')),
  father_name: z.string().optional().nullable().or(z.literal('')),
  mother_name: z.string().optional().nullable().or(z.literal('')),
  monthly_fee: z.coerce.number().optional().default(0),
  bus_fee: z.coerce.number().optional().default(0),
  bus_start_date: z.string().optional().nullable().or(z.literal('')),
  fee_exempted: z.boolean().optional().default(false),
  admission_date: z.string().optional().nullable().or(z.literal('')),
  form_submitted: z.boolean().optional().default(false),
  leave_school: z.boolean().optional().default(false),
  tc_received: z.boolean().optional().default(false),
  tc_date: z.string().optional().nullable().or(z.literal('')),
  slc_received: z.boolean().optional().default(false),
  slc_date: z.string().optional().nullable().or(z.literal('')),
  character_certificate_received: z.boolean().optional().default(false),
  character_certificate_date: z.string().optional().nullable().or(z.literal('')),
  tc_document_url: z.string().optional().nullable().or(z.literal('')),
  slc_document_url: z.string().optional().nullable().or(z.literal('')),
  character_certificate_document_url: z.string().optional().nullable().or(z.literal('')),
  classId: z.string().uuid().optional().nullable().or(z.literal('')),
  classes: z.array(z.string().uuid()).optional().default([]),
  connections: z.array(z.string().uuid()).optional().default([]),
  doj: z.string().optional().nullable().or(z.literal('')),
  father_spouse_name: z.string().optional().nullable().or(z.literal('')),
  job_title: z.string().optional().nullable().or(z.literal(''))
}).passthrough();

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid('Valid user UUID is required')
});

export const bulkDeleteUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one userId required')
});

