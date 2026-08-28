import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { searchSchema } from './search.validation.js';
import * as controller from './search.controller.js';

export const searchRouter = Router();

// Public. No auth needed to browse the marketplace.
searchRouter.get('/', validate(searchSchema), controller.search);
searchRouter.get('/facets', controller.facets);
