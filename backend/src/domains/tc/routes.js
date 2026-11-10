import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();

// Public TC verification endpoint (QR code scan on printed certificate)
// Supports slashes in tcNumber like /verify/ARC/2026/001 or query ?tcNumber=...
router.get('/verify/{*tcNumber}', controller.getTCById);
router.get('/verify', controller.getTCById);

// Protect all other TC endpoints
router.use(authenticate);

// Classes & Students for TC Generation
router.get('/classes', controller.getClasses);
router.get('/classes/:classId/students', controller.getClassStudents);
router.get('/prefill/:studentId', controller.getStudentPrefill);

// Save & Retrieve Certificates
router.post('/generate', controller.saveCertificate);
router.get('/records', controller.getRecords);
router.get('/:id', controller.getTCById);

export default router;
