import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/ApiError.js';
import { writeAudit } from '../../lib/audit.js';
import { propertyBrochurePDF } from '../../lib/pdf.js';
import * as service from './properties.service.js';

// ---- Public ----

export const listPublic = asyncHandler(async (req, res) => {
  res.json(await service.listPublished(req.query));
});

export const getPublic = asyncHandler(async (req, res) => {
  res.json({ property: await service.getPublishedByKey(req.params.key) });
});

export const brochure = asyncHandler(async (req, res) => {
  const { property, coverImage } = await service.getBrochureData(req.params.key);
  const pdf = await propertyBrochurePDF({ property, coverImage });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${property.reference}.pdf"`);
  res.send(pdf);
});

// ---- Staff ----

export const listManage = asyncHandler(async (req, res) => {
  res.json(await service.listForStaff(req.user, req.query));
});

export const getManage = asyncHandler(async (req, res) => {
  res.json({ property: await service.getForStaff(req.user, req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const property = await service.createProperty(req.user, req.body);
  await writeAudit({
    req,
    action: 'property.created',
    entityType: 'Property',
    entityId: property.id,
    summary: `Created ${property.reference} (${property.title})`,
  });
  res.status(201).json({ property });
});

export const update = asyncHandler(async (req, res) => {
  const property = await service.updateProperty(req.user, req.params.id, req.body);
  res.json({ property });
});

export const saveLocation = asyncHandler(async (req, res) => {
  const property = await service.saveLocation(req.user, req.params.id, req.body);
  res.json({ property });
});

export const saveAmenities = asyncHandler(async (req, res) => {
  const property = await service.setAmenities(req.user, req.params.id, req.body.slugs);
  res.json({ property });
});

export const addImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.validation('Choose an image file to upload');
  const image = await service.addImage(req.user, req.params.id, req.file);
  res.status(201).json({ image });
});

export const updateImage = asyncHandler(async (req, res) => {
  const image = await service.updateImage(req.user, req.params.id, req.params.imageId, req.body);
  res.json({ image });
});

export const deleteImage = asyncHandler(async (req, res) => {
  await service.deleteImage(req.user, req.params.id, req.params.imageId);
  res.status(204).end();
});
