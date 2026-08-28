// Saved searches for customers. Each one stores a set of /search filters. When a
// new listing is published that matches, the customer gets a notification.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { buildSearchWhere } from '../search/search.service.js';
import { notify } from '../../lib/notifications.js';

const CRITERIA_KEYS = [
  'q',
  'listingMode',
  'propertyType',
  'city',
  'minPrice',
  'maxPrice',
  'minBeds',
  'minBaths',
  'amenities',
  'sort',
];

// Keep only the keys the search understands, dropping blanks.
const cleanCriteria = (raw = {}) => {
  const out = {};
  for (const key of CRITERIA_KEYS) {
    const value = raw[key];
    if (value !== undefined && value !== '' && value !== null) out[key] = value;
  }
  return out;
};

// Criteria are stored as strings; the search where-builder wants typed values.
const typed = (c) => ({
  ...c,
  minPrice: c.minPrice != null ? Number(c.minPrice) : undefined,
  maxPrice: c.maxPrice != null ? Number(c.maxPrice) : undefined,
  minBeds: c.minBeds != null ? Number(c.minBeds) : undefined,
  minBaths: c.minBaths != null ? Number(c.minBaths) : undefined,
  amenities:
    typeof c.amenities === 'string' && c.amenities ? c.amenities.split(',').filter(Boolean) : [],
});

const countMatches = (criteria) =>
  prisma.property.count({ where: buildSearchWhere(typed(criteria)) });

const shape = (s, currentMatches) => ({
  id: s.id,
  name: s.name,
  criteria: s.criteria,
  notifyByEmail: s.notifyByEmail,
  currentMatches,
  newSinceSaved: Math.max(0, currentMatches - s.lastMatchCount),
  createdAt: s.createdAt,
});

const requireCustomer = (user) => {
  if (!user.customerId) throw ApiError.forbidden('Saved searches are for buyer accounts');
  return user.customerId;
};

export const createSavedSearch = async (user, { name, criteria }) => {
  const customerId = requireCustomer(user);
  const clean = cleanCriteria(criteria);
  const count = await countMatches(clean);

  const saved = await prisma.savedSearch.create({
    data: {
      customerId,
      name,
      criteria: clean,
      lastMatchCount: count,
      lastRunAt: new Date(),
    },
  });
  return shape(saved, count);
};

export const listSavedSearches = async (user) => {
  const customerId = requireCustomer(user);
  const rows = await prisma.savedSearch.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(rows.map(async (s) => shape(s, await countMatches(s.criteria))));
};

const loadOwn = async (user, id) => {
  const customerId = requireCustomer(user);
  const saved = await prisma.savedSearch.findFirst({ where: { id, customerId } });
  if (!saved) throw ApiError.notFound('Saved search not found');
  return saved;
};

export const updateSavedSearch = async (user, id, body) => {
  const saved = await loadOwn(user, id);
  const updated = await prisma.savedSearch.update({
    where: { id: saved.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.notifyByEmail !== undefined ? { notifyByEmail: body.notifyByEmail } : {}),
    },
  });
  return shape(updated, await countMatches(updated.criteria));
};

export const deleteSavedSearch = async (user, id) => {
  const saved = await loadOwn(user, id);
  await prisma.savedSearch.delete({ where: { id: saved.id } });
};

// Called after a property is published. Notifies every saved search that the new
// listing now matches.
export const notifyForNewListing = async (propertyId) => {
  const searches = await prisma.savedSearch.findMany({
    where: { notifyByEmail: true },
    include: { customer: { select: { userId: true } } },
  });

  for (const s of searches) {
    const matches = await prisma.property.count({
      where: { AND: [buildSearchWhere(typed(s.criteria)), { id: propertyId }] },
    });
    if (matches === 1) {
      await notify({
        userId: s.customer.userId,
        type: 'SAVED_SEARCH_MATCH',
        title: 'A new listing matches your saved search',
        body: `A new listing matches "${s.name}"`,
        data: { savedSearchId: s.id, propertyId },
      });
      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastMatchCount: { increment: 1 }, lastRunAt: new Date() },
      });
    }
  }
};
