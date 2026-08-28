// Role- and permission-based access control. Always runs after `authenticate`.
//
//   router.post('/', authenticate, authorize('property:create'), controller.create);
//   router.post('/:id/approve', authenticate, authorize.role('ADMINISTRATOR'), controller.approve);
//
// SUPER_ADMIN passes every check.

import { ApiError } from '../lib/ApiError.js';

const includes = (list, value) => Array.isArray(list) && list.includes(value);

// Require ALL of the given permission keys.
export const authorize = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (includes(req.user.roles, 'SUPER_ADMIN')) return next();

  const ok = requiredPermissions.every((p) => includes(req.user.permissions, p));
  if (!ok) return next(ApiError.forbidden('You do not have permission to do that'));
  next();
};

// Require ANY of the given role names.
authorize.role = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (includes(req.user.roles, 'SUPER_ADMIN')) return next();

  const ok = allowedRoles.some((r) => includes(req.user.roles, r));
  if (!ok) return next(ApiError.forbidden('Your role cannot access this'));
  next();
};
