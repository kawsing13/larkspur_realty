// Inquiry capture and lead management (CRM).
//
//   public form -> Inquiry (auto-assigned to the listing agent)
//     -> agent works the lead: status, follow-up date, notes
//     -> admin can reassign
//   lifecycle: NEW -> CONTACTED -> QUALIFIED -> VIEWING_SCHEDULED -> NEGOTIATION -> WON | LOST
//
// InquiryNote doubles as the interaction timeline: agent notes (kind NOTE) plus
// automatic entries for status changes and assignments.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { writeAudit } from '../../lib/audit.js';
import { notify } from '../../lib/notifications.js';

const isAdmin = (user) =>
  user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN');
const canSeeAll = (user) => isAdmin(user) || user.roles.includes('PROPERTY_MANAGER');

// "VIEWING_SCHEDULED" -> "Viewing scheduled"
const humanStatus = (s) => {
  const t = s.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const PROPERTY_SUMMARY = {
  select: {
    id: true,
    reference: true,
    title: true,
    listingMode: true,
    status: true,
    agentId: true,
    location: { select: { city: true, state: true } },
    images: { where: { isCover: true }, take: 1, select: { url: true } },
  },
};

const shapeCard = (i) => ({
  id: i.id,
  name: i.name,
  email: i.email,
  phone: i.phone,
  status: i.status,
  source: i.source,
  followUpDate: i.followUpDate,
  createdAt: i.createdAt,
  assignedAgent: i.assignedAgent
    ? `${i.assignedAgent.user.firstName} ${i.assignedAgent.user.lastName}`
    : null,
  property: i.property && {
    id: i.property.id,
    reference: i.property.reference,
    title: i.property.title,
  },
});

const shapeDetail = (i) => ({
  id: i.id,
  name: i.name,
  email: i.email,
  phone: i.phone,
  message: i.message,
  status: i.status,
  source: i.source,
  followUpDate: i.followUpDate,
  createdAt: i.createdAt,
  customer: i.customer
    ? {
        id: i.customer.id,
        name: `${i.customer.user.firstName} ${i.customer.user.lastName}`,
        email: i.customer.user.email,
      }
    : null,
  assignedAgent: i.assignedAgent
    ? {
        id: i.assignedAgent.id,
        name: `${i.assignedAgent.user.firstName} ${i.assignedAgent.user.lastName}`,
      }
    : null,
  property: i.property && {
    id: i.property.id,
    reference: i.property.reference,
    title: i.property.title,
    listingMode: i.property.listingMode,
    status: i.property.status,
    city: i.property.location?.city ?? null,
    coverImage: i.property.images?.[0]?.url ?? null,
  },
  timeline: (i.notes ?? []).map((n) => ({
    id: n.id,
    kind: n.kind,
    body: n.body,
    by: n.author ? `${n.author.firstName} ${n.author.lastName}` : null,
    at: n.createdAt,
  })),
});

// ---- create (public) ----

export const createInquiry = async (body, user) => {
  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, status: 'PUBLISHED' },
    select: {
      id: true,
      reference: true,
      agentId: true,
      agent: { select: { user: { select: { id: true } } } },
    },
  });
  if (!property) throw ApiError.notFound('That listing is not available');

  const agentId = property.agentId ?? null;

  const inquiry = await prisma.inquiry.create({
    data: {
      propertyId: property.id,
      customerId: user?.customerId ?? null,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      message: body.message,
      source: 'WEBSITE',
      status: 'NEW',
      assignedAgentId: agentId,
      notes: agentId
        ? {
            create: {
              kind: 'ASSIGNMENT',
              body: 'Auto-assigned to the listing agent',
              authorId: null,
            },
          }
        : undefined,
    },
  });

  if (agentId) {
    await prisma.leadAssignment.create({
      data: { inquiryId: inquiry.id, agentId, reason: 'New website inquiry' },
    });
    await notify({
      userId: property.agent?.user?.id,
      type: 'INQUIRY_ASSIGNED',
      title: 'New lead',
      body: `${body.name} is interested in ${property.reference}`,
      data: { inquiryId: inquiry.id },
    });
  }

  return { id: inquiry.id };
};

// ---- staff read ----

export const listForStaff = async (user, query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const and = [];
  if (!canSeeAll(user) || query.scope === 'mine') {
    // An agent's leads: assigned to them, or on one of their properties.
    and.push({
      OR: [
        { assignedAgentId: user.agentId ?? '__none__' },
        { property: { is: { agentId: user.agentId ?? '__none__' } } },
      ],
    });
  }
  if (query.status) and.push({ status: query.status });
  if (query.agentId) and.push({ assignedAgentId: query.agentId });
  if (query.propertyId) and.push({ propertyId: query.propertyId });
  if (query.search) {
    and.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }
  if (query.followUpDue) {
    and.push({
      followUpDate: { not: null, lte: new Date() },
      status: { notIn: ['WON', 'LOST'] },
    });
  }

  const where = and.length ? { AND: and } : {};

  const [rows, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        property: { select: { id: true, reference: true, title: true } },
        assignedAgent: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return paginated(rows.map(shapeCard), total, { page, pageSize });
};

const DETAIL_INCLUDE = {
  property: PROPERTY_SUMMARY,
  customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
  assignedAgent: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  notes: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { firstName: true, lastName: true } } },
  },
};

const loadInquiry = async (user, inquiryId, { forWrite = false } = {}) => {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: DETAIL_INCLUDE,
  });
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  const assigned = user.agentId && inquiry.assignedAgentId === user.agentId;
  // The listing agent can SEE leads on their property; working the lead follows
  // the assignment.
  const onMyProperty = user.agentId && inquiry.property?.agentId === user.agentId;

  const allowed = forWrite
    ? isAdmin(user) || assigned
    : canSeeAll(user) || assigned || onMyProperty;

  if (!allowed) throw ApiError.forbidden('This lead is handled by another agent');
  return inquiry;
};

export const getForStaff = async (user, inquiryId) =>
  shapeDetail(await loadInquiry(user, inquiryId));

// ---- staff write ----

export const updateInquiry = async (user, inquiryId, body) => {
  const inquiry = await loadInquiry(user, inquiryId, { forWrite: true });

  const data = {};
  const timelineNotes = [];

  if (body.status !== undefined && body.status !== inquiry.status) {
    data.status = body.status;
    timelineNotes.push({
      kind: 'STATUS_CHANGE',
      authorId: user.id,
      body: `Status changed to ${humanStatus(body.status)}`,
    });
  }
  if (body.followUpDate !== undefined) {
    data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
  }

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { ...data, notes: timelineNotes.length ? { create: timelineNotes } : undefined },
  });

  return getForStaff(user, inquiryId);
};

export const addNote = async (user, inquiryId, text) => {
  await loadInquiry(user, inquiryId, { forWrite: true });
  await prisma.inquiryNote.create({
    data: { inquiryId, authorId: user.id, kind: 'NOTE', body: text },
  });
  return getForStaff(user, inquiryId);
};

export const assignInquiry = async (req, inquiryId, agentId, reason) => {
  const user = req.user;
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!agent) throw ApiError.badRequest('That agent does not exist');

  const agentName = `${agent.user.firstName} ${agent.user.lastName}`;

  await prisma.$transaction([
    // Close the currently open assignment, if any.
    prisma.leadAssignment.updateMany({
      where: { inquiryId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    }),
    prisma.leadAssignment.create({
      data: { inquiryId, agentId, assignedById: user.id, reason: reason || null },
    }),
    prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        assignedAgentId: agentId,
        notes: {
          create: { kind: 'ASSIGNMENT', authorId: user.id, body: `Assigned to ${agentName}` },
        },
      },
    }),
  ]);

  await notify({
    userId: agent.user.id,
    type: 'INQUIRY_ASSIGNED',
    title: 'Lead assigned to you',
    body: `${inquiry.name}'s inquiry was assigned to you`,
    data: { inquiryId },
  });
  await writeAudit({
    req,
    action: 'lead.assigned',
    entityType: 'Inquiry',
    entityId: inquiryId,
    summary: `Assigned ${inquiry.name}'s inquiry to ${agentName}`,
  });

  return getForStaff(user, inquiryId);
};

// ---- customer's own inquiries ----

export const listForCustomer = async (user) => {
  if (!user.customerId) throw ApiError.forbidden('Only buyer accounts have an inquiry history');

  const rows = await prisma.inquiry.findMany({
    where: { customerId: user.customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { id: true, reference: true, title: true } },
      assignedAgent: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return rows.map((i) => ({
    id: i.id,
    status: i.status,
    message: i.message,
    createdAt: i.createdAt,
    property: i.property,
    agent: i.assignedAgent
      ? `${i.assignedAgent.user.firstName} ${i.assignedAgent.user.lastName}`
      : null,
  }));
};
