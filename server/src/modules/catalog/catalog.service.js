// Reference data used by the property forms: property types and amenities.
// Reads are public (the search page and forms need them); creating new entries
// is an admin action.

import { prisma } from '../../config/prisma.js';

// "Updated kitchen" -> "updated-kitchen"
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const listPropertyTypes = () =>
  prisma.propertyType.findMany({ orderBy: { name: 'asc' } });

export const createPropertyType = (name) =>
  prisma.propertyType.create({ data: { name, slug: slugify(name) } });

export const listAmenities = () => prisma.amenity.findMany({ orderBy: { name: 'asc' } });

export const createAmenity = (name, category) =>
  prisma.amenity.create({ data: { name, slug: slugify(name), category: category || null } });
