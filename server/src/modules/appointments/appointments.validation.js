import { z } from 'zod';

const id = z.string().trim().min(1).max(60);
const when = z.string().datetime();

export const createAppointmentSchema = {
  body: z.object({
    propertyId: id,
    inquiryId: id.optional(), // set when a staff member schedules for a lead
    requestedStart: when,
    requestedEnd: when.optional(),
    contactName: z.string().trim().min(2, 'Enter a name').max(120),
    contactEmail: z.string().trim().toLowerCase().email('Enter a valid email'),
    contactPhone: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
};

const STATUSES = ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

export const listAppointmentsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(200).optional(),
    status: z.enum(STATUSES).optional(),
    propertyId: id.optional(),
    agentId: id.optional(),
    from: when.optional(),
    to: when.optional(),
    upcoming: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    scope: z.enum(['mine', 'all']).optional(),
  }),
};

export const appointmentIdSchema = { params: z.object({ id }) };

export const transitionSchema = {
  params: z.object({
    id,
    action: z.enum(['confirm', 'reschedule', 'cancel', 'complete', 'no-show']),
  }),
  body: z.object({
    start: when.optional(), // required for confirm / reschedule
    end: when.optional(),
    note: z.string().trim().max(500).optional(),
  }),
};
