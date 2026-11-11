import { z } from 'zod';
import { getCurrentAcademicYear } from '../../utils/academicYear.js';

export const enquirySchema = z.object({
  name: z.string().min(2, 'Student name is required').optional(),
  student_name: z.string().min(2, 'Student name is required').optional(),
  parent_name: z.string().min(2, 'Parent name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  parent_phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  parent_email: z.string().email().optional().nullable().or(z.literal('')),
  grade: z.string().optional(),
  grade_interested: z.string().optional(),
  class_name: z.string().optional(),
  academic_year: z.string().default(getCurrentAcademicYear()),
  message: z.string().optional()
}).transform(d => ({
  name: d.name || d.student_name,
  student_name: d.student_name || d.name,
  parent_name: d.parent_name,
  phone: d.phone || d.parent_phone,
  email: d.email || d.parent_email,
  grade: d.grade || d.grade_interested || d.class_name,
  academic_year: d.academic_year || getCurrentAcademicYear(),
  message: d.message || ''
})).refine(d => d.phone && d.phone.length >= 10, {
  message: 'Valid 10-digit phone number is required',
  path: ['phone']
}).refine(data => data.name || data.student_name, {
  message: 'Student name is required'
});

export const brochureDownloadSchema = z.object({
  parent_name: z.string().min(2, 'Parent name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  parent_phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  parent_email: z.string().email().optional().or(z.literal('')),
  grade: z.string().optional(),
  grade_interested: z.string().optional(),
  student_name: z.string().optional(),
  academic_year: z.string().default(getCurrentAcademicYear())
}).transform(d => ({
  parent_name: d.parent_name,
  phone: d.phone || d.parent_phone,
  email: d.email || d.parent_email,
  grade: d.grade || d.grade_interested,
  student_name: d.student_name,
  academic_year: d.academic_year || getCurrentAcademicYear()
})).refine(d => d.phone && d.phone.length >= 10, {
  message: 'Valid 10-digit phone number is required',
  path: ['phone']
});

export const multiEnquirySchema = z.object({
  school_slugs: z.array(z.string()).min(1, 'At least one school must be selected'),
  student_name: z.string().min(2, 'Student name is required').optional(),
  name: z.string().min(2, 'Student name is required').optional(),
  parent_name: z.string().min(2, 'Parent name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  parent_phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  parent_email: z.string().email().optional().nullable().or(z.literal('')),
  grade: z.string().optional(),
  grade_interested: z.string().optional(),
  academic_year: z.string().default(getCurrentAcademicYear()),
  message: z.string().optional()
}).transform(d => ({
  school_slugs: d.school_slugs,
  student_name: d.student_name || d.name,
  parent_name: d.parent_name,
  phone: d.phone || d.parent_phone,
  email: d.email || d.parent_email,
  grade: d.grade || d.grade_interested,
  academic_year: d.academic_year || getCurrentAcademicYear(),
  message: d.message || ''
})).refine(d => d.phone && d.phone.length >= 10, {
  message: 'Valid 10-digit phone number is required',
  path: ['phone']
}).refine(data => data.student_name, {
  message: 'Student name is required'
});

// Reviews are submitted by an authenticated account; identity fields are never accepted.
export const authenticatedReviewSchema = z.object({
  relationship: z.enum(['Parent', 'Alumni', 'Student', 'Guardian']).default('Parent'),
  overall_rating: z.number().int().min(1).max(5),
  academics_rating: z.number().int().min(1).max(5).optional(),
  infrastructure_rating: z.number().int().min(1).max(5).optional(),
  faculty_rating: z.number().int().min(1).max(5).optional(),
  safety_rating: z.number().int().min(1).max(5).optional(),
  value_for_money_rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  review_text: z.string().min(10, 'Review must be at least 10 characters')
});

export const marketplaceLoginSchema = z.object({
  phone: z.string().trim().min(10, 'Phone number is required'),
  password: z.string().min(4, 'Password is required')
});

export const reviewSchema = z.object({
  reviewer_name: z.string().min(2, 'Name is required'),
  reviewer_email: z.string().email().optional().or(z.literal('')),
  reviewer_phone: z.string().optional(),
  relationship: z.enum(['Parent', 'Alumni', 'Student', 'Guardian']).default('Parent'),
  overall_rating: z.number().int().min(1).max(5),
  academics_rating: z.number().int().min(1).max(5).optional(),
  infrastructure_rating: z.number().int().min(1).max(5).optional(),
  faculty_rating: z.number().int().min(1).max(5).optional(),
  safety_rating: z.number().int().min(1).max(5).optional(),
  value_for_money_rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  review_text: z.string().min(10, 'Review must be at least 10 characters')
});

