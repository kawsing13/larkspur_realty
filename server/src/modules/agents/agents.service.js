// Agent accounts: the staff directory, an agent's own profile, admin editing, and
// a public profile page with the agent's live listings.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { hashPassword } from '../../lib/password.js';
import { writeAudit } from '../../lib/audit.js';
import { PROPERTY_CARD_SELECT, toPropertyCard } from '../../lib/propertyCard.js';

// A count of the agent's properties grouped by status - their "listing performance"
// at a glance.
const performanceFor = async (agentId) => {
  const rows = await prisma.property.groupBy({
    by: ['status'],
    where: { agentId },
    _count: { _all: true },
  });
  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  return {
    total: rows.reduce((sum, r) => sum + r._count._all, 0),
    published: byStatus.PUBLISHED ?? 0,
    inReview: byStatus.PENDING_REVIEW ?? 0,
    draft: (byStatus.DRAFT ?? 0) + (byStatus.CHANGES_REQUESTED ?? 0),
    closed: (byStatus.SOLD ?? 0) + (byStatus.RENTED ?? 0),
  };
};

const shape = (agent, performance) => ({
  id: agent.id,
  title: agent.title,
  bio: agent.bio,
  licenseNumber: agent.licenseNumber,
  photoUrl: agent.photoUrl,
  status: agent.status,
  organization: agent.organization ? { id: agent.organization.id, name: agent.organization.name } : null,
  user: {
    id: agent.user.id,
    firstName: agent.user.firstName,
    lastName: agent.user.lastName,
    email: agent.user.email,
    phone: agent.user.phone,
    status: agent.user.status,
  },
  performance,
});

export const listAgents = async (query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.user = {
      is: {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      },
    };
  }

  const [rows, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take,
      orderBy: { user: { firstName: 'asc' } },
      include: { user: true, organization: true, _count: { select: { properties: true } } },
    }),
    prisma.agent.count({ where }),
  ]);

  const data = rows.map((a) => ({
    id: a.id,
    name: `${a.user.firstName} ${a.user.lastName}`,
    email: a.user.email,
    title: a.title,
    status: a.status,
    propertyCount: a._count.properties,
  }));

  return paginated(data, total, { page, pageSize });
};

const loadAgent = async (agentId) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: true, organization: true },
  });
  if (!agent) throw ApiError.notFound('Agent not found');
  return agent;
};

export const getAgent = async (agentId) => {
  const agent = await loadAgent(agentId);
  return shape(agent, await performanceFor(agent.id));
};

export const getMyProfile = async (user) => {
  if (!user.agentId) throw ApiError.forbidden('Your account is not an agent profile');
  return getAgent(user.agentId);
};

export const updateMyProfile = async (user, body) => {
  if (!user.agentId) throw ApiError.forbidden('Your account is not an agent profile');

  const agent = await prisma.agent.update({
    where: { id: user.agentId },
    data: {
      ...(body.title !== undefined ? { title: body.title || null } : {}),
      ...(body.bio !== undefined ? { bio: body.bio || null } : {}),
      ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
      ...(body.phone !== undefined
        ? { user: { update: { phone: body.phone || null } } }
        : {}),
    },
    include: { user: true, organization: true },
  });
  return shape(agent, await performanceFor(agent.id));
};

export const updateAgent = async (req, agentId, body) => {
  await loadAgent(agentId);

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(body.title !== undefined ? { title: body.title || null } : {}),
      ...(body.bio !== undefined ? { bio: body.bio || null } : {}),
      ...(body.licenseNumber !== undefined ? { licenseNumber: body.licenseNumber || null } : {}),
      ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: { user: true, organization: true },
  });

  await writeAudit({
    req,
    action: 'agent.updated',
    entityType: 'Agent',
    entityId: agent.id,
    summary: `Updated ${agent.user.firstName} ${agent.user.lastName}`,
  });

  return shape(agent, await performanceFor(agent.id));
};

export const createAgent = async (req, body) => {
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const [agentRole, organization] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'AGENT' } }),
    prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } }),
  ]);
  if (!agentRole) throw new ApiError(500, 'AGENT role missing - run the seed');
  if (!organization) throw new ApiError(500, 'No organization exists yet');

  const user = await prisma.user.create({
    data: {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      // The admin shares this password with the agent, who changes it after signing in.
      passwordHash: await hashPassword(body.temporaryPassword),
      status: 'ACTIVE',
      roles: { create: { roleId: agentRole.id } },
      agent: {
        create: {
          organizationId: organization.id,
          title: body.title || null,
          licenseNumber: body.licenseNumber || null,
        },
      },
    },
    include: { agent: { include: { user: true, organization: true } } },
  });

  await writeAudit({
    req,
    action: 'agent.created',
    entityType: 'Agent',
    entityId: user.agent.id,
    summary: `Created agent ${user.firstName} ${user.lastName}`,
  });

  return shape(user.agent, await performanceFor(user.agent.id));
};

// Public profile: name, title, bio, contact, and a page of the agent's
// published listings (same paginated shape as every other list endpoint).
export const getPublicProfile = async (agentId, query = {}) => {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, status: 'ACTIVE' },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
  });
  if (!agent) throw ApiError.notFound('Agent not found');

  // Default to 12 per page (a tidy 3-column grid) unless the client asks otherwise.
  const { skip, take, page, pageSize } = parsePagination({
    pageSize: query.pageSize ?? 12,
    page: query.page,
  });
  const where = { agentId, status: 'PUBLISHED' };
  const [listings, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
      select: PROPERTY_CARD_SELECT,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    agent: {
      id: agent.id,
      name: `${agent.user.firstName} ${agent.user.lastName}`,
      title: agent.title,
      bio: agent.bio,
      photoUrl: agent.photoUrl,
      email: agent.user.email,
      phone: agent.user.phone,
    },
    listings: paginated(listings.map(toPropertyCard), total, { page, pageSize }),
  };
};
