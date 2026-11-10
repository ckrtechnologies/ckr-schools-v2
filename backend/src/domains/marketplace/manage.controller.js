import * as manageService from './manage.service.js';

// The JWT is authoritative for SPOC/admin accounts: a stale tenant header must never
// point the portal at another school.
const tenantIdOf = (req) => req.user?.schoolId || req.tenant?.id || null;

export async function getOverviewHandler(req, res, next) {
  try {
    const data = await manageService.getOverview(tenantIdOf(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getProfileHandler(req, res, next) {
  try {
    const data = await manageService.getProfile(tenantIdOf(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const data = await manageService.updateProfile(tenantIdOf(req), req.body);
    return res.status(200).json({
      success: true,
      message: 'Marketplace profile saved.',
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function setPublishedHandler(req, res, next) {
  try {
    const data = await manageService.setPublished(tenantIdOf(req), req.body, req.user?.sub);
    return res.status(200).json({
      success: true,
      message: data.is_published
        ? 'Your school is live on the CKR Marketplace.'
        : 'Your school has been unpublished from the CKR Marketplace.',
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function listReviewsHandler(req, res, next) {
  try {
    const data = await manageService.listReviews(tenantIdOf(req), req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export async function replyReviewHandler(req, res, next) {
  try {
    const data = await manageService.replyToReview(tenantIdOf(req), req.params.id, req.body, req.user?.sub);
    return res.status(200).json({ success: true, message: 'Reply published.', data });
  } catch (error) {
    next(error);
  }
}

export async function deleteReplyHandler(req, res, next) {
  try {
    const data = await manageService.removeReviewReply(tenantIdOf(req), req.params.id);
    return res.status(200).json({ success: true, message: 'Reply removed.', data });
  } catch (error) {
    next(error);
  }
}

export async function reportReviewHandler(req, res, next) {
  try {
    const data = await manageService.reportReview(tenantIdOf(req), req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: data.is_reported ? 'Sent to CKR for review.' : 'Report withdrawn.',
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function listGalleryHandler(req, res, next) {
  try {
    const data = await manageService.listGallery(tenantIdOf(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateGalleryHandler(req, res, next) {
  try {
    const data = await manageService.updateGalleryItem(tenantIdOf(req), req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Gallery item updated.', data });
  } catch (error) {
    next(error);
  }
}

export async function createGalleryHandler(req, res, next) {
  try {
    const data = await manageService.createGalleryItem(tenantIdOf(req), req.body);
    return res.status(201).json({ success: true, message: 'Media added to the gallery.', data });
  } catch (error) {
    next(error);
  }
}

export async function deleteGalleryHandler(req, res, next) {
  try {
    const data = await manageService.deleteGalleryItem(tenantIdOf(req), req.params.id);
    return res.status(200).json({ success: true, message: 'Media deleted.', data });
  } catch (error) {
    next(error);
  }
}

export async function listPressHandler(req, res, next) {
  try {
    const data = await manageService.listPress(tenantIdOf(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createPressHandler(req, res, next) {
  try {
    const data = await manageService.createPress(tenantIdOf(req), req.body, req.user?.sub);
    return res.status(201).json({ success: true, message: 'Press release created.', data });
  } catch (error) {
    next(error);
  }
}

export async function updatePressHandler(req, res, next) {
  try {
    const data = await manageService.updatePress(tenantIdOf(req), req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Press release updated.', data });
  } catch (error) {
    next(error);
  }
}

export async function deletePressHandler(req, res, next) {
  try {
    const data = await manageService.deletePress(tenantIdOf(req), req.params.id);
    return res.status(200).json({ success: true, message: 'Press release deleted.', data });
  } catch (error) {
    next(error);
  }
}

export async function listLeadsHandler(req, res, next) {
  try {
    const data = await manageService.listLeads(tenantIdOf(req), req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}
