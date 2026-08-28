// Public property search: keyword, location, type, price, beds/baths, area, and
// amenities, with sorting and pagination. Published listings only.
//
// The structured filters (price, beds, type, mode, city) ride on the btree
// indexes declared in schema.prisma. Keyword matching uses ILIKE; if the catalog
// ever grows to tens of thousands of listings, add a pg_trgm GIN index on
// Property.title and Property.description.

import { prisma } from '../../config/prisma.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { PROPERTY_CARD_SELECT, toPropertyCard } from '../../lib/propertyCard.js';

const SORTS = {
  newest: { publishedAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  beds_desc: { bedrooms: 'desc' },
  area_desc: { floorAreaSqm: 'desc' },
};

// Turns a set of filters into a Prisma `where`. Exported so saved-search matching
// can reuse exactly the same logic as the live search.
export const buildSearchWhere = (p) => {
  const and = [{ status: 'PUBLISHED' }];

  if (p.q) {
    const contains = { contains: p.q, mode: 'insensitive' };
    and.push({
      OR: [
        { title: contains },
        { description: contains },
        { reference: contains },
        { location: { is: { city: contains } } },
        { location: { is: { neighborhood: contains } } },
      ],
    });
  }

  if (p.listingMode) and.push({ listingMode: p.listingMode });
  if (p.propertyType) and.push({ propertyType: { is: { slug: p.propertyType } } });
  if (p.city) and.push({ location: { is: { city: { equals: p.city, mode: 'insensitive' } } } });

  if (p.minPrice != null || p.maxPrice != null) {
    and.push({
      price: {
        ...(p.minPrice != null ? { gte: p.minPrice } : {}),
        ...(p.maxPrice != null ? { lte: p.maxPrice } : {}),
      },
    });
  }
  if (p.minBeds != null) and.push({ bedrooms: { gte: p.minBeds } });
  if (p.minBaths != null) and.push({ bathrooms: { gte: p.minBaths } });
  if (p.minFloorAreaSqm != null) and.push({ floorAreaSqm: { gte: p.minFloorAreaSqm } });
  if (p.maxFloorAreaSqm != null) and.push({ floorAreaSqm: { lte: p.maxFloorAreaSqm } });

  // Must have every requested amenity.
  for (const slug of p.amenities ?? []) {
    and.push({ amenities: { some: { amenity: { is: { slug } } } } });
  }

  return { AND: and };
};

export const search = async (params) => {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where = buildSearchWhere(params);

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: SORTS[params.sort] ?? SORTS.newest,
      select: PROPERTY_CARD_SELECT,
    }),
    prisma.property.count({ where }),
  ]);

  return paginated(rows.map(toPropertyCard), total, { page, pageSize });
};

// Values the search UI needs to build its controls: the cities that have
// listings, and the overall price range per listing mode.
export const facets = async () => {
  const [locations, saleAgg, rentAgg] = await Promise.all([
    prisma.propertyLocation.findMany({
      where: { property: { is: { status: 'PUBLISHED' } } },
      select: { city: true, state: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    }),
    prisma.property.aggregate({
      where: { status: 'PUBLISHED', listingMode: 'SALE' },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.property.aggregate({
      where: { status: 'PUBLISHED', listingMode: 'RENT' },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const bounds = (agg) => ({
    min: agg._min.price == null ? null : Number(agg._min.price),
    max: agg._max.price == null ? null : Number(agg._max.price),
  });

  return {
    cities: locations.filter((l) => l.city).map((l) => ({ city: l.city, state: l.state })),
    priceRange: { SALE: bounds(saleAgg), RENT: bounds(rentAgg) },
  };
};
