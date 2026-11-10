import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Public login (tenant-scoped or super admin)
router.post('/login', controller.loginHandler);
router.post('/loginUser', controller.loginHandler); // 100% backward compatible alias for Vision frontends!
router.post('/user/loginUser', controller.loginHandler); // Support /api/user/loginUser exact path!

// Protected routes
router.get('/me', authenticate, controller.meHandler);
router.patch('/profile', authenticate, controller.updateProfileHandler);
router.post('/change-password', authenticate, controller.changePasswordHandler);
router.post('/auth/change-password', authenticate, controller.changePasswordHandler);

export default router;
