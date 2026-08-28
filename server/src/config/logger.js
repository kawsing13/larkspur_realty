// Structured logging with pino. In development it prints readable lines; in
// production it emits JSON for a log collector.

import pino from 'pino';
import { env, isProd, isTest } from './env.js';

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  transport: isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
  redact: {
    // Never log tokens, cookies, or passwords, wherever they appear.
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.currentPassword',
      '*.newPassword',
      '*.temporaryPassword',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[redacted]',
  },
});
