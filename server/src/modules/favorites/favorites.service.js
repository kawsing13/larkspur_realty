// Saved properties for a signed-in customer. Staff accounts have no customer
// record, so favorites are simply not available to them.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { PROPERTY_CARD_SELECT, toPropertyCard } from '../../lib/propertyCard.js';

const customerIdOf = (user) => {
  if (!user.customerId) throw ApiError.forbidden('Favorites are available on buyer accounts');
  return user.customerId;
};

export const listFavorites = async (user) => {
  const customerId = customerIdOf(user);
  const rows = await prisma.favorite.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: { property: { select: PROPERTY_CARD_SELECT } },
  });

  // Hide any that have since been unpublished or archived.
  return rows
    .filter((f) => f.property.status === 'PUBLISHED')
    .map((f) => ({ ...toPropertyCard(f.property), favoritedAt: f.createdAt }));
};

// Just the ids, for the search page to fill in the hearts without loading cards.
export const listFavoriteIds = async (user) => {
  const customerId = customerIdOf(user);
  const rows = await prisma.favorite.findMany({
    where: { customerId },
    select: { propertyId: true },
  });
  return rows.map((r) => r.propertyId);
};

export const addFavorite = async (user, propertyId) => {
  const customerId = customerIdOf(user);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!property) throw ApiError.notFound('That listing is not available');

  // Idempotent: saving something already saved is fine.
  await prisma.favorite.upsert({
    where: { customerId_propertyId: { customerId, propertyId } },
    update: {},
    create: { customerId, propertyId },
  });
};

export const removeFavorite = async (user, propertyId) => {
  const customerId = customerIdOf(user);
  await prisma.favorite.deleteMany({ where: { customerId, propertyId } });
};
