// JSON Web Tokens for authentication.
//
//   access token  - short-lived (15m), sent in the Authorization header, stateless.
//   refresh token - long-lived (7d), a random string. We store only its SHA-256 hash
//                   in the DB; the raw value lives in an httpOnly cookie and is rotated
//                   on every use, so a stolen token has a short window.

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles, // array of role names
      permissions: user.permissions, // array of permission keys
      agentId: user.agentId ?? null, // set when the user is an agent
      customerId: user.customerId ?? null, // set when the user is a customer
      organizationId: user.organizationId ?? null, // the agent's branch
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL },
  );

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

export const createRefreshToken = () => {
  const raw = crypto.randomBytes(48).toString('hex');
  return { raw, tokenHash: hashToken(raw) };
};

export const refreshTokenExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return d;
};
