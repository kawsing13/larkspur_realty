import { z } from 'zod';

const name = z.string().trim().min(2).max(80);

export const createTypeSchema = {
  body: z.object({ name }),
};

export const createAmenitySchema = {
  body: z.object({
    name,
    category: z.string().trim().max(40).optional(),
  }),
};
