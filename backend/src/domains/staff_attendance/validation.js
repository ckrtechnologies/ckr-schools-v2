import { z } from 'zod';

export const checkInSchema = z.object({
  remarks: z.string().optional(),
  ip_address: z.string().optional(),
});

export const checkOutSchema = z.object({
  remarks: z.string().optional(),
});

export const adminOverrideSchema = z.object({
  staff_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Late']),
  remarks: z.string().optional(),
  check_in_time: z.string().datetime().optional().nullable(),
  check_out_time: z.string().datetime().optional().nullable(),
});

export const getHistoryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  staff_id: z.string().uuid().optional(),
});

export const getRosterQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  role: z.string().optional(),
  search: z.string().optional(),
});

