import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { prisma } from '../../config/prisma.js';
import { parsePagination, paginated } from '../../lib/pagination.js';

// A read-only view of the audit trail: listing approvals, account changes, lead
// assignments, document uploads, property status changes.

export const auditLogsRouter = Router();
auditLogsRouter.use(authenticate, authorize('audit:read'));

const listSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    entityType: z.string().trim().min(1).optional(),
    action: z.string().trim().min(1).optional(),
  }),
};

auditLogsRouter.get(
  '/',
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const where = {};
    if (req.query.entityType) where.entityType = req.query.entityType;
    if (req.query.action) where.action = { contains: req.query.action, mode: 'insensitive' };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.summary,
      actor: r.actor ? `${r.actor.firstName} ${r.actor.lastName}` : 'System',
      ip: r.ip,
      createdAt: r.createdAt,
    }));

    res.json(paginated(data, total, { page, pageSize }));
  }),
);
