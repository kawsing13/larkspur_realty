// Property viewings.
//
//   customer requests a viewing (from a listing page)  -> REQUESTED
//     agent confirms a time                            -> CONFIRMED
//     either side proposes a new time                  -> RESCHEDULED  -> confirm again
//     either side calls it off                         -> CANCELLED
//     after it happens                                 -> COMPLETED  (or NO_SHOW)
//
// When an appointment is linked to a lead, its changes are written to that lead's
// timeline and can nudge the lead's pipeline stage forward.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { writeAudit } from '../../lib/audit.js';
import { notify } from '../../lib/notifications.js';

const isAdmin = (user) =>
  user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN');
const canSeeAll = (user) => isAdmin(user) || user.roles.includes('PROPERTY_MANAGER');

const whenText = (d) =>
  new Date(d).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const ACTIONS = {
  confirm: { from: ['REQUESTED', 'RESCHEDULED'], to: 'CONFIRMED', who: 'staff', needsTime: true, verb: 'confirmed' },
  reschedule: { from: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'], to: 'RESCHEDULED', who: 'staffOrCustomer', needsTime: true, verb: 'rescheduled' },
  cancel: { from: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'], to: 'CANCELLED', who: 'staffOrCustomer', verb: 'cancelled' },
  complete: { from: ['CONFIRMED', 'RESCHEDULED'], to: 'COMPLETED', who: 'staff', verb: 'completed' },
  'no-show': { from: ['CONFIRMED', 'RESCHEDULED'], to: 'NO_SHOW', who: 'staff', verb: 'marked as no-show' },
};

const PROPERTY_SUMMARY = {
  select: {
    id: true,
    reference: true,
    title: true,
    agentId: true,
    location: { select: { city: true, state: true } },
  },
};

const shapeCard = (a) => ({
  id: a.id,
  status: a.status,
  contactName: a.contactName,
  contactEmail: a.contactEmail,
  contactPhone: a.contactPhone,
  requestedStart: a.requestedStart,
  confirmedStart: a.confirmedStart,
  // The date the schedule actually turns on.
  effectiveStart: a.confirmedStart ?? a.requestedStart,
  property: a.property && {
    id: a.property.id,
    reference: a.property.reference,
    title: a.property.title,
  },
  agent: a.agent ? `${a.agent.user.firstName} ${a.agent.user.lastName}` : null,
});

const shapeDetail = (a) => ({
  id: a.id,
  status: a.status,
  contactName: a.contactName,
  contactEmail: a.contactEmail,
  contactPhone: a.contactPhone,
  notes: a.notes,
  requestedStart: a.requestedStart,
  requestedEnd: a.requestedEnd,
  confirmedStart: a.confirmedStart,
  confirmedEnd: a.confirmedEnd,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  inquiryId: a.inquiryId,
  agent: a.agent
    ? { id: a.agent.id, name: `${a.agent.user.firstName} ${a.agent.user.lastName}` }
    : null,
  customer: a.customer
    ? { id: a.customer.id, name: `${a.customer.user.firstName} ${a.customer.user.lastName}` }
    : null,
  property: a.property && {
    id: a.property.id,
    reference: a.property.reference,
    title: a.property.title,
    city: a.property.location?.city ?? null,
  },
});

// ---- linked-lead side effects ----

// Writes a note to the lead's timeline and, where it makes sense, moves the
// pipeline forward (never backward).
const touchLead = async (inquiryId, phase, when, userId) => {
  if (!inquiryId) return;
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) return;

  let toStatus = null;
  let body = null;

  if (phase === 'confirm') {
    body = `Viewing confirmed for ${whenText(when)}`;
    if (['NEW', 'CONTACTED', 'QUALIFIED'].includes(inquiry.status)) toStatus = 'VIEWING_SCHEDULED';
  } else if (phase === 'reschedule') {
    body = `Viewing moved to ${whenText(when)}`;
  } else if (phase === 'cancel') {
    body = 'Viewing cancelled';
  } else if (phase === 'complete') {
    body = 'Viewing completed';
    if (inquiry.status === 'VIEWING_SCHEDULED') toStatus = 'NEGOTIATION';
  } else if (phase === 'no-show') {
    body = 'Viewing marked as no-show';
  }
  if (!body) return;

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      ...(toStatus ? { status: toStatus } : {}),
      notes: {
        create: { kind: toStatus ? 'STATUS_CHANGE' : 'NOTE', authorId: userId, body },
      },
    },
  });
};

// ---- create ----

export const createAppointment = async (body, user) => {
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

  // A staff member (the lead's agent or an admin) can schedule a confirmed viewing
  // straight away. Everyone else just requests a time.
  let linkedInquiry = null;
  if (body.inquiryId && user && (isAdmin(user) || user.agentId)) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: body.inquiryId } });
    if (
      inquiry &&
      (isAdmin(user) ||
        inquiry.assignedAgentId === user.agentId ||
        property.agentId === user.agentId)
    ) {
      linkedInquiry = inquiry;
    }
  }
  const staffScheduling = !!linkedInquiry;

  const start = new Date(body.requestedStart);
  const end = body.requestedEnd ? new Date(body.requestedEnd) : null;

  const appointment = await prisma.appointment.create({
    data: {
      propertyId: property.id,
      inquiryId: linkedInquiry?.id ?? null,
      customerId: user?.customerId ?? linkedInquiry?.customerId ?? null,
      agentId: property.agentId ?? null,
      requestedStart: start,
      requestedEnd: end,
      confirmedStart: staffScheduling ? start : null,
      confirmedEnd: staffScheduling ? end : null,
      status: staffScheduling ? 'CONFIRMED' : 'REQUESTED',
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || null,
      notes: body.notes || null,
    },
  });

  if (staffScheduling) {
    await touchLead(linkedInquiry.id, 'confirm', start, user.id);
  }

  await notify({
    userId: property.agent?.user?.id,
    type: 'APPOINTMENT_UPDATE',
    title: staffScheduling ? 'Viewing scheduled' : 'New viewing request',
    body: `${body.contactName} for ${property.reference} on ${whenText(start)}`,
    data: { appointmentId: appointment.id },
  });

  return { id: appointment.id, status: appointment.status };
};

// ---- read ----

const LIST_INCLUDE = {
  property: { select: { id: true, reference: true, title: true } },
  agent: { select: { user: { select: { firstName: true, lastName: true } } } },
};

export const listForStaff = async (user, query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const and = [];
  if (!canSeeAll(user) || query.scope === 'mine') {
    and.push({
      OR: [
        { agentId: user.agentId ?? '__none__' },
        { property: { is: { agentId: user.agentId ?? '__none__' } } },
      ],
    });
  }
  if (query.status) and.push({ status: query.status });
  if (query.propertyId) and.push({ propertyId: query.propertyId });
  if (query.agentId) and.push({ agentId: query.agentId });
  if (query.from) and.push({ requestedStart: { gte: new Date(query.from) } });
  if (query.to) and.push({ requestedStart: { lte: new Date(query.to) } });
  if (query.upcoming) {
    and.push({
      status: { in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'] },
      OR: [
        { confirmedStart: { gte: new Date() } },
        { AND: [{ confirmedStart: null }, { requestedStart: { gte: new Date() } }] },
      ],
    });
  }
  const where = and.length ? { AND: and } : {};

  const [rows, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy: { requestedStart: 'asc' },
      include: LIST_INCLUDE,
    }),
    prisma.appointment.count({ where }),
  ]);

  return paginated(rows.map(shapeCard), total, { page, pageSize });
};

const DETAIL_INCLUDE = {
  property: PROPERTY_SUMMARY,
  agent: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  customer: { include: { user: { select: { firstName: true, lastName: true } } } },
};

const loadAppointment = async (user, appointmentId, { forWrite = false, action } = {}) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: DETAIL_INCLUDE,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const staff =
    isAdmin(user) ||
    (user.agentId &&
      (appointment.agentId === user.agentId || appointment.property?.agentId === user.agentId));
  const owningCustomer = user.customerId && appointment.customerId === user.customerId;

  if (!forWrite) {
    if (!(canSeeAll(user) || staff || owningCustomer)) {
      throw ApiError.forbidden('You cannot view this appointment');
    }
    return appointment;
  }

  const who = ACTIONS[action]?.who;
  const allowed = who === 'staffOrCustomer' ? staff || owningCustomer : staff;
  if (!allowed) throw ApiError.forbidden('You cannot change this appointment');
  return appointment;
};

export const getForActor = async (user, appointmentId) =>
  shapeDetail(await loadAppointment(user, appointmentId));

// ---- workflow ----

export const runTransition = async (req, appointmentId, action, { start, end, note } = {}) => {
  const user = req.user;
  const spec = ACTIONS[action];
  const appointment = await loadAppointment(user, appointmentId, { forWrite: true, action });

  if (!spec.from.includes(appointment.status)) {
    throw ApiError.badRequest(
      `Cannot ${action.replace('-', ' ')} an appointment that is ${appointment.status.toLowerCase()}`,
    );
  }
  if (spec.needsTime && !start) {
    throw ApiError.validation('Choose a date and time', {
      fields: [{ field: 'start', message: 'Required' }],
    });
  }

  const startDt = start ? new Date(start) : null;
  const endDt = end ? new Date(end) : null;
  const data = { status: spec.to };

  if (action === 'confirm') {
    data.confirmedStart = startDt;
    data.confirmedEnd = endDt;
  }
  if (action === 'reschedule') {
    data.requestedStart = startDt;
    data.requestedEnd = endDt;
    data.confirmedStart = null;
    data.confirmedEnd = null;
  }
  if (note) data.notes = note;

  await prisma.appointment.update({ where: { id: appointmentId }, data });

  const effectiveWhen = startDt ?? appointment.confirmedStart ?? appointment.requestedStart;
  await touchLead(appointment.inquiryId, action, effectiveWhen, user.id);

  // Tell the other side something changed.
  const actorIsCustomer = user.customerId && appointment.customerId === user.customerId;
  if (actorIsCustomer && appointment.agent) {
    await notify({
      userId: (await prisma.agent.findUnique({ where: { id: appointment.agentId }, select: { userId: true } }))?.userId,
      type: 'APPOINTMENT_UPDATE',
      title: `Viewing ${spec.verb}`,
      body: `${appointment.contactName} ${spec.verb} the viewing for ${appointment.property?.reference}`,
      data: { appointmentId },
    });
  }

  await writeAudit({
    req,
    action: `appointment.${action.replace('-', '_')}`,
    entityType: 'Appointment',
    entityId: appointmentId,
    summary: `${appointment.property?.reference}: viewing ${spec.verb}`,
  });

  return getForActor(user, appointmentId);
};

// ---- customer's own viewings ----

export const listForCustomer = async (user) => {
  if (!user.customerId) throw ApiError.forbidden('Only buyer accounts have viewing requests');

  const rows = await prisma.appointment.findMany({
    where: { customerId: user.customerId },
    orderBy: { requestedStart: 'desc' },
    include: LIST_INCLUDE,
  });
  return rows.map(shapeCard);
};
