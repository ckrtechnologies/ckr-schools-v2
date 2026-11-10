import { z } from 'zod';

export const createTermSchema = z.object({
  name: z.string().min(1, 'Term name is required'),
  academic_year: z.string().min(1).default('2026-27'),
  weightage_percent: z.union([z.number(), z.string()])
    .transform(v => (v !== undefined && v !== null && v !== '') ? parseFloat(String(v)) : 50.0)
    .optional()
    .default(50.0),
  display_order: z.union([z.number(), z.string()])
    .transform(v => (v !== undefined && v !== null && v !== '') ? parseInt(String(v), 10) : 1)
    .optional()
    .default(1)
});

export const updateTermSchema = z.object({
  name: z.string().min(1).optional(),
  academic_year: z.string().optional(),
  weightage_percent: z.union([z.number(), z.string()])
    .transform(v => (v !== undefined && v !== null && v !== '') ? parseFloat(String(v)) : undefined)
    .optional(),
  display_order: z.union([z.number(), z.string()])
    .transform(v => (v !== undefined && v !== null && v !== '') ? parseInt(String(v), 10) : undefined)
    .optional()
});

