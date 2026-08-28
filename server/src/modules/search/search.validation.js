import { z } from 'zod';

// Every filter is optional. Empty query = all published properties, newest first.
export const searchSchema = {
  query: z.object({
    q: z.string().trim().min(1).max(120).optional(),
    listingMode: z.enum(['SALE', 'RENT']).optional(),
    propertyType: z.string().trim().min(1).max(60).optional(), // slug
    city: z.string().trim().min(1).max(120).optional(),

    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    minBeds: z.coerce.number().int().min(0).max(20).optional(),
    minBaths: z.coerce.number().int().min(0).max(20).optional(),
    minFloorAreaSqm: z.coerce.number().positive().optional(),
    maxFloorAreaSqm: z.coerce.number().positive().optional(),

    // comma-separated amenity slugs; a match must have ALL of them
    amenities: z
      .string()
      .trim()
      .optional()
      .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])),

    sort: z.enum(['newest', 'price_asc', 'price_desc', 'beds_desc', 'area_desc']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(50).optional(),
  }),
};
