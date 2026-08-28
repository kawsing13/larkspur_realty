import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './search.service.js';

export const search = asyncHandler(async (req, res) => {
  res.json(await service.search(req.query));
});

export const facets = asyncHandler(async (req, res) => {
  res.json(await service.facets());
});
