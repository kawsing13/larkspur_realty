import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { uploadPropertyImage } from '../../middleware/upload.js';
import * as v from './properties.validation.js';
import * as controller from './properties.controller.js';

export const propertiesRouter = Router();

// ---- Staff: manage properties (Phase 2) ----
// Declared before "/:key" so these fixed paths are not swallowed by the param route.
propertiesRouter.get(
  '/manage',
  authenticate,
  authorize('property:read'),
  validate(v.listManageSchema),
  controller.listManage,
);
propertiesRouter.get(
  '/manage/:id',
  authenticate,
  authorize('property:read'),
  validate(v.idParamSchema),
  controller.getManage,
);
propertiesRouter.post(
  '/',
  authenticate,
  authorize('property:create'),
  validate(v.createPropertySchema),
  controller.create,
);
propertiesRouter.patch(
  '/:id',
  authenticate,
  authorize('property:update'),
  validate(v.updatePropertySchema),
  controller.update,
);
propertiesRouter.put(
  '/:id/location',
  authenticate,
  authorize('property:update'),
  validate(v.locationSchema),
  controller.saveLocation,
);
propertiesRouter.put(
  '/:id/amenities',
  authenticate,
  authorize('property:update'),
  validate(v.amenitiesSchema),
  controller.saveAmenities,
);
propertiesRouter.post(
  '/:id/images',
  authenticate,
  authorize('property:update'),
  validate(v.idParamSchema),
  uploadPropertyImage,
  controller.addImage,
);
propertiesRouter.patch(
  '/:id/images/:imageId',
  authenticate,
  authorize('property:update'),
  validate(v.updateImageSchema),
  controller.updateImage,
);
propertiesRouter.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('property:update'),
  validate(v.imageParamSchema),
  controller.deleteImage,
);

// Publishing, archiving, and the whole approval workflow live under /api/listings
// (Phase 4). Property.status is kept in sync there.

// ---- Public, read-only ----
propertiesRouter.get('/', validate(v.listPublicSchema), controller.listPublic);
propertiesRouter.get('/:key/brochure.pdf', validate(v.propertyKeySchema), controller.brochure);
propertiesRouter.get('/:key', validate(v.propertyKeySchema), controller.getPublic);
