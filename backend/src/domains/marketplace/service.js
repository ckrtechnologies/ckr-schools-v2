import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as marketRepo from './repository.js';
import {
  enquirySchema,
  authenticatedReviewSchema,
  publicReviewSchema,
  brochureDownloadSchema,
  multiEnquirySchema,
  marketplaceLoginSchema,
  marketplaceSignupSchema
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
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);

  if (digits.length < 10) {
    const error = new Error('Please enter a valid 10-digit mobile number.');
    error.status = 400;
    error.code = 'INVALID_PHONE';
    throw error;
  }

  const candidates = await marketRepo.findMarketplaceAccountsByPhone(digits);

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
      prefill: prefill || {
        parentName: account.name || '',
        parentPhone: account.phone || '',
        parentEmail: account.email || ''
      }
    }
  };
}

export async function marketplaceSignup(rawData) {
  const data = marketplaceSignupSchema.parse(rawData);
  const digits = String(data.phone || '').replace(/\D/g, '').slice(-10);

  // Check if marketplace parent account already exists
  const existing = await marketRepo.findMarketplaceParentOnlyByPhone(digits);
  if (existing) {
    const error = new Error('An account with this phone number already exists. Please sign in instead.');
    error.status = 409;
    error.code = 'ACCOUNT_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const newParent = await marketRepo.createMarketplaceParent({
    name: data.name,
    phone: digits,
    email: data.email || null,
    passwordHash,
    city: data.city || null,
    childGrade: data.child_grade || null
  });

  const tokenPayload = {
    sub: newParent.id,
    name: newParent.name,
    email: newParent.email,
    phone: newParent.phone,
    role: 'parent',
    type: 'parent',
    accountType: 'parent',
    schoolId: null,
    schoolSlug: null,
    isSuperAdmin: false
  };

  const token = jwt.sign(tokenPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  });

  return {
    token,
    user: {
      id: newParent.id,
      name: newParent.name,
      phone: newParent.phone,
      email: newParent.email,
      type: 'parent',
      schoolId: null,
      schoolSlug: null,
      schoolName: 'SchoolKarma Network',
      prefill: {
        parentName: newParent.name,
        parentPhone: newParent.phone,
        parentEmail: newParent.email || '',
        city: newParent.city || '',
        grade: newParent.child_grade || ''
      }
    }
  };
}

export async function submitReview(slug, rawData, reqUser) {
  const school = await resolveSchool(slug);
  const validated = publicReviewSchema.parse(rawData);

  // If reviewer is signed in, attach their account details; otherwise save public visitor review
  let account = null;
  if (reqUser?.sub) {
    account = await marketRepo.getAccountIdentity(reqUser.sub);
  }

  const reviewerName = (account?.name) || validated.reviewer_name || 'Visitor';
  const reviewerEmail = (account?.email) || validated.reviewer_email || null;
  const reviewerPhone = (account?.phone) || validated.reviewer_phone || null;
  const isVerified = account?.tenant_id ? String(account.tenant_id) === String(school.id) : false;

  try {
    return await marketRepo.createSchoolReview(school.id, {
      ...validated,
      relationship: validated.relationship || 'Parent',
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail,
      reviewer_phone: reviewerPhone,
      reviewer_account_id: account?.id || null,
      reviewer_account_type: account?.account_type || 'public_visitor',
      reviewer_school_id: account?.tenant_id || null,
      is_verified: isVerified
    });
  } catch (err) {
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
