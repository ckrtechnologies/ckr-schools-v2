import { z } from 'zod';

export const listTenantsQuerySchema = z.object({
  search: z.string().optional(),
  planTier: z.string().optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  sortBy: z.enum(['name', 'created_at', 'plan_tier', 'slug']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const createTenantSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  affiliationBoard: z.enum(['CBSE', 'ICSE', 'STATE_BOARD', 'CAMBRIDGE', 'IB']).default('CBSE'),
  boardAffiliationNumber: z.string().optional().nullable(),
  schoolCode: z.string().optional().nullable(),
  officialEmail: z.string().email('Valid official email required'),
  officialPhone: z.string().min(10, 'Valid 10-digit phone required').max(15),
  website: z.string().url().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits').regex(/^\d{6}$/, 'Pincode must be numbers only'),
  themeColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color required').default('#1e40af'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color required').default('#3b82f6'),
  motto: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  planTier: z.enum(['FREE_TRIAL', 'GROWTH_CAMPUS', 'PRO_CAMPUS', 'ENTERPRISE_AI']).default('GROWTH_CAMPUS'),
  // Initial Admin User details
  adminName: z.string().min(2, 'Admin name required'),
  adminEmail: z.string().email('Admin email required'),
  adminPhone: z.string().min(10, 'Valid phone required').max(15),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  affiliationBoard: z.enum(['CBSE', 'ICSE', 'STATE_BOARD', 'CAMBRIDGE', 'IB']).optional(),
  boardAffiliationNumber: z.string().optional().nullable(),
  schoolCode: z.string().optional().nullable(),
  officialEmail: z.string().email().optional(),
  officialPhone: z.string().optional(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional().nullable().or(z.literal('')),
  themeColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  motto: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  planTier: z.enum(['FREE_TRIAL', 'GROWTH_CAMPUS', 'PRO_CAMPUS', 'ENTERPRISE_AI']).optional(),
  isActive: z.boolean().optional()
});

