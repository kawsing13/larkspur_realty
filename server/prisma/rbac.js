// The roles and permissions the application needs to run. Shared by the full
// seed (dev / demo) and by scripts/seed-rbac.js (safe to run in production).

// Permission keys are "<resource>:<action>". Middleware checks these exact strings.
export const PERMISSIONS = [
  ['property:read', 'View properties in a portal'],
  ['property:create', 'Create a property'],
  ['property:update', 'Edit a property'],
  ['property:delete', 'Archive or delete a property'],
  ['property:publish', 'Publish, unpublish, or return a property to draft'],
  ['listing:read', 'View listing workflow state'],
  ['listing:submit', 'Submit a listing for review'],
  ['listing:review', 'Request changes on a listing'],
  ['listing:approve', 'Approve or reject a listing'],
  ['listing:publish', 'Publish or unpublish a listing'],
  ['inquiry:read', 'View inquiries and leads'],
  ['inquiry:update', 'Update lead status, notes, follow-ups'],
  ['inquiry:assign', 'Assign a lead to an agent'],
  ['appointment:read', 'View appointments'],
  ['appointment:manage', 'Confirm, reschedule, cancel, complete appointments'],
  ['agent:read', 'View agent profiles'],
  ['agent:manage', 'Create and edit agent accounts'],
  ['user:read', 'View user accounts'],
  ['user:manage', 'Create, suspend, and edit user accounts'],
  ['report:read', 'View dashboards and reports'],
  ['audit:read', 'View the audit log'],
  ['organization:manage', 'Manage branches / organizations and settings'],
];

export const ROLES = {
  SUPER_ADMIN: {
    description: 'Full system access, including roles, permissions, and organizations.',
    permissions: '*', // middleware also bypasses checks for this role
  },
  ADMINISTRATOR: {
    description: 'Runs day-to-day operations: properties, agents, approvals, reports.',
    permissions: [
      'property:read', 'property:create', 'property:update', 'property:delete', 'property:publish',
      'listing:read', 'listing:review', 'listing:approve', 'listing:publish',
      'inquiry:read', 'inquiry:update', 'inquiry:assign',
      'appointment:read', 'appointment:manage',
      'agent:read', 'agent:manage',
      'user:read', 'user:manage',
      'report:read', 'audit:read',
    ],
  },
  AGENT: {
    description: 'Manages own listings and leads.',
    permissions: [
      'property:read', 'property:create', 'property:update',
      'listing:read', 'listing:submit',
      'inquiry:read', 'inquiry:update',
      'appointment:read', 'appointment:manage',
      'agent:read',
    ],
  },
  PROPERTY_MANAGER: {
    description: 'Monitors assigned properties, documents, and appointments (mostly read-only).',
    permissions: ['property:read', 'listing:read', 'inquiry:read', 'appointment:read', 'report:read'],
  },
  CUSTOMER: {
    description: 'Public site user: search, favorites, inquiries, appointment requests.',
    permissions: [], // customer actions are gated by ownership, not permission keys
  },
};

// Upserts every permission and role, and resets each role's permission set to
// exactly what is configured above.
export async function seedRbac(prisma) {
  const permissionByKey = {};
  for (const [key, description] of PERMISSIONS) {
    permissionByKey[key] = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  const roleByName = {};
  for (const [name, cfg] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: cfg.description },
      create: { name, description: cfg.description },
    });
    roleByName[name] = role;

    const keys = cfg.permissions === '*' ? PERMISSIONS.map(([k]) => k) : cfg.permissions;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (keys.length > 0) {
      await prisma.rolePermission.createMany({
        data: keys.map((k) => ({ roleId: role.id, permissionId: permissionByKey[k].id })),
        skipDuplicates: true,
      });
    }
  }

  return { permissionByKey, roleByName };
}
