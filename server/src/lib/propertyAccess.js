// Shared "can this staff member act on this property?" check, used by the
// documents module (and available to others).

import { prisma } from '../config/prisma.js';
import { ApiError } from './ApiError.js';

const isAdmin = (user) =>
  user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN');
const canSeeAll = (user) => isAdmin(user) || user.roles.includes('PROPERTY_MANAGER');

export const ownsProperty = (user, property) =>
  (user.agentId && property.agentId === user.agentId) || property.createdById === user.id;

// Reads (forWrite:false) are open to any all-access staff or the owner; writes
// need an admin or the owner.
export const loadPropertyForAccess = async (user, propertyId, { forWrite = false } = {}) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      reference: true,
      title: true,
      agentId: true,
      createdById: true,
      organizationId: true,
    },
  });
  if (!property) throw ApiError.notFound('Property not found');

  const owner = ownsProperty(user, property);
  const allowed = forWrite ? isAdmin(user) || owner : canSeeAll(user) || owner;
  if (!allowed) throw ApiError.forbidden('This property belongs to another agent');

  return property;
};
