import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();
router.use(authenticate);

router.get('/list', controller.getLiveChatsList);
router.get('/teachers', controller.getTeachers);
router.get('/students', controller.getStudents);
router.get('/principal', controller.getPrincipal);
router.get('/history/:userId', controller.getLiveChatHistory);

export default router;

