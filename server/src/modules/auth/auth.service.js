// Authentication logic: create accounts, verify credentials, issue and rotate tokens.
// No req/res in here - the controller handles HTTP.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  createRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from '../../lib/tokens.js';

// Loads a user with their roles flattened into plain string arrays for the JWT,
// plus their agent / customer ids so authorization checks do not need extra lookups.
const loadAuthUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
      agent: { select: { id: true, organizationId: true } },
      customer: { select: { id: true } },
    },
  });
  if (!user) throw ApiError.unauthorized();

  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = [
    ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
  ];
  return {
    user,
    roles,
    permissions,
    agentId: user.agent?.id ?? null,
    customerId: user.customer?.id ?? null,
    organizationId: user.agent?.organizationId ?? null,
  };
};

// The user shape safe to send to the client (no password hash).
const publicUser = (user, roles) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  status: user.status,
  roles,
  agentId: user.agent?.id ?? null, // set when the user is an agent
});

// Issues a fresh access + refresh token pair and stores the refresh hash.
const issueSession = async ({ userId, req }) => {
  const { user, roles, permissions, agentId, customerId, organizationId } =
    await loadAuthUser(userId);

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    roles,
    permissions,
    agentId,
    customerId,
    organizationId,
  });
  const { raw, tokenHash } = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refreshTokenExpiry(),
      userAgent: req?.headers['user-agent']?.slice(0, 255) ?? null,
      ip: req?.ip ?? null,
    },
  });

  return { accessToken, refreshToken: raw, user: publicUser(user, roles) };
};

export const register = async ({ email, password, firstName, lastName, phone }, req) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!customerRole) {
    throw new ApiError(500, 'The CUSTOMER role is missing. Run: npm run db:seed');
  }

  // New public sign-ups are always customers. Staff accounts are created by an admin.
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: phone || null,
      roles: { create: { roleId: customerRole.id } },
      customer: { create: {} },
    },
  });

  return issueSession({ userId: user.id, req });
};

export const login = async ({ email, password }, req) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message whether the email is unknown or the password is wrong.
  if (!user) throw ApiError.unauthorized('Email or password is incorrect');

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw ApiError.unauthorized('Email or password is incorrect');
  if (user.status === 'SUSPENDED') throw ApiError.forbidden('This account is suspended');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return issueSession({ userId: user.id, req });
};

// Rotating refresh: the presented token is revoked and a new pair issued.
export const refresh = async (rawToken, req) => {
  if (!rawToken) throw ApiError.unauthorized('No session to refresh');

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Your session has expired, please sign in again');
  }

  // A token that was already rotated is being replayed - treat it as theft and
  // revoke every session for that user.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Your session has expired, please sign in again');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  return issueSession({ userId: stored.userId, req });
};

export const logout = async (rawToken) => {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const me = async (userId) => {
  const { user, roles } = await loadAuthUser(userId);
  return publicUser(user, roles);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  const ok = await verifyPassword(user.passwordHash, currentPassword);
  if (!ok) throw ApiError.badRequest('Your current password is not correct');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  // Sign out every other session; the current one refreshes on its own.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
