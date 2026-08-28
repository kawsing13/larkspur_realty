import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { prisma } from '../../config/prisma.js';

// Notifications are written by other modules (lead assigned, viewing updated,
// saved-search match). These endpoints let the owner read and clear them.

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
    ]);
    res.json({
      data: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  }),
);

notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.status(204).end();
  }),
);

notificationsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { readAt: new Date() },
    });
    res.status(204).end();
  }),
);
