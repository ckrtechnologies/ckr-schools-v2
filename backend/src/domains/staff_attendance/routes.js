import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();

router.use(authenticate);

// 1. Staff Self Attendance
router.get('/today', controller.getTodayAttendanceHandler);
router.post('/check-in', controller.checkInHandler);
router.post('/check-out', controller.checkOutHandler);
router.get('/my-history', controller.getMyHistoryHandler);

// 2. Admin & Manager Management Endpoints
router.get('/admin/roster', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.getRosterHandler);
router.post('/admin/override', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.overrideAttendanceHandler);
router.get('/admin/monthly-matrix', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.getMonthlyMatrixHandler);

export default router;

