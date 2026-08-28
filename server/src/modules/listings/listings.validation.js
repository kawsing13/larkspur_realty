import { z } from 'zod';

const id = z.string().trim().min(1).max(60);

export const listListingsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    status: z
      .enum([
        'DRAFT',
        'PENDING_REVIEW',
        'CHANGES_REQUESTED',
        'PUBLISHED',
        'UNPUBLISHED',
        'ARCHIVED',
        'CLOSED_SOLD',
        'CLOSED_RENTED',
      ])
      .optional(),
    scope: z.enum(['mine', 'all']).optional(),
  }),
};

export const listingIdSchema = {
  params: z.object({ id }),
};

// One route drives the whole workflow: POST /api/listings/:id/:action
export const transitionSchema = {
  params: z.object({
    id,
    action: z.enum([
      'submit',
      'withdraw',
      'approve',
      'request-changes',
      'unpublish',
      'republish',
      'archive',
      'restore',
      'close',
    ]),
  }),
  body: z.object({
    note: z.string().trim().max(1000).optional(),
    outcome: z.enum(['SOLD', 'RENTED']).optional(), // for "close"
  }),
};
