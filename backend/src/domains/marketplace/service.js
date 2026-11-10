import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as marketRepo from './repository.js';
import {
  enquirySchema,
  authenticatedReviewSchema,
  brochureDownloadSchema,
  multiEnquirySchema,
  marketplaceLoginSchema
} from './validation.js';
import { pgPool } from '../../config/db.js';
import { config } from '../../config/env.js';

export async function getSchools(filters) {
  return await marketRepo.listSchools(filters);
}

export async function getFacets() {
  return await marketRepo.getMarketplaceFacets();
}

export async function resolveSchool(slug) {
  const school = await marketRepo.getSchoolBySlug(slug);
  if (!school) {
    const error = new Error(`School '${slug}' not found on marketplace.`);
    error.status = 404;
    error.code = 'SCHOOL_NOT_FOUND';
    throw error;
  }
  return school;
}

function anonymizeStudentName(name) {
  if (!name || typeof name !== 'string') return 'Student';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || 'Student';
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export async function getSchoolDetails(slug) {
  const school = await resolveSchool(slug);
  const community = await marketRepo.getSchoolCommunity(school.id);

  community.achievements = (community.achievements || []).map(a => ({
    id: a.id,
    game_name: a.game_name,
    achievement_level: a.achievement_level,
    marks_score: a.marks_score,
    student_name: anonymizeStudentName(a.student_name),
    created_at: a.created_at
  }));

  if (community.studentOfWeek) {
    const { avatar_url, ...studentOfWeek } = community.studentOfWeek;
    community.studentOfWeek = {
      ...studentOfWeek,
      student_name: anonymizeStudentName(studentOfWeek.student_name)
    };
  }

  return { ...school, community };
}

export async function submitEnquiry(slug, rawData) {
  const school = await resolveSchool(slug);
  const validated = enquirySchema.parse(rawData);
  return await marketRepo.createMarketplaceEnquiry(school.id, validated);
}

export async function submitBrochureDownload(slug, rawData) {
  const school = await resolveSchool(slug);
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
  const school = await resolveSchool(slug);
  return await marketRepo.listSchoolReviews(school.id);
}

export async function marketplaceLogin(rawData) {
  const { phone, password } = marketplaceLoginSchema.parse(rawData);
  const candidates = await marketRepo.findMarketplaceAccountsByPhone(phone);

  let account = null;
  for (const candidate of candidates) {
    if (!candidate.password_hash) continue;
    const matches = await bcrypt.compare(password, candidate.password_hash);
    if (matches) {
      account = candidate;
      break;
    }
  }

  if (!account) {
    const error = new Error('Invalid phone number or password.');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokenPayload = {
    sub: account.id,
    name: account.name || 'Parent',
    email: account.email || null,
    phone: account.phone || null,
    role: account.account_type,
    type: account.account_type,
    accountType: account.account_type,
    schoolId: account.tenant_id,
    schoolSlug: account.school_slug,
    isSuperAdmin: false
  };

  const token = jwt.sign(tokenPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  });

  const prefill = await marketRepo.getMarketplaceProfileForPrefill(account.id, account.account_type);

  return {
    token,
    user: {
      id: account.id,
      name: account.name || 'Parent',
      phone: account.phone || null,
      email: account.email || null,
      type: account.account_type,
      schoolId: account.tenant_id,
      schoolSlug: account.school_slug,
      schoolName: account.school_name,
      prefill: prefill || null
    }
  };
}

export async function submitReview(slug, rawData, reqUser) {
  if (!reqUser?.sub) {
    const error = new Error('Please log in with your phone number and password to rate a school.');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const school = await resolveSchool(slug);
  const validated = authenticatedReviewSchema.parse(rawData);
  const account = await marketRepo.getAccountIdentity(reqUser.sub);

  if (!account) {
    const error = new Error('Your account could not be found. Please log in again.');
    error.status = 401;
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  const existing = await marketRepo.findReviewByAccount(school.id, account.id);
  if (existing) {
    const error = new Error('You have already reviewed this school.');
    error.status = 409;
    error.code = 'REVIEW_ALREADY_EXISTS';
    throw error;
  }

  const isVerified = !!account.tenant_id && String(account.tenant_id) === String(school.id);

  try {
    return await marketRepo.createSchoolReview(school.id, {
      ...validated,
      relationship: validated.relationship || (account.account_type === 'student' ? 'Student' : 'Parent'),
      reviewer_name: account.name || 'Parent',
      reviewer_email: account.email || null,
      reviewer_phone: account.phone || null,
      reviewer_account_id: account.id,
      reviewer_account_type: account.account_type,
      reviewer_school_id: account.tenant_id || null,
      is_verified: isVerified
    });
  } catch (err) {
    if (err.code === '23505') {
      const conflict = new Error('You have already reviewed this school.');
      conflict.status = 409;
      conflict.code = 'REVIEW_ALREADY_EXISTS';
      throw conflict;
    }
    throw err;
  }
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
  const school = await resolveSchool(slug);
  return await marketRepo.listPressReleases(school.id);
}

/**
 * Signed-in account details used to pre-fill the public inquiry forms.
 */
export async function getMarketplaceMe(reqUser) {
  const account = await marketRepo.getAccountIdentity(reqUser?.sub);
  if (!account) {
    const error = new Error('Your account could not be found. Please log in again.');
    error.status = 401;
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  const prefill = await marketRepo.getMarketplaceProfileForPrefill(account.id, account.account_type);

  return {
    id: account.id,
    name: account.name || 'Parent',
    phone: account.phone || null,
    email: account.email || null,
    type: account.account_type,
    schoolId: account.tenant_id || null,
    schoolSlug: reqUser.schoolSlug || null,
    prefill: prefill || null
  };
}
