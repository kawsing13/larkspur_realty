// The listing approval workflow: submit -> review -> approve / request changes,
// plus publish / unpublish / close / archive. This is the ONLY place a listing's
// status (and the mirrored Property.status) changes.
//
//   agent creates property (DRAFT)
//     -> submit           -> PENDING_REVIEW
//     -> admin approve    -> PUBLISHED           (property goes live)
//     -> admin request-changes (with a note) -> CHANGES_REQUESTED -> agent revises -> submit ...
//     -> admin unpublish / republish
//     -> close (sold / rented) -> CLOSED_SOLD | CLOSED_RENTED
//     -> archive / restore

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';
import { writeAudit } from '../../lib/audit.js';
import { logger } from '../../config/logger.js';

const isAdmin = (user) =>
  user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN');

// Each action: which statuses it is allowed from, what it moves to, and who may do it.
//   who: 'admin'      - administrators only
//        'agentOwner' - the listing's agent, or an admin
const ANY_LIVE = [
  'DRAFT',
  'CHANGES_REQUESTED',
  'PENDING_REVIEW',
  'PUBLISHED',
  'UNPUBLISHED',
  'CLOSED_SOLD',
  'CLOSED_RENTED',
];

export const ACTIONS = {
  submit: { from: ['DRAFT', 'CHANGES_REQUESTED'], to: 'PENDING_REVIEW', who: 'agentOwner', audit: 'listing.submitted', verb: 'submitted for review' },
  withdraw: { from: ['PENDING_REVIEW'], to: 'DRAFT', who: 'agentOwner', audit: 'listing.withdrawn', verb: 'withdrew the submission' },
  approve: { from: ['PENDING_REVIEW'], to: 'PUBLISHED', who: 'admin', audit: 'listing.approved', verb: 'approved and published' },
  'request-changes': { from: ['PENDING_REVIEW'], to: 'CHANGES_REQUESTED', who: 'admin', needsNote: true, audit: 'listing.changes_requested', verb: 'requested changes' },
  unpublish: { from: ['PUBLISHED'], to: 'UNPUBLISHED', who: 'admin', audit: 'listing.unpublished', verb: 'unpublished' },
  republish: { from: ['UNPUBLISHED'], to: 'PUBLISHED', who: 'admin', audit: 'listing.republished', verb: 'republished' },
  close: { from: ['PUBLISHED', 'UNPUBLISHED'], to: null, who: 'agentOwner', needsOutcome: true, audit: 'listing.closed', verb: 'closed' },
  archive: { from: ANY_LIVE, to: 'ARCHIVED', who: 'admin', audit: 'listing.archived', verb: 'archived' },
  restore: { from: ['ARCHIVED'], to: 'DRAFT', who: 'admin', audit: 'listing.restored', verb: 'restored to draft' },
};

// Property.status mirrors the listing so the search endpoint stays a simple filter.
const PROPERTY_STATUS_FOR = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
  ARCHIVED: 'ARCHIVED',
  CLOSED_SOLD: 'SOLD',
  CLOSED_RENTED: 'RENTED',
};

const LISTING_INCLUDE = {
  property: {
    select: {
      id: true,
      reference: true,
      title: true,
      listingMode: true,
      status: true,
      agentId: true,
      createdById: true,
    },
  },
  submittedBy: { select: { firstName: true, lastName: true } },
  reviewedBy: { select: { firstName: true, lastName: true } },
  statusHistory: {
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: { firstName: true, lastName: true } } },
  },
};

const name = (u) => (u ? `${u.firstName} ${u.lastName}` : null);

const shape = (l) => ({
  id: l.id,
  status: l.status,
  reviewNotes: l.reviewNotes,
  submittedAt: l.submittedAt,
  submittedBy: name(l.submittedBy),
  reviewedAt: l.reviewedAt,
  reviewedBy: name(l.reviewedBy),
  publishedAt: l.publishedAt,
  closedAt: l.closedAt,
  property: l.property && {
    id: l.property.id,
    reference: l.property.reference,
    title: l.property.title,
    listingMode: l.property.listingMode,
    status: l.property.status,
  },
  history: (l.statusHistory ?? []).map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    note: h.note,
    by: name(h.changedBy),
    at: h.createdAt,
  })),
});

// ---- read ----

export const listForStaff = async (user, query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where = {};
  const mineOnly = !isAdmin(user) || query.scope === 'mine';
  if (mineOnly) {
    where.property = {
      is: { OR: [{ agentId: user.agentId ?? '__none__' }, { createdById: user.id }] },
    };
  }
  if (query.status) where.status = query.status;

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            reference: true,
            title: true,
            listingMode: true,
            price: true,
            currency: true,
            agent: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const data = rows.map((l) => ({
    id: l.id,
    status: l.status,
    submittedAt: l.submittedAt,
    updatedAt: l.updatedAt,
    property: {
      id: l.property.id,
      reference: l.property.reference,
      title: l.property.title,
      listingMode: l.property.listingMode,
      price: l.property.price == null ? null : Number(l.property.price),
      currency: l.property.currency,
      agent: l.property.agent
        ? `${l.property.agent.user.firstName} ${l.property.agent.user.lastName}`
        : null,
    },
  }));

  return paginated(data, total, { page, pageSize });
};

// Loads a listing and checks the caller may see it.
const loadListing = async (user, listingId) => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: LISTING_INCLUDE,
  });
  if (!listing) throw ApiError.notFound('Listing not found');

  const owns =
    (user.agentId && listing.property.agentId === user.agentId) ||
    listing.property.createdById === user.id;
  const readAll = isAdmin(user) || user.roles.includes('PROPERTY_MANAGER');
  if (!readAll && !owns) throw ApiError.forbidden('This listing belongs to another agent');

  return listing;
};

export const getForStaff = async (user, listingId) => shape(await loadListing(user, listingId));

// ---- the workflow ----

export const runTransition = async (user, listingId, action, { note, outcome } = {}) => {
  const spec = ACTIONS[action];
  if (!spec) throw ApiError.badRequest(`Unknown action "${action}"`);

  const listing = await loadListing(user, listingId);
  const owns =
    (user.agentId && listing.property.agentId === user.agentId) ||
    listing.property.createdById === user.id;

  // Who may run this action?
  if (spec.who === 'admin' && !isAdmin(user)) {
    throw ApiError.forbidden('Only an administrator can do that');
  }
  if (spec.who === 'agentOwner' && !isAdmin(user) && !owns) {
    throw ApiError.forbidden('This listing belongs to another agent');
  }

  if (!spec.from.includes(listing.status)) {
    throw ApiError.badRequest(
      `Cannot ${action.replace('-', ' ')} a listing that is ${listing.status.toLowerCase()}`,
    );
  }
  if (spec.needsNote && !note) {
    throw ApiError.validation('Add a note explaining what needs to change', {
      fields: [{ field: 'note', message: 'Required' }],
    });
  }

  // Work out the target status.
  let toStatus = spec.to;
  if (action === 'close') {
    const mode = listing.property.listingMode;
    const chosen = outcome || (mode === 'RENT' ? 'RENTED' : 'SOLD');
    toStatus = chosen === 'RENTED' ? 'CLOSED_RENTED' : 'CLOSED_SOLD';
  }

  const now = new Date();
  const listingData = { status: toStatus };
  if (action === 'submit') {
    listingData.submittedById = user.id;
    listingData.submittedAt = now;
    listingData.reviewNotes = null; // clear the previous review note on resubmit
  }
  if (action === 'approve' || action === 'request-changes') {
    listingData.reviewedById = user.id;
    listingData.reviewedAt = now;
  }
  if (action === 'request-changes') listingData.reviewNotes = note;
  if (action === 'approve' || action === 'republish') {
    listingData.publishedAt = listing.publishedAt ?? now;
  }
  if (action === 'close') listingData.closedAt = now;

  const propertyData = { status: PROPERTY_STATUS_FOR[toStatus] };
  if (toStatus === 'PUBLISHED') {
    propertyData.publishedAt = listing.property.publishedAt ?? now;
  }

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: listingData }),
    prisma.property.update({ where: { id: listing.property.id }, data: propertyData }),
    prisma.listingStatusHistory.create({
      data: {
        listingId: listing.id,
        fromStatus: listing.status,
        toStatus,
        changedById: user.id,
        note: note || null,
      },
    }),
  ]);

  await writeAudit({
    req: { user },
    action: spec.audit,
    entityType: 'Listing',
    entityId: listing.id,
    summary: `${listing.property.reference}: ${spec.verb}`,
    metadata: note ? { note } : undefined,
  });

  // When a listing goes live, tell any saved search it now matches. Fire and
  // forget - a notification failure must not fail the approval.
  if (toStatus === 'PUBLISHED') {
    import('../savedSearches/savedSearches.service.js')
      .then((m) => m.notifyForNewListing(listing.property.id))
      .catch((err) => logger.error({ err }, 'Saved-search notify failed'));
  }

  return getForStaff(user, listing.id);
};
