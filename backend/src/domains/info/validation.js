import { z } from 'zod';

export const updateSettingsSchema = z.object({
  instagram_url: z.string().optional().nullable(),
  whatsapp_url: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  twitter_url: z.string().optional().nullable(),
  facebook_url: z.string().optional().nullable(),
  youtube_url: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  late_fee_penalty: z.preprocess(val => (val !== undefined && val !== null ? Number(val) : 0), z.number().nonnegative().default(0))
});

export const addSpotlightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().split('T')[0]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  image_url: z.string().optional().nullable()
});

export const addThoughtSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().split('T')[0]),
  thought: z.string().min(1, 'Thought is required'),
  author: z.string().optional().nullable()
});

export const addChampionSchema = z.object({
  student_id: z.string().uuid().optional().nullable(),
  game_name: z.string().min(1, 'Game/Sport name is required'),
  achievement_level: z.string().default('State Level'),
  marks_score: z.string().optional().nullable()
});

export const addGallerySchema = z.object({
  title: z.string().optional().default('School Photo'),
  image_url: z.string().optional(),
  media_url: z.string().optional(),
  description: z.string().optional().nullable(),
  media_type: z.string().default('image')
}).refine(data => data.image_url || data.media_url, {
  message: 'Image or media URL is required'
});

export const addNewsletterSchema = z.object({
  document_url: z.string().min(1, 'Document URL is required')
});

