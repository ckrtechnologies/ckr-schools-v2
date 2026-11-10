import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

// Academic Meta
router.get('/meta', controller.getAcademicMeta);

// Academic Terms Management CRUD
router.get('/terms', controller.getTerms);
router.post('/terms', controller.createTerm);
router.put('/terms/:id', controller.updateTerm);
router.delete('/terms/:id', controller.deleteTerm);

// Marks Distribution
router.get('/distributions', controller.getDistributions);
router.post('/distributions/clone', controller.cloneDistribution);
router.post('/distributions', controller.saveDistribution);
router.patch('/distributions/:id/lock', controller.toggleLock);
router.delete('/distributions/:id', controller.deleteDistribution);

// Grading Tracker
router.get('/grading-tracker', controller.getGradingTracker);
router.post('/grading-tracker/remind', controller.sendGradingReminder);

// Co-Scholastic Assessment
router.get('/co-scholastic', controller.getCoScholasticHandler);
router.post('/co-scholastic/bulk', controller.saveCoScholasticBulkHandler);

export default router;
