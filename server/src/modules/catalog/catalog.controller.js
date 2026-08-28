import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './catalog.service.js';

export const listTypes = asyncHandler(async (req, res) => {
  res.json({ data: await service.listPropertyTypes() });
});

export const createType = asyncHandler(async (req, res) => {
  res.status(201).json({ propertyType: await service.createPropertyType(req.body.name) });
});

export const listAmenities = asyncHandler(async (req, res) => {
  res.json({ data: await service.listAmenities() });
});

export const createAmenity = asyncHandler(async (req, res) => {
  const amenity = await service.createAmenity(req.body.name, req.body.category);
  res.status(201).json({ amenity });
});
