import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leave_type: z.enum(['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Half Day']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD'),
  days_count: z.number().positive().optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  attachment_url: z.string().url().optional().nullable().or(z.literal('')),
});

export const reviewLeaveSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  admin_remarks: z.string().optional(),
});

export const getLeaveListQuerySchema = z.object({
  status: z.enum(['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']).optional(),
  staff_id: z.string().uuid().optional(),
  academicYear: z.string().optional(),
});

export const updatePolicySchema = z.object({
  academic_year: z.string().default('2026-27'),
  casual_leave_annual: z.coerce.number().int().min(0).max(100),
  sick_leave_annual: z.coerce.number().int().min(0).max(100),
  earned_leave_annual: z.coerce.number().int().min(0).max(100),
  max_consecutive_days: z.coerce.number().int().min(1).max(30).optional().default(3),
  require_doc_for_sick_days: z.coerce.number().int().min(1).max(30).optional().default(2),
  notice_days_casual: z.coerce.number().int().min(0).max(30).optional().default(1),
  apply_to_existing_staff: z.boolean().optional().default(false),
});

