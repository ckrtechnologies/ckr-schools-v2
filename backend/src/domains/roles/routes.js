import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './rolesController.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.getRoles);
router.post('/', controller.createRole);
router.put('/:id', controller.updateRole);
router.delete('/:id', controller.deleteRole);

export default router;

