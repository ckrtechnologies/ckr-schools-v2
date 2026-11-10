import * as marketService from './service.js';

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
    const review = await marketService.submitReview(req.params.slug, req.body);
    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
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

export async function getMySchoolProfileHandler(req, res, next) {
  try {
    const profile = await marketService.getMySchoolProfile(req.tenant.id);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMySchoolProfileHandler(req, res, next) {
  try {
    const updated = await marketService.updateMySchoolProfile(req.tenant.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Marketplace school profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}
