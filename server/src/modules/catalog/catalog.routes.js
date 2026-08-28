import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createTypeSchema, createAmenitySchema } from './catalog.validation.js';
import * as controller from './catalog.controller.js';

// Mounted as two small routers so the URLs stay flat: /api/property-types, /api/amenities

export const propertyTypesRouter = Router();
propertyTypesRouter.get('/', controller.listTypes);
propertyTypesRouter.post(
  '/',
  authenticate,
  authorize.role('ADMINISTRATOR', 'SUPER_ADMIN'),
  validate(createTypeSchema),
  controller.createType,
);

export const amenitiesRouter = Router();
amenitiesRouter.get('/', controller.listAmenities);
amenitiesRouter.post(
  '/',
  authenticate,
  authorize.role('ADMINISTRATOR', 'SUPER_ADMIN'),
  validate(createAmenitySchema),
  controller.createAmenity,
);
