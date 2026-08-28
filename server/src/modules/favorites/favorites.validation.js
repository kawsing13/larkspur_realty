import { z } from 'zod';

export const addFavoriteSchema = {
  body: z.object({ propertyId: z.string().trim().min(1).max(60) }),
};

export const propertyIdParamSchema = {
  params: z.object({ propertyId: z.string().trim().min(1).max(60) }),
};
