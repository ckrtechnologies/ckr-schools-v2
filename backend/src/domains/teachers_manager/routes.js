import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

// Parameters CRUD
router.get('/parameters', controller.getParameters);
router.post('/parameters', controller.createParameter);
router.put('/parameters/:id', controller.updateParameter);
router.delete('/parameters/:id', controller.deleteParameter);

// Teacher list
router.get('/teachers', controller.getTeachers);

// Matrix view & Batch Save
router.get('/matrix', controller.getMatrix);
router.post('/evaluations/batch-save', controller.saveBatchEvaluations);

// Single Teacher Score Card & Analytics
router.get('/scorecard/:teacherId', controller.getScorecard);
router.get('/analytics/teacher/:teacherId', controller.getTeacherAnalytics);

export default router;

