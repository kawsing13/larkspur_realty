// Entry point: starts the HTTP server, prepares object storage, handles clean shutdown.

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { ensureBuckets } from './lib/storage.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database reachable');
  } catch (err) {
    logger.error({ err }, 'Database is not reachable - check DATABASE_URL');
  }

  try {
    await ensureBuckets();
    logger.info('Storage buckets ready');
  } catch (err) {
    logger.warn({ err }, 'Storage not ready - uploads will fail until it recovers');
  }
});

// Clean shutdown: stop accepting connections, release the DB pool, then exit.
// If it hangs, force-exit after 10s so an orchestrator can restart us.
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);

  const force = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();

  server.close(async () => {
    clearTimeout(force);
    await prisma.$disconnect();
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

// Last-resort handlers: log and let the orchestrator restart a broken process.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception - exiting');
  process.exit(1);
});
