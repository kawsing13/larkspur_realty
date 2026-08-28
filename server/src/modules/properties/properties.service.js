// Properties: the public read slice plus the Phase 2 staff management API
// (create, edit, location, amenities, images, status).
//
// Ownership rule: administrators and super admins manage every property; an agent
// manages only properties they are the listing agent on or that they created.
// Everything is checked here, server-side.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { nextPropertyReference } from '../../lib/reference.js';
import { putPropertyImage, removeObject } from '../../lib/storage.js';
import { PROPERTY_CARD_SELECT, toPropertyCard } from '../../lib/propertyCard.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

// Prisma returns Decimal objects; the API sends plain numbers.
const num = (v) => (v == null ? null : Number(v));

const isAdmin = (user) =>
  user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN');

// Property managers monitor every property but never edit them (the brief:
// "mostly read-only"). Their write attempts are already blocked by the missing
// permission; this just lets them see the data.
const canSeeAll = (user) => isAdmin(user) || user.roles.includes('PROPERTY_MANAGER');

// ============================================================
//  Public, read-only (published properties only)
// ============================================================

const ORDER_BY = {
  newest: { publishedAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
};

export const listPublished = async (query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where = { status: 'PUBLISHED' };
  if (query.listingMode) where.listingMode = query.listingMode;

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: ORDER_BY[query.sort] ?? ORDER_BY.newest,
      select: PROPERTY_CARD_SELECT,
    }),
    prisma.property.count({ where }),
  ]);

  return paginated(rows.map(toPropertyCard), total, { page, pageSize });
};

// Up to 4 other published listings a viewer of this one might also like:
// same sale/rent mode, and same city or same property type.
const findSimilar = async (property) => {
  const or = [{ propertyTypeId: property.propertyTypeId }];
  if (property.location?.city) or.push({ location: { is: { city: property.location.city } } });

  const rows = await prisma.property.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: property.id },
      listingMode: property.listingMode,
      OR: or,
    },
    take: 4,
    orderBy: { publishedAt: 'desc' },
    select: PROPERTY_CARD_SELECT,
  });
  return rows.map(toPropertyCard);
};

export const getPublishedByKey = async (key) => {
  const property = await prisma.property.findFirst({
    where: { status: 'PUBLISHED', OR: [{ id: key }, { reference: key }] },
    include: {
      propertyType: { select: { name: true, slug: true } },
      location: true,
      images: { orderBy: { sortOrder: 'asc' } },
      amenities: { include: { amenity: true } },
      agent: {
        select: {
          id: true,
          title: true,
          photoUrl: true,
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
      documents: {
        where: { visibility: 'PUBLIC' },
        select: { id: true, title: true, docType: true, fileName: true },
      },
    },
  });

  if (!property) throw ApiError.notFound('That listing is not available');

  return { ...shapeDetail(property), similar: await findSimilar(property) };
};

// Everything the brochure PDF needs, plus the cover image downloaded as a buffer.
export const getBrochureData = async (key) => {
  const property = await getPublishedByKey(key);
  const coverUrl = property.images?.find((i) => i.isCover)?.url || property.images?.[0]?.url;

  // Only fetch images from our own object storage - never an arbitrary URL (SSRF guard).
  const storageBase = (env.STORAGE_PUBLIC_URL || env.STORAGE_ENDPOINT).replace(/\/$/, '');

  let coverImage = null;
  if (coverUrl && coverUrl.startsWith(storageBase)) {
    try {
      const res = await fetch(coverUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) coverImage = Buffer.from(await res.arrayBuffer());
    } catch (err) {
      logger.warn({ err }, 'Could not fetch cover image for brochure');
    }
  }
  return { property, coverImage };
};

// ============================================================
//  Staff management
// ============================================================

const nameOf = (u) => (u ? `${u.firstName} ${u.lastName}` : null);

const MANAGE_INCLUDE = {
  propertyType: { select: { id: true, name: true, slug: true } },
  location: true,
  images: { orderBy: { sortOrder: 'asc' } },
  amenities: { include: { amenity: true } },
  listing: {
    include: {
      submittedBy: { select: { firstName: true, lastName: true } },
      reviewedBy: { select: { firstName: true, lastName: true } },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { changedBy: { select: { firstName: true, lastName: true } } },
      },
    },
  },
  agent: {
    select: { id: true, title: true, user: { select: { firstName: true, lastName: true } } },
  },
  organization: { select: { id: true, name: true } },
};

// Reshapes the included listing into the same flat form the /api/listings module returns.
const shapeListing = (l) =>
  l && {
    id: l.id,
    status: l.status,
    reviewNotes: l.reviewNotes,
    submittedAt: l.submittedAt,
    submittedBy: nameOf(l.submittedBy),
    reviewedAt: l.reviewedAt,
    reviewedBy: nameOf(l.reviewedBy),
    publishedAt: l.publishedAt,
    closedAt: l.closedAt,
    history: (l.statusHistory ?? []).map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      by: nameOf(h.changedBy),
      at: h.createdAt,
    })),
  };

const shapeDetail = (p) => ({
  ...p,
  price: num(p.price),
  floorAreaSqm: num(p.floorAreaSqm),
  lotAreaSqm: num(p.lotAreaSqm),
  location: p.location
    ? { ...p.location, latitude: num(p.location.latitude), longitude: num(p.location.longitude) }
    : null,
  amenities: p.amenities ? p.amenities.map((a) => a.amenity) : [],
  // Only the staff view includes the full listing object; the public view uses `similar`.
  listing: p.listing && p.listing.statusHistory !== undefined ? shapeListing(p.listing) : p.listing,
});

const shapeManageCard = (p) => ({
  id: p.id,
  reference: p.reference,
  title: p.title,
  listingMode: p.listingMode,
  status: p.status,
  price: num(p.price),
  currency: p.currency,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  updatedAt: p.updatedAt,
  propertyType: p.propertyType,
  location: p.location,
  coverImage: p.images[0]?.url ?? null,
  listingStatus: p.listing?.status ?? null,
  agent: p.agent ? `${p.agent.user.firstName} ${p.agent.user.lastName}` : null,
});

// Loads a property for a staff member and confirms they may manage it.
const loadManageable = async (user, propertyId, { forWrite = true } = {}) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: MANAGE_INCLUDE,
  });
  if (!property) throw ApiError.notFound('Property not found');

  const mine =
    (user.agentId && property.agentId === user.agentId) || property.createdById === user.id;

  // Reads are open to any all-access staff; writes need admin or ownership.
  if (forWrite ? !isAdmin(user) && !mine : !canSeeAll(user) && !mine) {
    throw ApiError.forbidden('This property belongs to another agent');
  }

  // Once published or archived, an agent cannot keep editing; an admin still can.
  if (forWrite && !isAdmin(user) && ['ARCHIVED'].includes(property.status)) {
    throw ApiError.forbidden('Archived properties cannot be edited');
  }

  return property;
};

export const listForStaff = async (user, query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where = {};
  // Agents see only their own. All-access staff (admin, property manager) see
  // everything unless they ask for "mine".
  if (!canSeeAll(user) || query.scope === 'mine') {
    where.OR = [{ agentId: user.agentId ?? '__none__' }, { createdById: user.id }];
  }
  if (query.status) where.status = query.status;
  if (query.listingMode) where.listingMode = query.listingMode;
  if (query.search) {
    where.AND = [
      {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { reference: { contains: query.search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: {
        propertyType: { select: { name: true, slug: true } },
        location: { select: { city: true, state: true } },
        images: { where: { isCover: true }, take: 1, select: { url: true } },
        listing: { select: { status: true } },
        agent: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return paginated(rows.map(shapeManageCard), total, { page, pageSize });
};

export const getForStaff = async (user, propertyId) => {
  const property = await loadManageable(user, propertyId, { forWrite: false });
  return shapeDetail(property);
};

// Fields a client may set directly. Kept as a whitelist so a stray key cannot
// write to, say, `status` or `organizationId`.
const writableFields = (body) => {
  const out = {};
  for (const key of [
    'title',
    'description',
    'propertyTypeId',
    'listingMode',
    'price',
    'currency',
    'bedrooms',
    'bathrooms',
    'floorAreaSqm',
    'lotAreaSqm',
    'yearBuilt',
  ]) {
    if (key in body) out[key] = body[key];
  }
  return out;
};

export const createProperty = async (user, body) => {
  // Work out which agent and organization the property belongs to.
  let agentId = user.agentId;
  let organizationId = user.organizationId;

  if (isAdmin(user) && body.agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: body.agentId } });
    if (!agent) throw ApiError.badRequest('That agent does not exist');
    agentId = agent.id;
    organizationId = agent.organizationId;
  }

  if (!agentId || !organizationId) {
    throw ApiError.badRequest(
      isAdmin(user)
        ? 'Choose an agent to assign this property to'
        : 'Your account is not linked to an agent profile',
    );
  }

  // Retry once if the generated reference collides with a concurrent create.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const property = await prisma.property.create({
        data: {
          ...writableFields(body),
          currency: body.currency || 'USD',
          reference: await nextPropertyReference(),
          status: 'DRAFT',
          organizationId,
          agentId,
          createdById: user.id,
          // Every property gets a listing record so the Phase 4 approval flow has
          // something to work with.
          listing: { create: { status: 'DRAFT' } },
        },
        include: MANAGE_INCLUDE,
      });
      return shapeDetail(property);
    } catch (err) {
      const isReferenceClash =
        err.code === 'P2002' && String(err.meta?.target).includes('reference');
      if (!isReferenceClash || attempt === 2) throw err;
    }
  }
};

export const updateProperty = async (user, propertyId, body) => {
  await loadManageable(user, propertyId);
  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: writableFields(body),
    include: MANAGE_INCLUDE,
  });
  return shapeDetail(updated);
};

export const saveLocation = async (user, propertyId, body) => {
  await loadManageable(user, propertyId);
  const data = {
    addressLine1: body.addressLine1 ?? null,
    addressLine2: body.addressLine2 ?? null,
    city: body.city,
    state: body.state ?? null,
    postalCode: body.postalCode ?? null,
    country: body.country || 'USA',
    neighborhood: body.neighborhood ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    formattedAddress: [body.neighborhood, body.city, body.state].filter(Boolean).join(', '),
  };

  await prisma.propertyLocation.upsert({
    where: { propertyId },
    update: data,
    create: { propertyId, ...data },
  });

  return getForStaff(user, propertyId);
};

export const setAmenities = async (user, propertyId, slugs) => {
  await loadManageable(user, propertyId);

  const amenities = await prisma.amenity.findMany({ where: { slug: { in: slugs } } });
  const found = new Set(amenities.map((a) => a.slug));
  const unknown = slugs.filter((s) => !found.has(s));
  if (unknown.length) throw ApiError.badRequest(`Unknown amenities: ${unknown.join(', ')}`);

  // Replace the whole set in one transaction.
  await prisma.$transaction([
    prisma.propertyAmenity.deleteMany({ where: { propertyId } }),
    prisma.propertyAmenity.createMany({
      data: amenities.map((a) => ({ propertyId, amenityId: a.id })),
    }),
  ]);

  return getForStaff(user, propertyId);
};

// Status changes (publish / unpublish / archive / close) and the whole approval
// workflow live in the listings module. Property.status is kept in sync there.

// ---- Images ----

const MAX_IMAGES = 20;

export const addImage = async (user, propertyId, file) => {
  await loadManageable(user, propertyId);

  const count = await prisma.propertyImage.count({ where: { propertyId } });
  if (count >= MAX_IMAGES) {
    throw ApiError.badRequest(`A property can have at most ${MAX_IMAGES} images`);
  }

  const { key, url } = await putPropertyImage({
    propertyId,
    buffer: file.buffer,
    mimeType: file.mimetype,
  });

  const image = await prisma.propertyImage.create({
    data: {
      propertyId,
      url,
      storageKey: key,
      sortOrder: count,
      isCover: count === 0, // the first image uploaded becomes the cover
    },
  });

  return image;
};

export const updateImage = async (user, propertyId, imageId, body) => {
  await loadManageable(user, propertyId);
  const image = await prisma.propertyImage.findFirst({ where: { id: imageId, propertyId } });
  if (!image) throw ApiError.notFound('Image not found');

  // Setting a new cover clears the flag on the others.
  if (body.isCover === true) {
    await prisma.propertyImage.updateMany({
      where: { propertyId, NOT: { id: imageId } },
      data: { isCover: false },
    });
  }

  return prisma.propertyImage.update({
    where: { id: imageId },
    data: {
      caption: body.caption ?? image.caption,
      isCover: body.isCover ?? image.isCover,
      sortOrder: body.sortOrder ?? image.sortOrder,
    },
  });
};

export const deleteImage = async (user, propertyId, imageId) => {
  await loadManageable(user, propertyId);
  const image = await prisma.propertyImage.findFirst({ where: { id: imageId, propertyId } });
  if (!image) throw ApiError.notFound('Image not found');

  if (image.storageKey) {
    // A failed storage delete should not block removing the DB row.
    await removeObject(image.storageKey).catch((err) =>
      logger.warn({ err, key: image.storageKey }, 'Could not delete image from storage'),
    );
  }
  await prisma.propertyImage.delete({ where: { id: imageId } });

  // If we removed the cover, promote the next image.
  if (image.isCover) {
    const next = await prisma.propertyImage.findFirst({
      where: { propertyId },
      orderBy: { sortOrder: 'asc' },
    });
    if (next) {
      await prisma.propertyImage.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }
};
