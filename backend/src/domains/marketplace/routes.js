import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// School Admin Self-Service (Authenticated)
router.get('/manage/profile', authenticate, controller.getMySchoolProfileHandler);
router.put('/manage/profile', authenticate, controller.updateMySchoolProfileHandler);

// Public marketplace routes
router.get('/schools', controller.listSchoolsHandler);
router.get('/schools/:slug', controller.getSchoolHandler);
router.post('/schools/:slug/enquiry', controller.submitEnquiryHandler);
router.post('/schools/:slug/brochure', controller.submitBrochureDownloadHandler);
router.post('/multi-enquiry', controller.submitMultiEnquiryHandler);
router.get('/schools/:slug/reviews', controller.listReviewsHandler);
router.post('/schools/:slug/reviews', controller.submitReviewHandler);
router.post('/reviews/:reviewId/helpful', controller.upvoteReviewHandler);
router.get('/schools/:slug/press-releases', controller.listPressReleasesHandler);

export default router;
