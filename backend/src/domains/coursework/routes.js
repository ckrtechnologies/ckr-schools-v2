import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect all coursework & consents endpoints
router.use(authenticate);

// Coursework / Homework (mounted under /course or root /)
router.get('/', controller.getCourseworkHandler);
router.post('/', controller.createCourseworkHandler);
router.put('/:id', controller.updateCourseworkHandler);
router.delete('/:id', controller.deleteCourseworkHandler);

router.get('/course', controller.getCourseworkHandler);
router.post('/course', controller.createCourseworkHandler);
router.put('/course/:id', controller.updateCourseworkHandler);
router.delete('/course/:id', controller.deleteCourseworkHandler);

// Submissions (supports Vision uploadFile and submitAnswer endpoints)
router.put('/uploadFile', controller.submitCourseworkHandler);
router.post('/uploadFile', controller.submitCourseworkHandler);
router.post('/submit', controller.submitCourseworkHandler);
router.put('/course/uploadFile', controller.submitCourseworkHandler);
router.post('/course/uploadFile', controller.submitCourseworkHandler);
router.post('/course/submit', controller.submitCourseworkHandler);

// Consents (Admin & Mobile App)
router.get('/consents', controller.getConsentsHandler);
router.get('/consents/admin', controller.getConsentsHandler);
router.get('/consents/student', controller.getStudentConsentsHandler);
router.post('/consents', controller.createConsentHandler);
router.put('/consents/admin/:id', controller.updateConsentHandler);
router.delete('/consents/admin/:id', controller.deleteConsentHandler);
router.get('/consents/admin/:id/report', controller.getConsentReportHandler);
router.post('/consents/student/:id/status', controller.updateStudentConsentStatusHandler);
router.put('/consents/student/:id/status', controller.updateStudentConsentStatusHandler);

export default router;
