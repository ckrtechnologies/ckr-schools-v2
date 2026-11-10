import { Router } from 'express';
import * as controller from './manage.controller.js';
import { authenticate, authorizeRoles } from '../../middlewares/authenticate.js';

const router = Router();

// Every route is tenant-scoped from the JWT: a SPOC can only touch its own school.
router.use(authenticate);
router.use(authorizeRoles('spoc', 'admin', 'principal'));

router.get('/overview', controller.getOverviewHandler);

router.get('/profile', controller.getProfileHandler);
router.put('/profile', controller.updateProfileHandler);
router.patch('/publish', controller.setPublishedHandler);

router.get('/reviews', controller.listReviewsHandler);
router.post('/reviews/:id/reply', controller.replyReviewHandler);
router.delete('/reviews/:id/reply', controller.deleteReplyHandler);
router.patch('/reviews/:id/report', controller.reportReviewHandler);

router.get('/gallery', controller.listGalleryHandler);
router.post('/gallery', controller.createGalleryHandler);
router.patch('/gallery/:id', controller.updateGalleryHandler);
router.delete('/gallery/:id', controller.deleteGalleryHandler);

router.get('/press', controller.listPressHandler);
router.post('/press', controller.createPressHandler);
router.patch('/press/:id', controller.updatePressHandler);
router.delete('/press/:id', controller.deletePressHandler);

router.get('/leads', controller.listLeadsHandler);

export default router;
