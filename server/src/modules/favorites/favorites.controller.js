import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './favorites.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.listFavorites(req.user) });
});

export const listIds = asyncHandler(async (req, res) => {
  res.json({ propertyIds: await service.listFavoriteIds(req.user) });
});

export const add = asyncHandler(async (req, res) => {
  await service.addFavorite(req.user, req.body.propertyId);
  res.status(201).json({ ok: true });
});

export const remove = asyncHandler(async (req, res) => {
  await service.removeFavorite(req.user, req.params.propertyId);
  res.status(204).end();
});
