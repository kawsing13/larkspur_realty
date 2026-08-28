// Reads the Bearer access token, verifies it, and attaches the caller to req.user.
//
//   authenticate   - require a signed-in user (401 otherwise)
//   optionalAuth   - attach req.user if a valid token is present, else req.user = null
//                    (use on public routes that change when someone is signed in)

import { ApiError } from '../lib/ApiError.js';
import { verifyAccessToken } from '../lib/tokens.js';

const readBearer = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const decodeUser = (req) => {
  const token = readBearer(req);
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      agentId: payload.agentId || null,
      customerId: payload.customerId || null,
      organizationId: payload.organizationId || null,
    };
  } catch {
    return null; // expired or tampered
  }
};

export const authenticate = (req, res, next) => {
  const user = decodeUser(req);
  if (!user) return next(ApiError.unauthorized('Sign in to continue'));
  req.user = user;
  next();
};

export const optionalAuth = (req, res, next) => {
  req.user = decodeUser(req);
  next();
};
