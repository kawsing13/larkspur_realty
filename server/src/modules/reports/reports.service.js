// Read-only analytics for administrators: the operations overview and per-agent
// performance, plus a PDF export of both.

import { prisma } from '../../config/prisma.js';
import { summaryReportPDF } from '../../lib/pdf.js';

export const overview = async () => {
  const now = new Date();

  const [
    activeListings,
    sold,
    rented,
    agents,
    newInquiries,
    pendingApprovals,
    upcomingViewings,
    won,
    closedLeads,
    funnelRows,
  ] = await Promise.all([
    prisma.property.count({ where: { status: 'PUBLISHED' } }),
    prisma.property.count({ where: { status: 'SOLD' } }),
    prisma.property.count({ where: { status: 'RENTED' } }),
    prisma.agent.count(),
    prisma.inquiry.count({ where: { status: 'NEW' } }),
    prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.appointment.count({
      where: {
        status: { in: ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'] },
        requestedStart: { gte: now },
      },
    }),
    prisma.inquiry.count({ where: { status: 'WON' } }),
    prisma.inquiry.count({ where: { status: { in: ['WON', 'LOST'] } } }),
    prisma.inquiry.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const funnel = Object.fromEntries(funnelRows.map((r) => [r.status, r._count._all]));
  const totalLeads = funnelRows.reduce((sum, r) => sum + r._count._all, 0);
  const conversionRate = closedLeads ? Math.round((won / closedLeads) * 100) : 0;

  // Top properties by inquiry volume.
  const topRaw = await prisma.inquiry.groupBy({
    by: ['propertyId'],
    _count: { _all: true },
    orderBy: { _count: { propertyId: 'desc' } },
    take: 5,
  });
  const props = await prisma.property.findMany({
    where: { id: { in: topRaw.map((t) => t.propertyId) } },
    select: { id: true, reference: true, title: true },
  });
  const topProperties = topRaw.map((t) => ({
    ...(props.find((p) => p.id === t.propertyId) || { id: t.propertyId }),
    inquiries: t._count._all,
  }));

  return {
    activeListings,
    sold,
    rented,
    closed: sold + rented,
    agents,
    newInquiries,
    pendingApprovals,
    upcomingViewings,
    totalLeads,
    won,
    conversionRate,
    funnel,
    topProperties,
  };
};

export const agentPerformance = async () => {
  const agents = await prisma.agent.findMany({
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const rows = await Promise.all(
    agents.map(async (a) => {
      const [published, leads, won, viewingsCompleted] = await Promise.all([
        prisma.property.count({ where: { agentId: a.id, status: 'PUBLISHED' } }),
        prisma.inquiry.count({ where: { assignedAgentId: a.id } }),
        prisma.inquiry.count({ where: { assignedAgentId: a.id, status: 'WON' } }),
        prisma.appointment.count({ where: { agentId: a.id, status: 'COMPLETED' } }),
      ]);
      return {
        id: a.id,
        name: `${a.user.firstName} ${a.user.lastName}`,
        published,
        leads,
        won,
        viewingsCompleted,
      };
    }),
  );

  return rows.sort((x, y) => y.published - x.published || y.leads - x.leads);
};

export const summaryPdf = async () =>
  summaryReportPDF({ overview: await overview(), agents: await agentPerformance() });
