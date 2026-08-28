import { z } from 'zod';

// ---- Shared pieces ----
const id = z.string().trim().min(1).max(60);
const optionalText = (max) => z.string().trim().max(max).optional();

const PROPERTY_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
  'SOLD',
  'RENTED',
];

// ---- Public read ----
export const listPublicSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(50).optional(),
    listingMode: z.enum(['SALE', 'RENT']).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
  }),
};

export const propertyKeySchema = {
  params: z.object({ key: z.string().trim().min(1).max(60) }),
};

// ---- Staff: manage ----
export const listManageSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(PROPERTY_STATUSES).optional(),
    listingMode: z.enum(['SALE', 'RENT']).optional(),
    search: z.string().trim().min(1).optional(),
    // "mine" restricts to the caller's own; admins may also pass "all" (the default for them).
    scope: z.enum(['mine', 'all']).optional(),
  }),
};

export const idParamSchema = {
  params: z.object({ id }),
};

// The editable fields of a property. Every field is optional on update; `create`
// enforces the required ones with .refine below via createSchema.
const propertyFields = z.object({
  title: z.string().trim().min(4, 'Give the listing a title').max(160),
  description: z.string().trim().min(20, 'Add a description of at least 20 characters').max(8000),
  propertyTypeId: id,
  listingMode: z.enum(['SALE', 'RENT']),
  price: z.coerce.number().positive('Price must be greater than 0').max(1_000_000_000),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).nullable().optional(),
  floorAreaSqm: z.coerce.number().positive().max(1_000_000).nullable().optional(),
  lotAreaSqm: z.coerce.number().positive().max(10_000_000).nullable().optional(),
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1700)
    .max(new Date().getFullYear() + 2)
    .nullable()
    .optional(),
});

export const createPropertySchema = {
  body: propertyFields.extend({
    // Admins can create on behalf of an agent; agents create for themselves.
    agentId: id.optional(),
  }),
};

export const updatePropertySchema = {
  params: z.object({ id }),
  body: propertyFields.partial(),
};

export const locationSchema = {
  params: z.object({ id }),
  body: z.object({
    addressLine1: optionalText(200),
    addressLine2: optionalText(200),
    city: z.string().trim().min(1, 'City is required').max(120),
    state: optionalText(120),
    postalCode: optionalText(20),
    country: z.string().trim().max(80).optional(),
    neighborhood: optionalText(120),
    latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
    longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  }),
};

export const amenitiesSchema = {
  params: z.object({ id }),
  body: z.object({
    // A list of amenity slugs. Replaces the property's whole amenity set.
    slugs: z.array(z.string().trim().min(1).max(80)).max(60),
  }),
};

export const imageParamSchema = {
  params: z.object({ id, imageId: id }),
};

export const updateImageSchema = {
  params: z.object({ id, imageId: id }),
  body: z.object({
    caption: optionalText(200),
    isCover: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(500).optional(),
  }),
};

