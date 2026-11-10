import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(4, 'Password must be at least 4 characters')
}).refine(data => data.email || data.phone || data.identifier, {
  message: 'Please enter your phone number, email or admission number'
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional()
});

