// Translates HTTP <-> the auth service. The refresh token travels in an httpOnly
// cookie so browser JavaScript (and any XSS) cannot read it. The access token is
// returned in the body for the client to hold in memory.

import { asyncHandler } from '../../lib/asyncHandler.js';
import { env, isProd } from '../../config/env.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'rems_refresh';

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // sameSite 'none' requires 'secure'; a cross-domain deploy sets both.
    secure: isProd || env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    path: '/api/auth', // only sent back to the auth routes
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
};

export const register = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.register(req.body, req);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body, req);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.refresh(
    req.cookies?.[REFRESH_COOKIE],
    req,
  );
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await authService.me(req.user.id) });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.status(204).end();
});
