import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();

router.use(authenticate);

// 1. Staff Self Leave Operations
router.get('/my-summary', controller.getMyLeaveSummaryHandler);
router.post('/apply', controller.applyLeaveHandler);
router.delete('/:id/cancel', controller.cancelLeaveHandler);

// 2. Admin & Principal Leave Review & Policy
router.get('/admin/list', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.getAllLeaveApplicationsHandler);
router.post('/admin/:id/review', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.reviewLeaveApplicationHandler);
router.get('/admin/policy', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.getLeavePolicyHandler);
router.post('/admin/policy', authorizeRoles('admin', 'super_admin', 'academic_manager', 'teachers_manager', '*'), controller.updateLeavePolicyHandler);

export default router;

