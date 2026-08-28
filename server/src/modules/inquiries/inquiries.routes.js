import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { inquiryLimiter } from '../../middleware/rateLimit.js';
import * as v from './inquiries.validation.js';
import * as controller from './inquiries.controller.js';

export const inquiriesRouter = Router();

// Public: submit an inquiry from a listing page. optionalAuth links it to a
// signed-in customer so it shows in their history; the limiter slows down spam.
inquiriesRouter.post(
  '/',
  inquiryLimiter,
  optionalAuth,
  validate(v.createInquirySchema),
  controller.create,
);

// A customer's own inquiries.
inquiriesRouter.get('/mine', authenticate, controller.listMine);

// Staff lead management.
inquiriesRouter.get(
  '/',
  authenticate,
  authorize('inquiry:read'),
  validate(v.listInquiriesSchema),
  controller.list,
);
inquiriesRouter.get(
  '/:id',
  authenticate,
  authorize('inquiry:read'),
  validate(v.inquiryIdSchema),
  controller.getOne,
);
inquiriesRouter.patch(
  '/:id',
  authenticate,
  authorize('inquiry:update'),
  validate(v.updateInquirySchema),
  controller.update,
);
inquiriesRouter.post(
  '/:id/notes',
  authenticate,
  authorize('inquiry:update'),
  validate(v.addNoteSchema),
  controller.addNote,
);
inquiriesRouter.post(
  '/:id/assign',
  authenticate,
  authorize('inquiry:assign'),
  validate(v.assignInquirySchema),
  controller.assign,
);
