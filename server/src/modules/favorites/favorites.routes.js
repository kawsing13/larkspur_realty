import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { addFavoriteSchema, propertyIdParamSchema } from './favorites.validation.js';
import * as controller from './favorites.controller.js';

export const favoritesRouter = Router();

// All favorites routes require a signed-in user; the service checks it is a customer.
favoritesRouter.use(authenticate);

favoritesRouter.get('/', controller.list);
favoritesRouter.get('/ids', controller.listIds);
favoritesRouter.post('/', validate(addFavoriteSchema), controller.add);
favoritesRouter.delete('/:propertyId', validate(propertyIdParamSchema), controller.remove);
