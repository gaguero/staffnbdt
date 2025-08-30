// Ensure we point to the dev Railway database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway';

// Use the Prisma client generated in the database package to avoid version mismatches
const { PrismaClient } = require('./packages/database/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetUserId = 'cmexi3bjr00an2gqop5z9smc3'; // Dev user from logs

  const required = [
    { resource: 'module', action: 'read', scope: 'organization', name: 'module.read.organization', category: 'system' },
    { resource: 'unit', action: 'read', scope: 'property', name: 'unit.read.property', category: 'hotel_operations' },
    { resource: 'guest', action: 'read', scope: 'property', name: 'guest.read.property', category: 'hotel_operations' },
    { resource: 'reservation', action: 'read', scope: 'property', name: 'reservation.read.property', category: 'hotel_operations' },
  ];

  console.log('Granting minimal read permissions to user:', targetUserId);

  // sanity check target user exists
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new Error(`Target user not found: ${targetUserId}`);
  }

  const ensured = [];
  for (const p of required) {
    // Use the compound unique key resource_action_scope when available
    let perm = await prisma.permission.findUnique({
      where: {
        resource_action_scope: {
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        },
      },
    });

    if (!perm) {
      console.log(`Creating missing permission: ${p.name}`);
      perm = await prisma.permission.create({
        data: {
          name: p.name,
          resource: p.resource,
          action: p.action,
          scope: p.scope,
          description: `${p.action} ${p.resource} within ${p.scope}`,
          category: p.category,
          isSystem: true,
        },
      });
    }
    ensured.push(perm);
  }

  let created = 0;
  for (const perm of ensured) {
    try {
      await prisma.userPermission.create({
        data: {
          userId: targetUserId,
          permissionId: perm.id,
          granted: true,
          isActive: true,
          grantedBy: 'system',
        },
      });
      console.log(`✓ Granted ${perm.name}`);
      created++;
    } catch (err) {
      if (err && err.code === 'P2002') {
        console.log(`- Already granted: ${perm.name}`);
      } else {
        console.log(`✗ Failed to grant ${perm.name}: ${err.message}`);
      }
    }
  }

  // Clear permission cache for this user if present
  try {
    await prisma.permissionCache.deleteMany({ where: { userId: targetUserId } });
    console.log('Cleared permission cache for user');
  } catch (e) {
    console.log('Permission cache table not present or cleanup failed:', e.message);
  }

  console.log(`Done. Newly created grants: ${created}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


