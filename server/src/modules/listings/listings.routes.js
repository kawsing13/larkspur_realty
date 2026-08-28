import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { listListingsSchema, listingIdSchema, transitionSchema } from './listings.validation.js';
import * as controller from './listings.controller.js';

export const listingsRouter = Router();

// Any staff member can read listings (the service scopes agents to their own).
listingsRouter.use(authenticate, authorize('listing:read'));

listingsRouter.get('/', validate(listListingsSchema), controller.list);
listingsRouter.get('/:id', validate(listingIdSchema), controller.getOne);

// The whole workflow runs through one route. The service enforces which role may
// run which action and which status it is valid from.
listingsRouter.post('/:id/:action', validate(transitionSchema), controller.transition);
