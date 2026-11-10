import * as repo from './repository.js';
import { listTenantsQuerySchema, createTenantSchema, updateTenantSchema } from './validation.js';

export async function getStats() {
  return await repo.getPlatformStats();
}

export async function listTenants(rawQuery) {
  const query = listTenantsQuerySchema.parse(rawQuery);
  return await repo.listTenants(query);
}

export async function getTenant(id) {
  const tenant = await repo.getTenantById(id);
  if (!tenant) {
    const err = new Error(`School tenant with id '${id}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return tenant;
}

export async function createTenant(rawBody) {
  const data = createTenantSchema.parse(rawBody);
  return await repo.createTenantWithAdmin(data);
}

export async function updateTenant(id, rawBody) {
  const data = updateTenantSchema.parse(rawBody);
  const existing = await repo.getTenantById(id);
  if (!existing) {
    const err = new Error(`School tenant with id '${id}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return await repo.updateTenant(id, data);
}

export async function toggleStatus(id, isActive) {
  const existing = await repo.getTenantById(id);
  if (!existing) {
    const err = new Error(`School tenant with id '${id}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return await repo.updateTenant(id, { isActive: Boolean(isActive) });
}

export async function deleteTenant(id) {
  const existing = await repo.getTenantById(id);
  if (!existing) {
    const err = new Error(`School tenant with id '${id}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return await repo.deleteTenantCascade(id);
}

export async function listMarketplaceLeads(query) {
  return await repo.listMarketplaceLeads(query);
}

export async function updateMarketplaceLead(id, data) {
  const updated = await repo.updateMarketplaceLead(id, data);
  if (!updated) {
    const err = new Error(`Marketplace lead with id '${id}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return updated;
}

export async function getSchoolLeadDossier(tenantId) {
  return await repo.getSchoolLeadDossier(tenantId);
}

export async function listMarketplaceReviews(query) {
  return await repo.listMarketplaceReviews(query);
}

export async function updateMarketplaceReviewStatus(reviewId, isApproved) {
  const result = await repo.updateReviewStatus(reviewId, isApproved);
  if (!result) {
    const err = new Error(`Review '${reviewId}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return result;
}

export async function removeMarketplaceReview(reviewId) {
  const result = await repo.deleteReview(reviewId);
  if (!result) {
    const err = new Error(`Review '${reviewId}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return result;
}

export async function toggleSchoolFeatured(tenantId, isFeatured) {
  const result = await repo.toggleSchoolFeatured(tenantId, isFeatured);
  if (!result) {
    const err = new Error(`School profile for tenant '${tenantId}' not found.`);
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return result;
}

export async function transferMarketplaceLead(leadId, adminNotes) {
  return await repo.transferLeadToSchoolCRM(leadId, adminNotes);
}

