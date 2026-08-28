import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { listUsersSchema, userIdSchema, setStatusSchema } from './users.validation.js';
import * as usersController from './users.controller.js';

export const usersRouter = Router();

// Everything here is admin-only.
usersRouter.use(authenticate, authorize.role('ADMINISTRATOR', 'SUPER_ADMIN'));

usersRouter.get('/', validate(listUsersSchema), usersController.list);
usersRouter.get('/:id', validate(userIdSchema), usersController.getOne);
usersRouter.patch('/:id/status', validate(setStatusSchema), usersController.setStatus);
