import { asyncHandler } from '../../lib/asyncHandler.js';
import { writeAudit } from '../../lib/audit.js';
import * as usersService from './users.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await usersService.listUsers(req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ user: await usersService.getUser(req.params.id) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const user = await usersService.setUserStatus(req.params.id, req.body.status);
  await writeAudit({
    req,
    action: 'user.status_changed',
    entityType: 'User',
    entityId: user.id,
    summary: `Set ${user.email} to ${user.status}`,
  });
  res.json({ user });
});
