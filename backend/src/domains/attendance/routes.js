import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect attendance endpoints
router.use(authenticate);

// Attendance routes (supports both REST and Vision legacy shapes)
router.get('/', controller.getAttendanceHandler);
router.get('/overview', controller.getAttendanceHandler);
router.post('/bulk', controller.bulkUpdateAttendanceHandler);
router.put('/:id', controller.updateSingleAttendanceHandler);

// Annual Planner routes
router.get('/planner', controller.getPlannerEventsHandler);
router.post('/planner', controller.createPlannerEventHandler);
router.put('/planner/:id', controller.updatePlannerEventHandler);
router.delete('/planner/:id', controller.deletePlannerEventHandler);

router.get('/events/getAllEvents', controller.getPlannerEventsHandler);
router.get('/planner/consent-report/:eventId', controller.getConsentReportHandler);
router.post('/planner/consent-reminders/:eventId', controller.sendConsentRemindersHandler);
router.post('/planner/mock-consent/:consentId', controller.mockParentConsentHandler);

export default router;

