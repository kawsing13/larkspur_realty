import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as v from './savedSearches.validation.js';
import * as service from './savedSearches.service.js';

export const savedSearchesRouter = Router();
savedSearchesRouter.use(authenticate);

savedSearchesRouter.get(
  '/',
  asyncHandler(async (req, res) => res.json({ data: await service.listSavedSearches(req.user) })),
);

savedSearchesRouter.post(
  '/',
  validate(v.createSchema),
  asyncHandler(async (req, res) =>
    res.status(201).json({ savedSearch: await service.createSavedSearch(req.user, req.body) }),
  ),
);

savedSearchesRouter.patch(
  '/:id',
  validate(v.updateSchema),
  asyncHandler(async (req, res) =>
    res.json({ savedSearch: await service.updateSavedSearch(req.user, req.params.id, req.body) }),
  ),
);

savedSearchesRouter.delete(
  '/:id',
  validate(v.idSchema),
  asyncHandler(async (req, res) => {
    await service.deleteSavedSearch(req.user, req.params.id);
    res.status(204).end();
  }),
);
