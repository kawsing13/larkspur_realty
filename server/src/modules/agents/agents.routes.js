import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as v from './agents.validation.js';
import * as controller from './agents.controller.js';

export const agentsRouter = Router();

// Public: an agent's profile page with their live listings. Declared before the
// authenticated routes and before "/:id" so it is reachable without a token.
agentsRouter.get('/:id/public', validate(v.publicProfileSchema), controller.getPublic);

// An agent's own profile.
agentsRouter.get('/me', authenticate, controller.getMe);
agentsRouter.patch('/me', authenticate, validate(v.updateMeSchema), controller.updateMe);

// Directory + admin management.
agentsRouter.get('/', authenticate, authorize('agent:read'), validate(v.listAgentsSchema), controller.list);
agentsRouter.post('/', authenticate, authorize('agent:manage'), validate(v.createAgentSchema), controller.create);
agentsRouter.get('/:id', authenticate, authorize('agent:read'), validate(v.agentIdSchema), controller.getOne);
agentsRouter.patch('/:id', authenticate, authorize('agent:manage'), validate(v.updateAgentSchema), controller.update);
