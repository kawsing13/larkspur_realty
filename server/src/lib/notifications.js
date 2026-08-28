// Writes an in-app notification row for a user. The endpoints that list and mark
// notifications as read arrive in Phase 7; until then this just records them.
//
//   await notify({ userId: agentUserId, type: 'INQUIRY_ASSIGNED',
//                  title: 'New lead', body: '...', data: { inquiryId } });

import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

export const notify = async ({ userId, type = 'SYSTEM', title, body, data }) => {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data: data ?? undefined },
    });
  } catch (err) {
    // A failed notification must not break the action that triggered it.
    logger.error({ err, type }, 'Failed to write notification');
  }
};
