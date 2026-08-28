import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.validation.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
// /refresh is gated by the httpOnly cookie, not a password, so it only gets the
// general API limiter (applied in app.js), not the strict auth one - otherwise a
// user opening several tabs would lock themselves out.
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
