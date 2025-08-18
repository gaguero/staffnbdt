const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndCreateBaseData() {
  console.log('🔍 Checking for base organization and property...');

  try {
    // Check for organization
    let organization = await prisma.organization.findFirst({
      where: { slug: 'nayara-group' }
    });

    if (!organization) {
      console.log('Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Nayara Group',
          slug: 'nayara-group',
          description: 'Luxury resort and hospitality group',
          contactEmail: 'info@nayara.com',
          contactPhone: '+507-6000-0000',
          website: 'https://nayara.com',
          timezone: 'America/Panama',
          isActive: true
        }
      });
      console.log(`✅ Created organization: ${organization.name}`);
    } else {
      console.log(`ℹ️  Organization exists: ${organization.name}`);
    }

    // Check for property
    let property = await prisma.property.findFirst({
      where: { slug: 'nayara-gardens' }
    });

    if (!property) {
      console.log('Creating default property...');
      property = await prisma.property.create({
        data: {
          organizationId: organization.id,
          name: 'Nayara Gardens',
          slug: 'nayara-gardens',
          description: 'Luxury eco-resort in Costa Rica',
          propertyType: 'RESORT',
          timezone: 'America/Costa_Rica',
          phoneNumber: '+506-2479-1600',
          email: 'reservations@nayara.com',
          website: 'https://nayara.com/nayara-gardens',
          isActive: true
        }
      });
      console.log(`✅ Created property: ${property.name}`);
    } else {
      console.log(`ℹ️  Property exists: ${property.name}`);
    }

    console.log('✅ Base data check completed');
    return { organization, property };

  } catch (error) {
    console.error('❌ Error checking/creating base data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndCreateBaseData()
    .then(() => {
      console.log('🏁 Base data setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Base data setup failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndCreateBaseData };