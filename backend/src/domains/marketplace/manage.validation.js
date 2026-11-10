import { z } from 'zod';

const text = (max = 5000) => z.string().max(max).optional().nullable();

const nullableNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null || v === '') return null;
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  });

export const profileUpdateSchema = z.object({
  tagline: text(255),
  about: text(5000),
  established_year: nullableNumber,
  min_fee: nullableNumber,
  max_fee: nullableNumber,
  fee_period: text(30),
  grades_offered: text(120),
  facilities: z.union([z.array(z.string()), z.string(), z.null()]).optional().transform(v => {
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
    return String(v).split('\n').map(s => s.trim()).filter(Boolean);
  }),
  brochure_url: text(2000),
  admission_status: text(60),
  hero_image_url: text(2000),
  student_count_badge: text(60),
  teacher_count_badge: text(60),
  student_teacher_ratio: text(30)
});

export const publishSchema = z.object({
  is_published: z.boolean()
});

export const reviewReplySchema = z.object({
  reply: z.string().trim().min(2, 'Reply must be at least 2 characters').max(2000)
});

export const reviewReportSchema = z.object({
  reported: z.boolean().default(true),
  reason: z.string().trim().max(500).optional().nullable()
});

export const reviewQuerySchema = z.object({
  status: z.enum(['all', 'pending_reply', 'replied', 'reported', 'verified', 'low_rating', 'hidden']).default('all'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const galleryCreateSchema = z.object({
  title: text(200),
  description: text(500),
  media_url: z.string().trim().min(1, 'Upload a file or paste a media link').max(2000),
  media_type: z.enum(['image', 'video']).default('image'),
  is_marketplace_visible: z.boolean().default(true),
  display_order: z.coerce.number().int().optional()
});

export const galleryUpdateSchema = z.object({
  is_marketplace_visible: z.boolean().optional(),
  title: text(200),
  description: text(500),
  media_url: z.string().trim().min(1, 'Upload a file or paste a media link').max(2000).optional(),
  media_type: z.enum(['image', 'video']).optional(),
  display_order: z.coerce.number().int().optional()
});

const PRESS_CATEGORIES = ['General', 'Academics', 'Sports', 'Event', 'Achievement'];

export const pressCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(255),
  summary: text(500),
  content_html: z.string().trim().min(10, 'Content is required').max(50000),
  featured_image_url: text(2000),
  category: z.enum(PRESS_CATEGORIES).default('General'),
  published_date: text(20),
  is_published: z.boolean().default(true)
});

export const pressUpdateSchema = z.object({
  title: z.string().trim().min(3).max(255).optional(),
  summary: text(500),
  content_html: z.string().trim().min(10).max(50000).optional(),
  featured_image_url: text(2000),
  category: z.enum(PRESS_CATEGORIES).optional(),
  published_date: text(20),
  is_published: z.boolean().optional()
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().max(120).optional()
});
