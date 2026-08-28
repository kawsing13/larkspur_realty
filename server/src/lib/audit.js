// Records a row in the audit log. Call it after a sensitive change: listing
// approvals, account changes, lead assignments, property price/status changes.
//
//   await writeAudit({
//     req,
//     action: 'listing.approved',
//     entityType: 'Listing',
//     entityId: listing.id,
//     summary: `Approved ${property.reference}`,
//   });

import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

export const writeAudit = async ({ req, actorId, action, entityType, entityId, summary, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? req?.user?.id ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        summary,
        metadata: metadata ?? undefined,
        ip: req?.ip ?? null,
      },
    });
  } catch (err) {
    // Auditing must never break the operation it is recording. Log and continue.
    logger.error({ err, action }, 'Failed to write audit log');
  }
};
