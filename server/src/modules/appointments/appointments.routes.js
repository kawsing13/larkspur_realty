import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { inquiryLimiter } from '../../middleware/rateLimit.js';
import * as v from './appointments.validation.js';
import * as controller from './appointments.controller.js';

export const appointmentsRouter = Router();

// Public: request a viewing from a listing page. optionalAuth links it to a
// signed-in customer; a staff member with an inquiryId gets a confirmed slot.
appointmentsRouter.post(
  '/',
  inquiryLimiter,
  optionalAuth,
  validate(v.createAppointmentSchema),
  controller.create,
);

// A customer's own viewing requests.
appointmentsRouter.get('/mine', authenticate, controller.listMine);

// Staff schedule.
appointmentsRouter.get(
  '/',
  authenticate,
  authorize('appointment:read'),
  validate(v.listAppointmentsSchema),
  controller.list,
);
appointmentsRouter.get(
  '/:id',
  authenticate,
  validate(v.appointmentIdSchema),
  controller.getOne,
);

// Workflow: confirm | reschedule | cancel | complete | no-show.
// The service decides who may run which action (staff vs the owning customer).
appointmentsRouter.post(
  '/:id/:action',
  authenticate,
  validate(v.transitionSchema),
  controller.transition,
);
