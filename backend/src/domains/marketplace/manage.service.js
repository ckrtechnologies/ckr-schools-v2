import * as manageRepo from './manage.repository.js';
import * as marketRepo from './repository.js';
import {
  profileUpdateSchema,
  publishSchema,
  reviewReplySchema,
  reviewReportSchema,
  reviewQuerySchema,
  galleryUpdateSchema,
  pressCreateSchema,
  pressUpdateSchema,
  galleryCreateSchema,
  leadQuerySchema
} from './manage.validation.js';

function httpError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function requireTenant(tenantId) {
  if (!tenantId) {
    throw httpError('Your account is not linked to a school.', 403, 'TENANT_REQUIRED');
  }
  return tenantId;
}

const PROFILE_SECTIONS = [
  { key: 'tagline', label: 'School tagline', filled: (p) => !!p.tagline },
  { key: 'about', label: 'About the school', filled: (p) => !!p.about },
  { key: 'established_year', label: 'Year established', filled: (p) => !!p.established_year },
  { key: 'fees', label: 'Annual fee range', filled: (p) => p.min_fee !== null && p.min_fee !== undefined && p.max_fee !== null && p.max_fee !== undefined },
  { key: 'fee_period', label: 'Fee period', filled: (p) => !!p.fee_period },
  { key: 'grades_offered', label: 'Grades offered', filled: (p) => !!p.grades_offered },
  { key: 'facilities', label: 'Campus facilities', filled: (p) => Array.isArray(p.facilities) && p.facilities.length > 0 },
  { key: 'brochure_url', label: 'Prospectus / brochure PDF', filled: (p) => !!p.brochure_url },
  { key: 'admission_status', label: 'Admission status', filled: (p) => !!p.admission_status },
  { key: 'hero_image_url', label: 'Cover image', filled: (p) => !!p.hero_image_url }
];

function computeCompleteness(profile) {
  const missing = PROFILE_SECTIONS.filter(section => !section.filled(profile || {})).map(s => s.label);
  const filled = PROFILE_SECTIONS.length - missing.length;
  return {
    filled,
    total: PROFILE_SECTIONS.length,
    percent: Math.round((filled / PROFILE_SECTIONS.length) * 100),
    missing
  };
}

const isBlank = (value) => {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const gradeRank = (name) => {
  const value = String(name || '').trim().toLowerCase();
  if (!value) return null;
  if (/^(nurs|nur|play|pre|kg|kinder|little)/.test(value)) return -1;
  if (value.startsWith('lkg')) return 0;
  if (value.startsWith('ukg')) return 1;
  const match = value.match(/(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

const gradeLabel = (rank) => {
  if (rank === -1) return 'Nursery';
  if (rank === 0) return 'LKG';
  if (rank === 1) return 'UKG';
  return `Grade ${rank}`;
};

function summarizeGrades(classNames) {
  const ranks = [...new Set(classNames.map(gradeRank).filter((rank) => rank !== null))].sort((a, b) => a - b);
  if (ranks.length === 0) return null;
  if (ranks.length === 1) return gradeLabel(ranks[0]);
  return `${gradeLabel(ranks[0])} – ${gradeLabel(ranks[ranks.length - 1])}`;
}

/**
 * Builds marketplace field values from the school's own records so a SPOC never
 * starts from a blank form. Only real data is used — nothing is fabricated.
 */
async function buildPrefill(tenantId) {
  const sources = await manageRepo.getPrefillSources(tenantId);
  const values = {};

  const grades = summarizeGrades(sources.classNames);
  if (grades) values.grades_offered = grades;

  const minMonthly = Number(sources.minFee);
  const maxMonthly = Number(sources.maxFee);
  if (minMonthly > 0 && maxMonthly > 0) {
    values.min_fee = Math.round(minMonthly * 12);
    values.max_fee = Math.round(maxMonthly * 12);
    values.fee_period = 'ANNUAL';
  }

  if (sources.students > 0) values.student_count_badge = `${sources.students}+ students`;
  if (sources.teachers > 0) values.teacher_count_badge = `${sources.teachers}+ faculty`;
  if (sources.students > 0 && sources.teachers > 0) {
    values.student_teacher_ratio = `${Math.max(1, Math.round(sources.students / sources.teachers))}:1`;
  }

  if (sources.coverImage) values.hero_image_url = sources.coverImage;

  return values;
}

async function profileWithPrefill(tenantId) {
  const profile = await marketRepo.getSchoolMarketplaceProfile(tenantId);
  if (!profile) return null;

  const suggestions = await buildPrefill(tenantId);

  // The school motto is the natural public tagline.
  if (profile.motto) suggestions.tagline = profile.motto;

  const effective = { ...profile };
  const prefilled = [];

  Object.entries(suggestions).forEach(([key, value]) => {
    if (isBlank(effective[key])) {
      effective[key] = value;
      prefilled.push(key);
    }
  });

  return { effective, suggestions, prefilled };
}

export async function getOverview(tenantId) {
  requireTenant(tenantId);
  const [header, counters, profileState] = await Promise.all([
    manageRepo.getTenantHeader(tenantId),
    manageRepo.getOverviewCounters(tenantId),
    profileWithPrefill(tenantId)
  ]);

  const profile = profileState?.effective || null;

  if (!header) {
    throw httpError('School profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  return {
    school: {
      id: header.id,
      name: header.name,
      slug: header.slug,
      logo_url: header.logo_url,
      city: header.city,
      affiliation_board: header.affiliation_board,
      is_published: header.is_published,
      published_at: header.published_at
    },
    completeness: computeCompleteness(profile),
    stats: {
      average_rating: Number(counters?.avg_rating || 0),
      reviews_total: counters?.reviews_total || 0,
      reviews_verified: counters?.reviews_verified || 0,
      reviews_replied: counters?.reviews_replied || 0,
      reviews_pending_reply: counters?.reviews_pending_reply || 0,
      reviews_reported: counters?.reviews_reported || 0,
      reviews_hidden: counters?.reviews_hidden || 0,
      gallery_total: counters?.gallery_total || 0,
      gallery_published: counters?.gallery_published || 0,
      press_total: counters?.press_total || 0,
      press_published: counters?.press_published || 0,
      leads_total: counters?.leads_total || 0,
      leads_last_30_days: counters?.leads_last_30_days || 0
    }
  };
}

export async function getProfile(tenantId) {
  requireTenant(tenantId);
  const state = await profileWithPrefill(tenantId);
  if (!state) {
    throw httpError('School profile not found.', 404, 'PROFILE_NOT_FOUND');
  }
  return {
    ...state.effective,
    prefilled: state.prefilled,
    suggestions: state.suggestions,
    completeness: computeCompleteness(state.effective)
  };
}

export async function updateProfile(tenantId, rawData) {
  requireTenant(tenantId);
  const validated = profileUpdateSchema.parse(rawData || {});
  const updated = await marketRepo.updateSchoolMarketplaceProfile(tenantId, validated);
  return { ...updated, completeness: computeCompleteness({ ...updated }) };
}

export async function setPublished(tenantId, rawData, userId) {
  requireTenant(tenantId);
  const { is_published } = publishSchema.parse(rawData || {});
  return await manageRepo.setProfilePublished(tenantId, is_published, userId);
}

export async function listReviews(tenantId, query) {
  requireTenant(tenantId);
  const filters = reviewQuerySchema.parse(query || {});
  const [result, counters] = await Promise.all([
    manageRepo.listSchoolReviews(tenantId, filters),
    manageRepo.getOverviewCounters(tenantId)
  ]);

  return {
    ...result,
    stats: {
      average_rating: Number(counters?.avg_rating || 0),
      total: counters?.reviews_total || 0,
      verified: counters?.reviews_verified || 0,
      replied: counters?.reviews_replied || 0,
      pending_reply: counters?.reviews_pending_reply || 0,
      reported: counters?.reviews_reported || 0,
      hidden: counters?.reviews_hidden || 0
    }
  };
}

export async function replyToReview(tenantId, reviewId, rawData, userId) {
  requireTenant(tenantId);
  const { reply } = reviewReplySchema.parse(rawData || {});

  const review = await manageRepo.findSchoolReview(tenantId, reviewId);
  if (!review) {
    throw httpError('Review not found for your school.', 404, 'REVIEW_NOT_FOUND');
  }

  const saved = await manageRepo.saveReviewReply(tenantId, reviewId, reply, userId);
  return saved;
}

export async function removeReviewReply(tenantId, reviewId) {
  requireTenant(tenantId);
  const review = await manageRepo.findSchoolReview(tenantId, reviewId);
  if (!review) {
    throw httpError('Review not found for your school.', 404, 'REVIEW_NOT_FOUND');
  }
  return await manageRepo.clearReviewReply(tenantId, reviewId);
}

export async function reportReview(tenantId, reviewId, rawData) {
  requireTenant(tenantId);
  const { reported, reason } = reviewReportSchema.parse(rawData || {});

  if (reported && !reason) {
    throw httpError('Tell CKR why this review should be reviewed.', 422, 'REPORT_REASON_REQUIRED');
  }

  const review = await manageRepo.findSchoolReview(tenantId, reviewId);
  if (!review) {
    throw httpError('Review not found for your school.', 404, 'REVIEW_NOT_FOUND');
  }

  return await manageRepo.setReviewReport(tenantId, reviewId, reported, reason);
}

export async function listGallery(tenantId) {
  requireTenant(tenantId);
  return await manageRepo.listGallery(tenantId);
}

export async function updateGalleryItem(tenantId, itemId, rawData) {
  requireTenant(tenantId);
  const updates = galleryUpdateSchema.parse(rawData || {});
  const updated = await manageRepo.updateGalleryItem(tenantId, itemId, updates);
  if (!updated) {
    throw httpError('Gallery item not found for your school.', 404, 'GALLERY_ITEM_NOT_FOUND');
  }
  return updated;
}

export async function createGalleryItem(tenantId, rawData) {
  requireTenant(tenantId);
  const validated = galleryCreateSchema.parse(rawData || {});
  return await manageRepo.createGalleryItem(tenantId, validated);
}

export async function deleteGalleryItem(tenantId, itemId) {
  requireTenant(tenantId);
  const deleted = await manageRepo.deleteGalleryItem(tenantId, itemId);
  if (!deleted) {
    throw httpError('Gallery item not found for your school.', 404, 'GALLERY_ITEM_NOT_FOUND');
  }
  return deleted;
}

export async function listPress(tenantId) {
  requireTenant(tenantId);
  return await manageRepo.listPressReleases(tenantId);
}

export async function createPress(tenantId, rawData, userId) {
  requireTenant(tenantId);
  const validated = pressCreateSchema.parse(rawData || {});
  return await manageRepo.createPressRelease(tenantId, validated, userId);
}

export async function updatePress(tenantId, pressId, rawData) {
  requireTenant(tenantId);
  const validated = pressUpdateSchema.parse(rawData || {});
  const updated = await manageRepo.updatePressRelease(tenantId, pressId, validated);
  if (!updated) {
    throw httpError('Press release not found for your school.', 404, 'PRESS_NOT_FOUND');
  }
  return updated;
}

export async function deletePress(tenantId, pressId) {
  requireTenant(tenantId);
  const deleted = await manageRepo.deletePressRelease(tenantId, pressId);
  if (!deleted) {
    throw httpError('Press release not found for your school.', 404, 'PRESS_NOT_FOUND');
  }
  return deleted;
}

export async function listLeads(tenantId, query) {
  requireTenant(tenantId);
  const filters = leadQuerySchema.parse(query || {});
  const [result, counters] = await Promise.all([
    manageRepo.listTransferredLeads(tenantId, filters),
    manageRepo.getLeadTypeCounters(tenantId)
  ]);

  const byType = counters.reduce((acc, row) => {
    acc[row.lead_type] = row.total;
    return acc;
  }, {});

  return { ...result, stats: { by_type: byType } };
}
