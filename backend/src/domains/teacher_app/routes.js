import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';
import { changePasswordHandler } from '../auth/controller.js';
import { getCoScholasticHandler, saveCoScholasticBulkHandler } from '../exams/controller.js';
import { getComplaintsHandler, createComplaintHandler, getCircularsHandler } from '../communication/controller.js';
import { getPlannerEventsHandler } from '../attendance/controller.js';
import { getNewslettersHandler, addNewsletterHandler, deleteNewsletterHandler } from '../info/controller.js';

// Feature domain routers
import examsRouter from '../exams/routes.js';
import courseworkRouter from '../coursework/routes.js';
import timetableRouter from '../timetable/routes.js';
import communicationRouter from '../communication/routes.js';
import infoRouter from '../info/routes.js';
import tcRouter from '../tc/routes.js';

const router = Router();

// Protect all Teacher App routes
router.use(authenticate);

// 1. Profile & Classes
router.get('/profile', controller.getTeacherProfileHandler);
router.get('/classes', controller.getTeacherClassesHandler);
router.get('/classes/:id/students', controller.getClassStudentsHandler);
router.get('/classes/:id/performance', controller.getClassPerformanceHandler);

// 2. Timetable
router.get('/timetable', controller.getTeacherTimetableHandler);

// 3. Auth / Password
router.post('/auth/change-password', changePasswordHandler);

// 4. Co-Scholastic (Teacher App parity)
router.get('/co-scholastic', getCoScholasticHandler);
router.post('/co-scholastic/bulk', saveCoScholasticBulkHandler);

// 5. Complaints Desk (Teacher App parity)
router.get('/complaints', getComplaintsHandler);
router.post('/complaints', createComplaintHandler);

// 6. Annual Planner Events, Newsletters & Circulars
router.get('/events', getPlannerEventsHandler);
router.get('/newsletters', getNewslettersHandler);
router.post('/newsletters', addNewsletterHandler);
router.delete('/newsletters/:id', deleteNewsletterHandler);
router.get('/circulars', getCircularsHandler);

// 7. Feature Domain Delegations
router.use('/exams', examsRouter);
router.use('/course', courseworkRouter);
router.use('/tc', tcRouter);
router.use('/info', infoRouter);

// Domain fallbacks (handles /complaints, /notifications, /communication, /events, /newsletters)
router.use('/', communicationRouter);
router.use('/', courseworkRouter);
router.use('/', infoRouter);

export default router;
