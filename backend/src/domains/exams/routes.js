import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect exam routes
router.use(authenticate);

// Exams / Date sheets (REST + Vision legacy aliases)
router.get('/', controller.getExamsHandler);
router.post('/', controller.createExamHandler);
router.put('/:id', controller.updateExamHandler);
router.delete('/:id', controller.deleteExamHandler);

router.post('/datesheet', controller.createExamHandler);
router.post('/datesheet/clone', controller.cloneDateSheetHandler);
router.post('/clone-date-sheet', controller.cloneDateSheetHandler);
router.put('/updateExams/:id', controller.updateExamHandler);
router.delete('/deleteExams/:id', controller.deleteExamHandler);

router.get('/grades', controller.getExamGradesHandler);
router.get('/grades/:examId', controller.getExamGradesHandler);
router.post('/grades/bulk', controller.saveGradesBulkHandler);

router.get('/:id/distribution', controller.getExamDistributionHandler);
router.get('/datesheet/:title/:class_id/grades', controller.getDateSheetGradesHandler);
router.post('/datesheet/:title/:class_id/grades/bulk', controller.saveGradesBulkHandler);

// Grading Scales & Aggregated Results
router.get('/grading-scales', controller.getGradingScalesHandler);
router.post('/grading-scales', controller.createGradingScaleHandler);
router.put('/grading-scales/:id', controller.updateGradingScaleHandler);
router.delete('/grading-scales/:id', controller.deleteGradingScaleHandler);

router.get('/results', controller.getAggregatedResultsHandler);

// Co-Scholastic
router.get('/co-scholastic', controller.getCoScholasticHandler);
router.post('/co-scholastic/bulk', controller.saveCoScholasticBulkHandler);

export default router;

