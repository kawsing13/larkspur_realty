import { z } from 'zod';

const id = z.string().trim().min(1).max(60);

// Public: someone asking about a property from the listing page.
export const createInquirySchema = {
  body: z.object({
    propertyId: id,
    name: z.string().trim().min(2, 'Enter your name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().min(10, 'Add a short message').max(2000),
  }),
};

const STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING_SCHEDULED',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export const listInquiriesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(STATUSES).optional(),
    agentId: id.optional(),
    propertyId: id.optional(),
    search: z.string().trim().min(1).optional(),
    followUpDue: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    scope: z.enum(['mine', 'all']).optional(),
  }),
};

export const inquiryIdSchema = { params: z.object({ id }) };

export const updateInquirySchema = {
  params: z.object({ id }),
  body: z
    .object({
      status: z.enum(STATUSES).optional(),
      // null clears the follow-up date; a string sets it.
      followUpDate: z.string().datetime().nullable().optional(),
    })
    .refine((b) => b.status !== undefined || b.followUpDate !== undefined, {
      message: 'Nothing to update',
    }),
};

export const addNoteSchema = {
  params: z.object({ id }),
  body: z.object({ body: z.string().trim().min(1, 'Write a note').max(2000) }),
};

export const assignInquirySchema = {
  params: z.object({ id }),
  body: z.object({
    agentId: id,
    reason: z.string().trim().max(300).optional(),
  }),
};
