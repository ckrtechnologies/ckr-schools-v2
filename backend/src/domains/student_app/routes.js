import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';
import { changePasswordHandler } from '../auth/controller.js';
import { getStudentCoursesHandler, submitCourseworkHandler, getStudentConsentsHandler, updateStudentConsentStatusHandler } from '../coursework/controller.js';
import { getStudentFeesHandler } from '../finance/controller.js';

// Feature domain routers
import examsRouter from '../exams/routes.js';
import attendanceRouter from '../attendance/routes.js';
import financeRouter from '../finance/routes.js';
import courseworkRouter from '../coursework/routes.js';
import timetableRouter from '../timetable/routes.js';
import communicationRouter from '../communication/routes.js';
import infoRouter from '../info/routes.js';
import liveChatRouter from '../live_chat/routes.js';

const router = Router();

// Protect all Student App routes
router.use(authenticate);

// 1. Dashboard, Quotes, Rewards, Timetable, Academics/Exams, Coursework
router.get('/dashboard', controller.getDashboardHandler);
router.get('/quote', controller.getQuoteHandler);
router.get('/rewards', controller.getRewardsHandler);
router.get('/timetable', controller.getTimetableHandler);
router.get('/exams', controller.getStudentAcademicsHandler);
router.get('/siblings', controller.getSiblingsHandler);
router.get('/course', getStudentCoursesHandler);
router.put('/course/uploadFile', submitCourseworkHandler);
router.post('/course/submit', submitCourseworkHandler);
router.get('/fees', getStudentFeesHandler);
router.get('/consents/student', getStudentConsentsHandler);
router.put('/consents/student/:id/status', updateStudentConsentStatusHandler);
router.post('/consents/student/:id/status', updateStudentConsentStatusHandler);

// 2. Auth / Security
router.post('/auth/change-password', changePasswordHandler);

// 3. Domain Delegation
router.use('/exams', examsRouter);
router.use('/attendance', attendanceRouter);
router.use('/fees', financeRouter);
router.use('/course', courseworkRouter);
router.use('/consents', courseworkRouter);
router.use('/timetable', timetableRouter);
router.use('/info', infoRouter);
router.use('/live_chat', liveChatRouter);

// Domain fallbacks (handles /fees, /notifications, /communication, /events, /newsletters, /consents/student)
router.use('/', financeRouter);
router.use('/', communicationRouter);
router.use('/', courseworkRouter);
router.use('/', attendanceRouter);
router.use('/', infoRouter);

export default router;
