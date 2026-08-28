import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { uploadDocument } from '../../middleware/upload.js';
import * as v from './documents.validation.js';
import * as controller from './documents.controller.js';

export const documentsRouter = Router();

// Downloads are access-checked in the service: public documents need no token,
// private ones do.
documentsRouter.get(
  '/:id/download',
  optionalAuth,
  validate(v.documentIdSchema),
  controller.download,
);

// Management (staff).
documentsRouter.get(
  '/',
  authenticate,
  authorize('property:read'),
  validate(v.listDocumentsSchema),
  controller.list,
);
documentsRouter.post(
  '/',
  authenticate,
  authorize('property:update'),
  uploadDocument, // parses the multipart form first
  validate(v.uploadDocumentSchema),
  controller.upload,
);
documentsRouter.patch(
  '/:id',
  authenticate,
  authorize('property:update'),
  validate(v.patchDocumentSchema),
  controller.patch,
);
documentsRouter.delete(
  '/:id',
  authenticate,
  authorize('property:update'),
  validate(v.documentIdSchema),
  controller.remove,
);
