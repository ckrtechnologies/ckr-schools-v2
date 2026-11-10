import * as marketService from './service.js';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

function isLoginRateLimited(req) {
  const key = `${req.ip || 'unknown'}:${String(req.body?.phone || '').trim()}`;
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
    return false;
  }

  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

export async function listFacetsHandler(req, res, next) {
  try {
    const facets = await marketService.getFacets();
    return res.status(200).json({ success: true, data: facets });
  } catch (error) {
    next(error);
  }
}

export async function marketplaceLoginHandler(req, res, next) {
  try {
    if (isLoginRateLimited(req)) {
      return res.status(429).json({
        success: false,
        error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Please try again later.' }
      });
    }
    const result = await marketService.marketplaceLogin(req.body);
    return res.status(200).json({
      success: true,
      token: result.token,
      accessToken: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
}

export async function marketplaceMeHandler(req, res, next) {
  try {
    const account = await marketService.getMarketplaceMe(req.user);
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
}

export async function listSchoolsHandler(req, res, next) {
  try {
    const schools = await marketService.getSchools(req.query);
    return res.status(200).json({
      success: true,
      data: schools
    });
  } catch (error) {
    next(error);
  }
}

export async function getSchoolHandler(req, res, next) {
  try {
    const school = await marketService.getSchoolDetails(req.params.slug);
    return res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    next(error);
  }
}

export async function submitEnquiryHandler(req, res, next) {
  try {
    const enquiry = await marketService.submitEnquiry(req.params.slug, req.body);
    return res.status(201).json({
      success: true,
      message: 'Admission enquiry submitted successfully. Our admission counselor will connect with you shortly.',
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
}

export async function submitBrochureDownloadHandler(req, res, next) {
  try {
    const lead = await marketService.submitBrochureDownload(req.params.slug, req.body);
    return res.status(201).json({
      success: true,
      message: 'Brochure download unlocked successfully.',
      data: lead
    });
  } catch (error) {
    next(error);
  }
}

export async function submitMultiEnquiryHandler(req, res, next) {
  try {
    const leads = await marketService.submitMultiEnquiry(req.body);
    return res.status(201).json({
      success: true,
      message: `Enquiries successfully sent to ${leads.length} selected school(s).`,
      data: leads
    });
  } catch (error) {
    next(error);
  }
}

export async function listReviewsHandler(req, res, next) {
  try {
    const reviews = await marketService.getReviews(req.params.slug);
    return res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
}

export async function submitReviewHandler(req, res, next) {
  try {
    const review = await marketService.submitReview(req.params.slug, req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      data: review
    });
  } catch (error) {
    next(error);
  }
}

export async function upvoteReviewHandler(req, res, next) {
  try {
    const result = await marketService.upvoteReview(req.params.reviewId);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function listPressReleasesHandler(req, res, next) {
  try {
    const press = await marketService.getPressReleases(req.params.slug);
    return res.status(200).json({
      success: true,
      data: press
    });
  } catch (error) {
    next(error);
  }
}
