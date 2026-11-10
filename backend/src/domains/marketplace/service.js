import * as marketRepo from './repository.js';
import { enquirySchema, reviewSchema, brochureDownloadSchema, multiEnquirySchema } from './validation.js';
import { pgPool } from '../../config/db.js';

export async function getSchools(filters) {
  return await marketRepo.listSchools(filters);
}

export async function getSchoolDetails(slug) {
  const school = await marketRepo.getSchoolBySlug(slug);
  if (!school) {
    const error = new Error(`School '${slug}' not found on marketplace.`);
    error.status = 404;
    error.code = 'SCHOOL_NOT_FOUND';
    throw error;
  }
  return school;
}

export async function submitEnquiry(slug, rawData) {
  const school = await getSchoolDetails(slug);
  const validated = enquirySchema.parse(rawData);
  return await marketRepo.createMarketplaceEnquiry(school.id, validated);
}

export async function submitBrochureDownload(slug, rawData) {
  const school = await getSchoolDetails(slug);
  const validated = brochureDownloadSchema.parse(rawData);
  return await marketRepo.createBrochureDownloadLead(school.id, validated);
}

export async function submitMultiEnquiry(rawData) {
  const validated = multiEnquirySchema.parse(rawData);
  
  // Resolve tenant IDs from slugs
  const { rows } = await pgPool.query(`
    SELECT id, slug, name FROM public.tenants
    WHERE LOWER(slug) = ANY($1::text[]) AND is_active = TRUE;
  `, [validated.school_slugs.map(s => s.toLowerCase())]);

  if (!rows || rows.length === 0) {
    const error = new Error('None of the selected schools were found.');
    error.status = 404;
    error.code = 'NO_SCHOOLS_FOUND';
    throw error;
  }

  return await marketRepo.createMultiSchoolEnquiry(rows, validated);
}

export async function getReviews(slug) {
  const school = await getSchoolDetails(slug);
  return await marketRepo.listSchoolReviews(school.id);
}

export async function submitReview(slug, rawData) {
  const school = await getSchoolDetails(slug);
  const validated = reviewSchema.parse(rawData);
  return await marketRepo.createSchoolReview(school.id, validated);
}

export async function upvoteReview(reviewId) {
  const updated = await marketRepo.upvoteReviewHelpful(reviewId);
  if (!updated) {
    const error = new Error('Review not found.');
    error.status = 404;
    error.code = 'REVIEW_NOT_FOUND';
    throw error;
  }
  return updated;
}

export async function getPressReleases(slug) {
  const school = await getSchoolDetails(slug);
  return await marketRepo.listPressReleases(school.id);
}

export async function getMySchoolProfile(tenantId) {
  const profile = await marketRepo.getSchoolMarketplaceProfile(tenantId);
  if (!profile) {
    const error = new Error('School profile not found.');
    error.status = 404;
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }
  return profile;
}

export async function updateMySchoolProfile(tenantId, data) {
  return await marketRepo.updateSchoolMarketplaceProfile(tenantId, data);
}
