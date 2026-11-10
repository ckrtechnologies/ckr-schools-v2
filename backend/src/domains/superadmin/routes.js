import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate, authorizeRoles } from '../../middlewares/authenticate.js';

const router = Router();

// All superadmin routes require authentication and super_admin role
router.use(authenticate);
router.use(authorizeRoles('super_admin'));

router.get('/stats', controller.getStatsHandler);
router.get('/tenants', controller.listTenantsHandler);
router.get('/tenants/:id', controller.getTenantHandler);
router.post('/tenants', controller.createTenantHandler);
router.put('/tenants/:id', controller.updateTenantHandler);
router.patch('/tenants/:id/status', controller.toggleStatusHandler);
router.delete('/tenants/:id', controller.deleteTenantHandler);

// Super Admin Marketplace Leads & Monetization Desk
router.get('/marketplace/leads', controller.listMarketplaceLeadsHandler);
router.patch('/marketplace/leads/:id', controller.updateMarketplaceLeadHandler);
router.get('/marketplace/leads/export/:tenantId', controller.getSchoolLeadDossierHandler);
router.post('/marketplace/leads/:id/transfer-to-school', controller.transferMarketplaceLeadHandler);

// Super Admin Marketplace Review Moderation & Feature Promotion
router.get('/marketplace/reviews', controller.listMarketplaceReviewsHandler);
router.patch('/marketplace/reviews/:id/status', controller.updateMarketplaceReviewStatusHandler);
router.delete('/marketplace/reviews/:id', controller.deleteMarketplaceReviewHandler);
router.patch('/marketplace/schools/:tenantId/feature', controller.toggleSchoolFeaturedHandler);

export default router;
