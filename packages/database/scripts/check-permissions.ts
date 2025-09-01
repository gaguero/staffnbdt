import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  console.log('🔍 Checking permission structure...');

  try {
    // Get sample permissions to see structure
    const sample = await prisma.permission.findMany({ 
      take: 5,
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\nSample permissions:');
    sample.forEach(p => {
      console.log(`  Resource: ${p.resource}, Action: ${p.action}, Scope: ${p.scope}`);
      console.log(`  Full key: ${p.resource}.${p.action}.${p.scope}`);
    });

    // Check concierge permissions specifically
    const conciergePerms = await prisma.permission.findMany({ 
      where: { resource: 'concierge' }
    });
    
    console.log(`\nFound ${conciergePerms.length} concierge permissions:`);
    conciergePerms.forEach(p => {
      console.log(`  ${p.resource}.${p.action}.${p.scope} - ${p.name}`);
    });

    // Check vendors permissions
    const vendorsPerms = await prisma.permission.findMany({ 
      where: { resource: 'vendors' }
    });
    
    console.log(`\nFound ${vendorsPerms.length} vendors permissions:`);
    vendorsPerms.forEach(p => {
      console.log(`  ${p.resource}.${p.action}.${p.scope} - ${p.name}`);
    });

    // Test specific permission lookups that the controller is expecting
    const testKeys = [
      'concierge.object-types.read.property',
      'concierge.objects.read.property',
      'concierge.objects.create.property',
      'vendors.read.property',
      'vendors.links.confirm.property'
    ];

    console.log('\n🧪 Testing controller permission lookups:');
    for (const key of testKeys) {
      const [resource, action, scope] = key.split('.');
      const found = await prisma.permission.findFirst({
        where: { resource, action, scope }
      });
      console.log(`  ${found ? '✅' : '❌'} ${key} (${resource}|${action}|${scope})`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  }
}

async function main() {
  await checkPermissions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Check failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });