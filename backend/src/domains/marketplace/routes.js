import { Router } from 'express';
import * as controller from './controller.js';
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
router.get('/auth/me', authenticate, controller.marketplaceMeHandler);

// Public enquiry routes (no login required)
router.post('/schools/:slug/enquiry', controller.submitEnquiryHandler);
router.post('/schools/:slug/brochure', controller.submitBrochureDownloadHandler);
router.post('/multi-enquiry', controller.submitMultiEnquiryHandler);
router.get('/schools/:slug/reviews', controller.listReviewsHandler);
router.post('/schools/:slug/reviews', authenticate, controller.submitReviewHandler);
router.post('/reviews/:reviewId/helpful', controller.upvoteReviewHandler);
router.get('/schools/:slug/press-releases', controller.listPressReleasesHandler);

export default router;
