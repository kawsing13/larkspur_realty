// Read-only user administration for Phase 1 (list, view, suspend/reactivate).
// Full staff-account creation and role editing lands with the admin portal.

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { parsePagination, paginated } from '../../lib/pagination.js';

const shape = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: u.phone,
  status: u.status,
  roles: u.roles.map((r) => r.role.name),
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
});

export const listUsers = async (query) => {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where = {};
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.role) {
    where.roles = { some: { role: { name: query.role } } };
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { roles: { include: { role: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(rows.map(shape), total, { page, pageSize });
};

export const getUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw ApiError.notFound('User not found');
  return shape(user);
};

export const setUserStatus = async (id, status) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('User not found');

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    include: { roles: { include: { role: true } } },
  });

  // When suspending, drop active sessions so access ends immediately.
  if (status === 'SUSPENDED') {
    await prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return shape(user);
};
