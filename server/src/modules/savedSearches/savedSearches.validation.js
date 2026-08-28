import { z } from 'zod';

const id = z.string().trim().min(1).max(60);

// Criteria mirror the /search query params. They come from the client as strings.
const criteria = z.record(z.string(), z.string()).default({});

export const createSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name your search').max(80),
    criteria,
  }),
};

export const updateSchema = {
  params: z.object({ id }),
  body: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      notifyByEmail: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' }),
};

export const idSchema = { params: z.object({ id }) };
