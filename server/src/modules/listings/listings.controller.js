import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './listings.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await service.listForStaff(req.user, req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ listing: await service.getForStaff(req.user, req.params.id) });
});

export const transition = asyncHandler(async (req, res) => {
  const listing = await service.runTransition(req.user, req.params.id, req.params.action, req.body);
  res.json({ listing });
});
