import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Authenticated routes
router.use(authenticate);

// Inquiries / Leads (newUsers) - REST + Vision Legacy Aliases
router.get('/enquiries', controller.getEnquiriesHandler);
router.get('/getAllNewUser', controller.getEnquiriesHandler);

router.get('/enquiries/:id', controller.getEnquiryByIdHandler);
router.get('/getNewUser/:id', controller.getEnquiryByIdHandler);

router.post('/enquiries', controller.createEnquiryHandler);
router.post('/createNewUser', controller.createEnquiryHandler);

router.put('/enquiries/:id', controller.updateEnquiryHandler);
router.put('/updateNewUser/:id', controller.updateEnquiryHandler);

router.delete('/enquiries/:id', controller.deleteEnquiryHandler);
router.delete('/deleteNewUser/:id', controller.deleteEnquiryHandler);

router.patch('/enquiries/:id/status', controller.updateEnquiryStatusHandler);
router.post('/enquiries/:id/enroll', controller.enrollStudentHandler);
router.post('/approveNewUser', controller.approveNewUserHandler);

export default router;
