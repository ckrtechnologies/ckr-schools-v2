import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './controller.js';

const router = Router();

// Public routes for password reset
router.put('/forgotPassword', controller.forgetPassword);

// Protected routes (Tenant Admin / Staff / Teachers / Students)
router.use(authenticate);

// User Profile / Self
router.get('/getMyself', controller.getMySelf);
router.get('/getUserById/:id', controller.getUserById);
router.put('/updateNotification/:id', controller.updateNotification);
router.get('/getTeacherWeek', controller.getTeacherWeek);
router.get('/getTopper', controller.getTopper);

// Bulk Operations
router.post('/bulk', controller.uploadBulkUser);
router.post('/bulk-delete', controller.bulkDeleteUsers);

// CRUD
router.get('/', controller.getUsers);
router.post('/', controller.createUser);
router.get('/:id', controller.getUserById);
router.put('/:id', controller.updateUser);
router.put('/', controller.updateUser); // Support PUT with { data: { id: ... } } in body
router.delete('/:id', controller.deleteUser);

export default router;

