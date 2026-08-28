// The compact "card" shape for a property, used by the public list, search results,
// favorites, and "similar listings". One definition so they all look the same.

const num = (v) => (v == null ? null : Number(v));

export const PROPERTY_CARD_SELECT = {
  id: true,
  reference: true,
  title: true,
  listingMode: true,
  status: true,
  price: true,
  currency: true,
  bedrooms: true,
  bathrooms: true,
  floorAreaSqm: true,
  lotAreaSqm: true,
  publishedAt: true,
  propertyType: { select: { name: true, slug: true } },
  location: { select: { city: true, state: true, neighborhood: true } },
  images: { where: { isCover: true }, take: 1, select: { url: true } },
};

export const toPropertyCard = (p) => ({
  id: p.id,
  reference: p.reference,
  title: p.title,
  listingMode: p.listingMode,
  status: p.status,
  price: num(p.price),
  currency: p.currency,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  floorAreaSqm: num(p.floorAreaSqm),
  lotAreaSqm: num(p.lotAreaSqm),
  publishedAt: p.publishedAt,
  propertyType: p.propertyType,
  location: p.location,
  coverImage: p.images?.[0]?.url ?? null,
});
