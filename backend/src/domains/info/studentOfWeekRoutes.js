import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './studentOfWeekController.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.getAllStudentOfWeek);
router.get('/current', controller.getCurrentStudentOfWeek);
router.post('/', controller.createStudentOfWeekOverride);
router.delete('/:id', controller.deleteStudentOfWeek);

export default router;

