import * as service from './service.js';

export async function getStatsHandler(req, res, next) {
  try {
    const stats = await service.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

export async function listTenantsHandler(req, res, next) {
  try {
    const result = await service.listTenants(req.query);
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getTenantHandler(req, res, next) {
  try {
    const tenant = await service.getTenant(req.params.id);
    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    next(error);
  }
}

export async function createTenantHandler(req, res, next) {
  try {
    const result = await service.createTenant(req.body);
    res.status(201).json({
      success: true,
      message: 'School tenant and initial administrator onboarded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTenantHandler(req, res, next) {
  try {
    const updated = await service.updateTenant(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'School tenant updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatusHandler(req, res, next) {
  try {
    const { isActive } = req.body;
    const updated = await service.toggleStatus(req.params.id, isActive);
    res.status(200).json({
      success: true,
      message: `School tenant ${isActive ? 'activated' : 'suspended'} successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTenantHandler(req, res, next) {
  try {
    const deleted = await service.deleteTenant(req.params.id);
    res.status(200).json({
      success: true,
      message: 'School tenant and all associated data and assets permanently deleted.',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
}

export async function listMarketplaceLeadsHandler(req, res, next) {
  try {
    const result = await service.listMarketplaceLeads(req.query);
    res.status(200).json({
      success: true,
      data: result.items,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMarketplaceLeadHandler(req, res, next) {
  try {
    const updated = await service.updateMarketplaceLead(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Marketplace lead updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function getSchoolLeadDossierHandler(req, res, next) {
  try {
    const dossierData = await service.getSchoolLeadDossier(req.params.tenantId);
    res.status(200).json({
      success: true,
      data: dossierData
    });
  } catch (error) {
    next(error);
  }
}

export async function listMarketplaceReviewsHandler(req, res, next) {
  try {
    const result = await service.listMarketplaceReviews(req.query);
    res.status(200).json({
      success: true,
      data: result.reviews,
      stats: result.stats
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMarketplaceReviewStatusHandler(req, res, next) {
  try {
    const { is_approved } = req.body;
    const result = await service.updateMarketplaceReviewStatus(req.params.id, is_approved);
    res.status(200).json({
      success: true,
      message: result.is_approved ? 'Review approved and published.' : 'Review rejected / hidden.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMarketplaceReviewHandler(req, res, next) {
  try {
    const result = await service.removeMarketplaceReview(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Review permanently deleted.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSchoolFeaturedHandler(req, res, next) {
  try {
    const { is_featured } = req.body;
    const result = await service.toggleSchoolFeatured(req.params.tenantId, is_featured);
    res.status(200).json({
      success: true,
      message: result.is_featured ? 'School marked as Featured on Marketplace.' : 'School removed from Featured.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function transferMarketplaceLeadHandler(req, res, next) {
  try {
    const { admin_notes } = req.body || {};
    const result = await service.transferMarketplaceLead(req.params.id, admin_notes);
    res.status(200).json({
      success: true,
      message: `Lead successfully transferred to School Admissions CRM (ID #${result.transferred_to_school_admission_id}).`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

