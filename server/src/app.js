// Builds the Express app: middleware, health checks, API routes, error handling.
// Kept separate from server.js so tests can import the app without opening a port.

import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env, isTest, docsEnabled } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { apiRouter } from './routes/index.js';
import { openApiDocument } from './docs/swagger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  // How many reverse proxies to trust for the real client IP (rate limiting keys on it).
  app.set('trust proxy', env.TRUST_PROXY);

  // This API only ever returns JSON and the Swagger page; a Content-Security-Policy
  // on JSON does nothing, and the default one breaks Swagger UI. The browser app is
  // served separately (nginx) with its own CSP.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
        // Health checks are noise at info level.
        autoLogging: { ignore: (req) => req.url.startsWith('/health') },
      }),
    );
  }

  // Health checks - used by Docker, load balancers, and local sanity checks.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
  });
  app.get('/health/db', async (req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (err) {
      next(err);
    }
  });

  if (docsEnabled) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.use('/api', apiLimiter, apiRouter);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
};
