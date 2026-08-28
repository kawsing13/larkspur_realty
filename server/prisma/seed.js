// Seed script: loads the data the app needs to run, plus a realistic demo dataset.
// Safe to run more than once - it upserts by natural keys and clears demo
// properties before re-creating them.
//
//   npm run db:seed
//
// Demo logins are printed at the end.

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';
import { seedRbac } from './rbac.js';

// This creates demo accounts with a known password. Never run it against production.
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed a production database. Pass --force only if you are sure.');
  process.exit(1);
}

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Passw0rd!';

// ---- Reference data -------------------------------------------
const PROPERTY_TYPES = [
  ['House', 'house'],
  ['Condominium', 'condominium'],
  ['Apartment', 'apartment'],
  ['Townhouse', 'townhouse'],
  ['Land', 'land'],
  ['Commercial', 'commercial'],
];

const AMENITIES = [
  ['Air conditioning', 'air-conditioning', 'Interior'],
  ['In-unit laundry', 'in-unit-laundry', 'Interior'],
  ['Hardwood floors', 'hardwood-floors', 'Interior'],
  ['Updated kitchen', 'updated-kitchen', 'Interior'],
  ['Garage parking', 'garage-parking', 'Exterior'],
  ['Private garden', 'private-garden', 'Exterior'],
  ['Balcony', 'balcony', 'Exterior'],
  ['Swimming pool', 'swimming-pool', 'Community'],
  ['Fitness center', 'fitness-center', 'Community'],
  ['Elevator', 'elevator', 'Community'],
  ['Pet friendly', 'pet-friendly', 'Community'],
  ['Security system', 'security-system', 'Community'],
];

// ---- 4. Demo people --------------------------------------------
const STAFF = [
  { email: 'super@demo.realestate', firstName: 'Renata', lastName: 'Alvarez', role: 'SUPER_ADMIN' },
  { email: 'admin@demo.realestate', firstName: 'Marcus', lastName: 'Brandt', role: 'ADMINISTRATOR' },
  {
    email: 'agent.lena@demo.realestate', firstName: 'Lena', lastName: 'Fitzgerald', role: 'AGENT',
    agent: { title: 'Senior Agent', licenseNumber: 'RE-4471820', bio: 'Fifteen years across the east-side neighborhoods, focused on family homes and first purchases.' },
  },
  {
    email: 'agent.omar@demo.realestate', firstName: 'Omar', lastName: 'Haddad', role: 'AGENT',
    agent: { title: 'Agent', licenseNumber: 'RE-5590231', bio: 'Condominiums, new construction, and investment units downtown.' },
  },
  {
    email: 'manager@demo.realestate', firstName: 'Priya', lastName: 'Nair', role: 'PROPERTY_MANAGER',
  },
];

const CUSTOMER = {
  email: 'buyer@demo.realestate', firstName: 'Daniel', lastName: 'Okafor',
};

// ---- 5. Demo properties ----------------------------------------
// Prices and areas are illustrative sample data, not real market figures.
const PROPERTIES = [
  {
    reference: 'RE-2026-0101', title: 'Maple Ridge townhouse with a walk-out garden',
    type: 'townhouse', mode: 'SALE', price: 845000, bedrooms: 3, bathrooms: 2,
    floorAreaSqm: 168, lotAreaSqm: 210, yearBuilt: 2015, agent: 'agent.lena@demo.realestate',
    city: 'Bellevue', state: 'WA', neighborhood: 'Maple Ridge', lat: 47.6101, lng: -122.2015,
    amenities: ['hardwood-floors', 'updated-kitchen', 'garage-parking', 'private-garden', 'air-conditioning'],
    description:
      'A quiet interior-unit townhouse backing onto a shared green. The main floor is open from the kitchen through to a covered deck, and the lower level opens directly to a fenced garden. Walking distance to the light rail and the Sunday market.',
  },
  {
    reference: 'RE-2026-0102', title: 'Two-bedroom corner condo above the river walk',
    type: 'condominium', mode: 'SALE', price: 612000, bedrooms: 2, bathrooms: 2,
    floorAreaSqm: 104, yearBuilt: 2019, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'South Waterfront', lat: 45.4979, lng: -122.6709,
    amenities: ['air-conditioning', 'in-unit-laundry', 'balcony', 'fitness-center', 'elevator', 'security-system'],
    description:
      'Corner unit on the ninth floor with windows on two sides and a west-facing balcony over the river path. The building has a ground-floor gym and a staffed lobby. One deeded parking space in the garage.',
  },
  {
    reference: 'RE-2026-0103', title: 'Craftsman four-bedroom near Alberta Park',
    type: 'house', mode: 'SALE', price: 989000, bedrooms: 4, bathrooms: 3,
    floorAreaSqm: 232, lotAreaSqm: 465, yearBuilt: 1924, agent: 'agent.lena@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Concordia', lat: 45.5599, lng: -122.6363,
    amenities: ['hardwood-floors', 'updated-kitchen', 'private-garden', 'security-system'],
    description:
      'A restored 1924 craftsman that keeps its built-ins, box beams, and front porch while adding a rebuilt kitchen and a finished basement suite. Detached studio at the back of the lot. Two blocks from the park.',
  },
  {
    reference: 'RE-2026-0104', title: 'Sunlit one-bedroom rental in the Pearl',
    type: 'apartment', mode: 'RENT', price: 2350, bedrooms: 1, bathrooms: 1,
    floorAreaSqm: 68, yearBuilt: 2008, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Pearl District', lat: 45.5289, lng: -122.6829,
    amenities: ['air-conditioning', 'in-unit-laundry', 'hardwood-floors', 'elevator', 'pet-friendly'],
    description:
      'Loft-style one-bedroom with twelve-foot ceilings, big industrial windows, and a proper bedroom rather than a nook. In-unit washer and dryer. Cats and dogs welcome with a deposit. Available from the first of next month.',
  },
  {
    reference: 'RE-2026-0105', title: 'Hillside building lot with a completed boundary survey',
    type: 'land', mode: 'SALE', price: 315000, floorAreaSqm: null, lotAreaSqm: 1620,
    agent: 'agent.lena@demo.realestate',
    city: 'Hood River', state: 'OR', neighborhood: 'Barrett', lat: 45.6795, lng: -121.5344,
    amenities: [],
    description:
      'A cleared, gently sloping parcel with a completed boundary survey, power and water to the road, and an approved building envelope facing south toward the valley. Geotechnical report available on request.',
  },
  {
    reference: 'RE-2026-0106', title: 'Ground-floor retail space on a corner block',
    type: 'commercial', mode: 'RENT', price: 4200, floorAreaSqm: 145, yearBuilt: 1998,
    agent: 'agent.omar@demo.realestate',
    city: 'Seattle', state: 'WA', neighborhood: 'Ballard', lat: 47.6684, lng: -122.3841,
    amenities: ['air-conditioning', 'security-system'],
    description:
      'Corner retail unit with two walls of glass, a roll-up service door at the rear, and a small mezzanine. Previously a bakery, so there is a grease trap and 200-amp service. Six-year lease preferred.',
  },
  {
    reference: 'RE-2026-0107', title: 'Family house with a level yard on a cul-de-sac',
    type: 'house', mode: 'SALE', price: 735000, bedrooms: 4, bathrooms: 2,
    floorAreaSqm: 196, lotAreaSqm: 610, yearBuilt: 1998, agent: 'agent.lena@demo.realestate',
    city: 'Beaverton', state: 'OR', neighborhood: 'Murrayhill', lat: 45.4599, lng: -122.8451,
    amenities: ['updated-kitchen', 'garage-parking', 'private-garden', 'air-conditioning', 'in-unit-laundry'],
    description:
      'A well-kept two-story at the end of a quiet cul-de-sac. Four bedrooms up, a main-floor office, and a flat back yard with a covered patio. New roof in 2022. Assigned to a strong elementary school.',
  },
  {
    reference: 'RE-2026-0108', title: 'Modern three-bedroom rental with a double garage',
    type: 'house', mode: 'RENT', price: 3600, bedrooms: 3, bathrooms: 3,
    floorAreaSqm: 178, lotAreaSqm: 340, yearBuilt: 2021, agent: 'agent.omar@demo.realestate',
    city: 'Vancouver', state: 'WA', neighborhood: 'Felida', lat: 45.7135, lng: -122.6790,
    amenities: ['air-conditioning', 'in-unit-laundry', 'garage-parking', 'updated-kitchen', 'pet-friendly', 'balcony'],
    description:
      'Newer construction with an open main floor, a kitchen island that seats four, and a primary suite with a walk-in closet. Attached two-car garage and a low-maintenance yard. Twelve-month lease, available now.',
  },
  {
    reference: 'RE-2026-0109', title: 'Restored bungalow with a wraparound porch',
    type: 'house', mode: 'SALE', price: 679000, bedrooms: 3, bathrooms: 2,
    floorAreaSqm: 158, lotAreaSqm: 430, yearBuilt: 1931, agent: 'agent.lena@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Sellwood', lat: 45.4649, lng: -122.6531,
    amenities: ['hardwood-floors', 'updated-kitchen', 'private-garden', 'air-conditioning'],
    description:
      'A 1931 bungalow taken back to the studs and rebuilt with care. Original fir floors and trim, a new kitchen with a walk-in pantry, and a wraparound porch that catches the morning sun. Alley-access garage at the rear.',
  },
  {
    reference: 'RE-2026-0110', title: 'Top-floor loft with skyline views',
    type: 'condominium', mode: 'SALE', price: 828000, bedrooms: 2, bathrooms: 2,
    floorAreaSqm: 121, yearBuilt: 2016, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Pearl District', lat: 45.5301, lng: -122.6853,
    amenities: ['air-conditioning', 'in-unit-laundry', 'balcony', 'fitness-center', 'elevator', 'security-system'],
    description:
      'Top-floor corner loft with polished concrete floors, exposed ductwork, and a wall of south-facing glass. Private balcony over the courtyard. Deeded parking and a storage cage. Building has a roof deck and a guest suite.',
  },
  {
    reference: 'RE-2026-0111', title: 'Four-bedroom on a double lot near the lake',
    type: 'house', mode: 'SALE', price: 1145000, bedrooms: 4, bathrooms: 3,
    floorAreaSqm: 268, lotAreaSqm: 920, yearBuilt: 2004, agent: 'agent.lena@demo.realestate',
    city: 'Bellevue', state: 'WA', neighborhood: 'Enatai', lat: 47.5859, lng: -122.2015,
    amenities: ['updated-kitchen', 'garage-parking', 'private-garden', 'air-conditioning', 'security-system'],
    description:
      'A generous two-story on a rare double lot, four blocks from the lake and the trail. Vaulted entry, a main-floor guest room, and a level back yard with room for a pool. Three-car garage. Assigned to top-rated schools.',
  },
  {
    reference: 'RE-2026-0112', title: 'Studio apartment above a bakery',
    type: 'apartment', mode: 'RENT', price: 1550, bedrooms: 0, bathrooms: 1,
    floorAreaSqm: 39, yearBuilt: 1946, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Kerns', lat: 45.5266, lng: -122.6376,
    amenities: ['hardwood-floors', 'pet-friendly'],
    description:
      'A compact, well-lit studio one flight up from a neighborhood bakery. Original floors, a renovated bathroom, and a Murphy bed that frees the room during the day. Laundry in the basement. Cats welcome.',
  },
  {
    reference: 'RE-2026-0113', title: 'Split-level with a workshop and RV parking',
    type: 'house', mode: 'SALE', price: 585000, bedrooms: 3, bathrooms: 2,
    floorAreaSqm: 174, lotAreaSqm: 700, yearBuilt: 1978, agent: 'agent.lena@demo.realestate',
    city: 'Gresham', state: 'OR', neighborhood: 'Powell Valley', lat: 45.4779, lng: -122.4302,
    amenities: ['garage-parking', 'private-garden', 'air-conditioning'],
    description:
      'A tidy split-level on a quarter acre with a heated detached workshop, gated RV parking, and mature fruit trees. Updated windows and furnace. The lower level has its own entrance and could work as a guest suite.',
  },
  {
    reference: 'RE-2026-0114', title: 'One-bedroom condo with a marina slip option',
    type: 'condominium', mode: 'SALE', price: 449000, bedrooms: 1, bathrooms: 1,
    floorAreaSqm: 76, yearBuilt: 2011, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'South Waterfront', lat: 45.4961, lng: -122.6718,
    amenities: ['air-conditioning', 'in-unit-laundry', 'balcony', 'fitness-center', 'elevator'],
    description:
      'A bright one-bedroom facing the river, with a covered balcony and a boat slip available to buy separately from the HOA. Tram and greenway at the door. Pet-friendly building with a dog wash on the ground floor.',
  },
  {
    reference: 'RE-2026-0115', title: 'Corner townhouse with a rooftop terrace',
    type: 'townhouse', mode: 'SALE', price: 712000, bedrooms: 3, bathrooms: 3,
    floorAreaSqm: 162, lotAreaSqm: 90, yearBuilt: 2020, agent: 'agent.lena@demo.realestate',
    city: 'Seattle', state: 'WA', neighborhood: 'Columbia City', lat: 47.5601, lng: -122.2855,
    amenities: ['hardwood-floors', 'updated-kitchen', 'balcony', 'air-conditioning', 'garage-parking'],
    description:
      'An end-unit townhouse with windows on three sides and a private rooftop terrace with a gas line and a water bib. Ground-floor flex room with a full bath. Two blocks from the light rail and the farmers market.',
  },
  {
    reference: 'RE-2026-0116', title: 'Warehouse live-work unit with a roll-up door',
    type: 'commercial', mode: 'RENT', price: 3100, floorAreaSqm: 130, yearBuilt: 1962,
    agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Central Eastside', lat: 45.5175, lng: -122.6559,
    amenities: ['security-system'],
    description:
      'A ground-floor live-work unit in a converted warehouse: eighteen-foot ceilings, a street-facing roll-up door, a small kitchen, and a sleeping loft. Zoned for light manufacturing and retail. Freight elevator in the building.',
  },
  {
    reference: 'RE-2026-0117', title: 'Ranch house with a new roof and solar',
    type: 'house', mode: 'SALE', price: 529000, bedrooms: 3, bathrooms: 2,
    floorAreaSqm: 148, lotAreaSqm: 560, yearBuilt: 1965, agent: 'agent.lena@demo.realestate',
    city: 'Hillsboro', state: 'OR', neighborhood: 'Orenco', lat: 45.5307, lng: -122.9310,
    amenities: ['updated-kitchen', 'garage-parking', 'air-conditioning', 'private-garden'],
    description:
      'A single-level ranch a short walk from the Orenco station, with an owned solar array, a two-year-old roof, and a remodeled kitchen. Hardwood under the carpet in the bedrooms. Covered patio and a storage shed.',
  },
  {
    reference: 'RE-2026-0118', title: 'Two-bedroom garden apartment with a patio',
    type: 'apartment', mode: 'RENT', price: 2100, bedrooms: 2, bathrooms: 1,
    floorAreaSqm: 82, yearBuilt: 1988, agent: 'agent.omar@demo.realestate',
    city: 'Beaverton', state: 'OR', neighborhood: 'Central Beaverton', lat: 45.4869, lng: -122.8036,
    amenities: ['in-unit-laundry', 'air-conditioning', 'balcony', 'pet-friendly', 'swimming-pool'],
    description:
      'A ground-floor two-bedroom opening onto a fenced patio and a shared lawn. In-unit laundry, updated bathroom, and a reserved carport space. The complex has a seasonal pool. Close to the library and the transit center.',
  },
  {
    reference: 'RE-2026-0119', title: 'Hillside contemporary with valley views',
    type: 'house', mode: 'SALE', price: 1390000, bedrooms: 4, bathrooms: 4,
    floorAreaSqm: 312, lotAreaSqm: 1180, yearBuilt: 2013, agent: 'agent.lena@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Healy Heights', lat: 45.4907, lng: -122.7043,
    amenities: ['updated-kitchen', 'garage-parking', 'air-conditioning', 'private-garden', 'security-system', 'hardwood-floors'],
    description:
      'A three-level contemporary built into the hillside, with floor-to-ceiling glass facing the valley and the mountains beyond. Chef kitchen, a main-floor primary suite, and a lower level set up as a media room and gym.',
  },
  {
    reference: 'RE-2026-0120', title: 'In-town cottage within walk of the river',
    type: 'house', mode: 'RENT', price: 2650, bedrooms: 2, bathrooms: 1,
    floorAreaSqm: 96, lotAreaSqm: 320, yearBuilt: 1940, agent: 'agent.omar@demo.realestate',
    city: 'Hood River', state: 'OR', neighborhood: 'The Heights', lat: 45.7050, lng: -121.5150,
    amenities: ['hardwood-floors', 'private-garden', 'pet-friendly'],
    description:
      'A small, well-kept cottage a few blocks above downtown, with a fenced yard, a detached studio, and a covered porch. Walk to the waterfront, the brewery district, and the trailheads. Available on a twelve-month lease.',
  },
  {
    reference: 'RE-2026-0121', title: 'Ground-floor office suite on Main Street',
    type: 'commercial', mode: 'RENT', price: 2800, floorAreaSqm: 110, yearBuilt: 1925,
    agent: 'agent.omar@demo.realestate',
    city: 'Vancouver', state: 'WA', neighborhood: 'Downtown', lat: 45.6318, lng: -122.6720,
    amenities: ['air-conditioning', 'security-system', 'elevator'],
    description:
      'A street-level office suite in a restored 1925 building: two private offices, an open bullpen, a kitchenette, and a shared conference room down the hall. Bike room and after-hours access. Two parking permits included.',
  },
  {
    reference: 'RE-2026-0122', title: 'Wooded acre with a well and a building pad',
    type: 'land', mode: 'SALE', price: 268000, floorAreaSqm: null, lotAreaSqm: 4050,
    agent: 'agent.lena@demo.realestate',
    city: 'Estacada', state: 'OR', neighborhood: 'Currinsville', lat: 45.2999, lng: -122.3204,
    amenities: [],
    description:
      'A gently sloping wooded acre with a drilled well, a septic feasibility on file, and a cleared building pad set back from the road. Power at the property line. Filtered views toward the foothills through second-growth fir.',
  },
  {
    reference: 'RE-2026-0123', title: 'Mid-century daylight ranch, agent preview',
    type: 'house', mode: 'SALE', price: 640000, bedrooms: 4, bathrooms: 2,
    floorAreaSqm: 186, lotAreaSqm: 640, yearBuilt: 1961, agent: 'agent.lena@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Roseway', lat: 45.5462, lng: -122.5793,
    amenities: ['hardwood-floors', 'garage-parking', 'private-garden'],
    status: 'PENDING_REVIEW',
    description:
      'A mid-century daylight ranch with the original terrazzo entry, a wall of clerestory windows, and a lower level that walks out to the garden. Being prepared for market: photos and the final price are still being confirmed.',
  },
  {
    reference: 'RE-2026-0124', title: 'New-build rowhouse near the greenway, agent preview',
    type: 'townhouse', mode: 'SALE', price: 559000, bedrooms: 3, bathrooms: 3,
    floorAreaSqm: 150, lotAreaSqm: 85, yearBuilt: 2025, agent: 'agent.omar@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Cully', lat: 45.5619, lng: -122.6017,
    amenities: ['updated-kitchen', 'balcony', 'air-conditioning'],
    status: 'PENDING_REVIEW',
    description:
      'One of four new rowhouses backing onto the greenway, with a ground-floor bedroom and bath, an open second level, and a top-floor primary suite with a covered deck. Submitted for review ahead of the first open house.',
  },
  {
    reference: 'RE-2026-0125', title: 'Corner duplex, draft listing',
    type: 'house', mode: 'SALE', price: 720000, bedrooms: 4, bathrooms: 3,
    floorAreaSqm: 210, lotAreaSqm: 480, yearBuilt: 1994, agent: 'agent.lena@demo.realestate',
    city: 'Portland', state: 'OR', neighborhood: 'Montavilla', lat: 45.5142, lng: -122.5691,
    amenities: ['garage-parking', 'private-garden'],
    status: 'DRAFT',
    description:
      'A side-by-side duplex on a corner lot, each unit with two bedrooms up and a fenced yard. Long-term tenants in both sides. Draft listing while the seller decides between selling as an investment or vacant.',
  },
];

// ==================================================================
//  Runner
// ==================================================================

async function seedReferenceData() {
  const typeBySlug = {};
  for (const [name, slug] of PROPERTY_TYPES) {
    typeBySlug[slug] = await prisma.propertyType.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }

  const amenityBySlug = {};
  for (const [name, slug, category] of AMENITIES) {
    amenityBySlug[slug] = await prisma.amenity.upsert({
      where: { slug },
      update: { name, category },
      create: { name, slug, category },
    });
  }

  return { typeBySlug, amenityBySlug };
}

async function seedOrganization() {
  // The company was renamed from "Harborline" to "Larkspur"; rename any org an
  // earlier seed created under the old slug so we don't leave a stale row.
  await prisma.organization.updateMany({
    where: { slug: 'harborline-realty' },
    data: { name: 'Larkspur Realty', slug: 'larkspur-realty', email: 'hello@larkspur.example' },
  });

  return prisma.organization.upsert({
    where: { slug: 'larkspur-realty' },
    update: {},
    create: {
      name: 'Larkspur Realty',
      slug: 'larkspur-realty',
      email: 'hello@larkspur.example',
      phone: '+1 503 555 0142',
      addressLine1: '318 NW Couch St, Suite 400',
      city: 'Portland',
      state: 'OR',
      postalCode: '97209',
      country: 'USA',
      timezone: 'America/Los_Angeles',
    },
  });
}

async function seedUsers(roleByName, organization) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const userByEmail = {};

  for (const person of STAFF) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        email: person.email,
        passwordHash,
        firstName: person.firstName,
        lastName: person.lastName,
        roles: { create: { roleId: roleByName[person.role].id } },
        ...(person.agent
          ? {
              agent: {
                create: {
                  organizationId: organization.id,
                  title: person.agent.title,
                  licenseNumber: person.agent.licenseNumber,
                  bio: person.agent.bio,
                },
              },
            }
          : {}),
      },
      include: { agent: true },
    });
    userByEmail[person.email] = user;
  }

  const customer = await prisma.user.upsert({
    where: { email: CUSTOMER.email },
    update: {},
    create: {
      email: CUSTOMER.email,
      passwordHash,
      firstName: CUSTOMER.firstName,
      lastName: CUSTOMER.lastName,
      roles: { create: { roleId: roleByName.CUSTOMER.id } },
      customer: { create: { phone: '+1 971 555 0188', preferredContact: 'email' } },
    },
  });
  userByEmail[CUSTOMER.email] = customer;

  return userByEmail;
}

async function seedProperties({ typeBySlug, amenityBySlug, organization, userByEmail }) {
  // Clear previous demo properties so re-running does not pile up duplicates.
  await prisma.property.deleteMany({
    where: { reference: { in: PROPERTIES.map((p) => p.reference) } },
  });

  // Most demo listings are live; a few are left mid-workflow so the agent
  // portal and the admin review queue have something to show.
  const now = new Date();
  const reviewedBy = userByEmail['admin@demo.realestate']?.id ?? null;

  for (const p of PROPERTIES) {
    const agentUser = userByEmail[p.agent];
    const agentId = agentUser?.agent?.id ?? null;
    const submittedBy = agentUser?.id ?? null;
    const isRent = p.mode === 'RENT';
    const status = p.status ?? 'PUBLISHED';
    const isPublished = status === 'PUBLISHED';
    const wasReviewed = isPublished; // published listings have been through review

    // The status history that led to this state.
    const history = [];
    if (status !== 'DRAFT') {
      history.push({ toStatus: 'PENDING_REVIEW', note: 'Submitted for review', changedById: submittedBy });
    }
    if (isPublished) {
      history.push({
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'PUBLISHED',
        note: 'Approved and published',
        changedById: reviewedBy,
      });
    }

    const property = await prisma.property.create({
      data: {
        reference: p.reference,
        title: p.title,
        description: p.description,
        propertyTypeId: typeBySlug[p.type].id,
        listingMode: p.mode,
        status,
        price: p.price,
        currency: 'USD',
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        floorAreaSqm: p.floorAreaSqm ?? null,
        lotAreaSqm: p.lotAreaSqm ?? null,
        yearBuilt: p.yearBuilt ?? null,
        organizationId: organization.id,
        agentId,
        createdById: agentUser?.id ?? null,
        publishedAt: isPublished ? now : null,
        location: {
          create: {
            city: p.city,
            state: p.state,
            country: 'USA',
            neighborhood: p.neighborhood ?? null,
            latitude: p.lat ?? null,
            longitude: p.lng ?? null,
            formattedAddress: `${p.neighborhood ? p.neighborhood + ', ' : ''}${p.city}, ${p.state}`,
          },
        },
        images: {
          create: [0, 1, 2].map((i) => ({
            // Placeholder photography keyed by reference so each listing looks distinct.
            url: `https://picsum.photos/seed/${p.reference.toLowerCase()}-${i}/1200/900`,
            caption: i === 0 ? 'Exterior' : i === 1 ? 'Living area' : 'Kitchen',
            sortOrder: i,
            isCover: i === 0,
          })),
        },
        amenities: {
          create: (p.amenities ?? []).map((slug) => ({ amenityId: amenityBySlug[slug].id })),
        },
        listing: {
          create: {
            status,
            submittedById: status === 'DRAFT' ? null : submittedBy,
            submittedAt: status === 'DRAFT' ? null : now,
            reviewedById: wasReviewed ? reviewedBy : null,
            reviewedAt: wasReviewed ? now : null,
            publishedAt: isPublished ? now : null,
            statusHistory: { create: history },
          },
        },
      },
    });

    // One sample inquiry per published rental, so the Phase 5 CRM has something to show.
    if (isRent && isPublished) {
      await prisma.inquiry.create({
        data: {
          propertyId: property.id,
          name: 'Sofia Marchetti',
          email: 'sofia.marchetti@example.com',
          phone: '+1 206 555 0164',
          message: `Is ${p.reference} still available for a viewing this week?`,
          source: 'WEBSITE',
          status: 'NEW',
          assignedAgentId: agentId,
        },
      });
    }
  }
}

// With --reset, wipe all transactional data first (used by the test database).
// Deleting properties cascades to images, documents, listings, inquiries, and
// appointments; the rest are removed explicitly.
async function resetTransactionalData() {
  await prisma.property.deleteMany({});
  await Promise.all([
    prisma.notification.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.savedSearch.deleteMany({}),
    prisma.refreshToken.deleteMany({}),
  ]);
  console.log('  reset transactional data');
}

async function main() {
  console.log('Seeding database...');

  if (process.argv.includes('--reset')) await resetTransactionalData();

  const { roleByName } = await seedRbac(prisma);
  console.log('  roles and permissions');

  const { typeBySlug, amenityBySlug } = await seedReferenceData();
  console.log('  property types and amenities');

  const organization = await seedOrganization();
  console.log('  organization');

  const userByEmail = await seedUsers(roleByName, organization);
  console.log('  demo users');

  await seedProperties({ typeBySlug, amenityBySlug, organization, userByEmail });
  console.log(`  ${PROPERTIES.length} demo properties`);

  console.log('\nDone. Demo logins (all use the same password):\n');
  console.log(`  password: ${DEMO_PASSWORD}\n`);
  for (const s of STAFF) console.log(`  ${s.role.padEnd(16)} ${s.email}`);
  console.log(`  ${'CUSTOMER'.padEnd(16)} ${CUSTOMER.email}`);
  console.log('');
}

main()
  .catch((err) => {
    console.error('\nSeed failed:\n', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
