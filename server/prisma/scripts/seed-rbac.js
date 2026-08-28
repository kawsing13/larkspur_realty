// Seeds only the roles and permissions - no demo data. Safe for production.
// Run once after the first deploy (before create-admin.js).
//
//   node server/prisma/scripts/seed-rbac.js

import { PrismaClient } from '@prisma/client';
import { seedRbac } from '../rbac.js';

const prisma = new PrismaClient();

seedRbac(prisma)
  .then(() => console.log('Roles and permissions are set.'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
