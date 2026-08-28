// Creates (or promotes) an administrator account. Used once after the first
// production deploy, since there is no public sign-up for staff.
//
//   node server/prisma/scripts/create-admin.js <email> <password> <firstName> <lastName>

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/lib/password.js';

const [, , email, password, firstName = 'Admin', lastName = 'User'] = process.argv;

if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password> [firstName] [lastName]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const prisma = new PrismaClient();

const run = async () => {
  const role = await prisma.role.findUnique({ where: { name: 'ADMINISTRATOR' } });
  if (!role) {
    throw new Error('Roles are not seeded. Run: node server/prisma/scripts/seed-rbac.js');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  console.log(`Administrator ready: ${user.email}`);
};

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
