// One shared PrismaClient for the whole process. Creating more than one opens
// extra connection pools and leads to "too many connections" during dev reloads.

import { PrismaClient } from '@prisma/client';
import { isProd } from './env.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['error', 'warn'],
  });

// Reuse the instance across nodemon restarts in development.
if (!isProd) globalForPrisma.__prisma = prisma;
