import { Router } from 'express';
import * as controller from './controller.js';
import * as erpController from './erpLead.controller.js';
import manageRouter from './manage.routes.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// School SPOC portal (public-domain management) — authenticated + tenant scoped
router.use('/manage', manageRouter);

// Public marketplace routes
router.get('/facets', controller.listFacetsHandler);
router.get('/schools', controller.listSchoolsHandler);
router.get('/schools/:slug', controller.getSchoolHandler);
router.post('/auth/login', controller.marketplaceLoginHandler);
router.post('/auth/signup', controller.marketplaceSignupHandler);
router.get('/auth/me', authenticate, controller.marketplaceMeHandler);

// Public enquiry & Institutional ERP Lead routes
router.post('/erp-leads', erpController.submitErpLeadHandler);
router.get('/erp-leads', authenticate, erpController.listErpLeadsHandler);
router.post('/schools/:slug/enquiry', controller.submitEnquiryHandler);
router.post('/schools/:slug/brochure', controller.submitBrochureDownloadHandler);
router.post('/multi-enquiry', controller.submitMultiEnquiryHandler);
router.get('/schools/:slug/reviews', controller.listReviewsHandler);
router.post('/schools/:slug/reviews', controller.submitReviewHandler);
router.post('/reviews/:reviewId/helpful', controller.upvoteReviewHandler);
router.get('/schools/:slug/press-releases', controller.listPressReleasesHandler);

export default router;
