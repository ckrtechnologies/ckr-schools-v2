import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect all timetable endpoints
router.use(authenticate);

// 1. Settings (must be before :classId)
router.get('/timetable-settings', controller.getSettingsHandler);
router.post('/timetable-settings', controller.saveSettingsHandler);
router.get('/teacher_schedule/timetable-settings', controller.getSettingsHandler);
router.post('/teacher_schedule/timetable-settings', controller.saveSettingsHandler);

// 2. Proxies & Substitutions (must be before :classId)
router.get('/daily-proxies', controller.getDailyProxiesHandler);
router.post('/assign-proxy', controller.assignProxyHandler);
router.delete('/cancel-proxy/:id', controller.cancelProxyHandler);
router.get('/teacher_schedule/daily-proxies', controller.getDailyProxiesHandler);
router.post('/teacher_schedule/assign-proxy', controller.assignProxyHandler);
router.delete('/teacher_schedule/cancel-proxy/:id', controller.cancelProxyHandler);

router.get('/free-teachers', controller.getFreeTeachersHandler);
router.get('/teacher_schedule/free-teachers', controller.getFreeTeachersHandler);

router.post('/assign-allotment', controller.assignAllotmentHandler);
router.post('/teacher_schedule/assign-allotment', controller.assignAllotmentHandler);

// 3. Teacher Schedules, Workload & Quota Matrices (must be before /:classId /:id)
router.get('/teachers', controller.getTeachersWithStatsHandler);
router.get('/teacher_schedule/teachers', controller.getTeachersWithStatsHandler);

router.get('/workload-matrix', controller.getWorkloadMatrixHandler);
router.get('/teacher_schedule/workload-matrix', controller.getWorkloadMatrixHandler);

router.get('/allotment-matrix', controller.getMasterAllotmentMatrixHandler);
router.get('/teacher_schedule/allotment-matrix', controller.getMasterAllotmentMatrixHandler);

router.get('/subject-quotas', controller.getSubjectQuotasHandler);
router.post('/subject-quotas', controller.saveSubjectQuotasHandler);
router.get('/teacher_schedule/subject-quotas', controller.getSubjectQuotasHandler);
router.post('/teacher_schedule/subject-quotas', controller.saveSubjectQuotasHandler);

router.get('/teacher-quotas', controller.getTeacherQuotasHandler);
router.post('/teacher-quotas', controller.saveTeacherQuotasHandler);
router.get('/teacher_schedule/teacher-quotas', controller.getTeacherQuotasHandler);
router.post('/teacher_schedule/teacher-quotas', controller.saveTeacherQuotasHandler);

router.get('/:teacherId/routine', controller.getTeacherWeeklyRoutineHandler);
router.get('/teacher_schedule/:teacherId/routine', controller.getTeacherWeeklyRoutineHandler);

router.get('/:teacherId/yearly', controller.getTeacherFullYearScheduleHandler);
router.get('/teacher_schedule/:teacherId/yearly', controller.getTeacherFullYearScheduleHandler);

// 4. Timetable Entries
router.get('/', controller.getTimetableHandler);
router.get('/getTimeTable', controller.getTimetableHandler);
router.get('/timeTable/getTimeTable', controller.getTimetableHandler);
router.get('/class/:classId', controller.getTimetableHandler);

router.post('/addPeriod', controller.addPeriodHandler);
router.post('/createTimeTable', controller.addPeriodHandler);
router.post('/timeTable/createTimeTable', controller.addPeriodHandler);
router.post('/timeTable/addPeriod', controller.addPeriodHandler);

router.put('/updatePeriod/:id', controller.updatePeriodHandler);
router.put('/timeTable/updatePeriod/:id', controller.updatePeriodHandler);

router.delete('/deletePeriod/:id', controller.deletePeriodHandler);
router.delete('/timeTable/deletePeriod/:id', controller.deletePeriodHandler);

router.post('/duplicateDay', controller.duplicateDayHandler);
router.post('/timeTable/duplicateDay', controller.duplicateDayHandler);

export default router;
