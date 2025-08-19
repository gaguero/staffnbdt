import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultTenant() {
  console.log('🏢 Creating default organization and property...');

  // Create default organization
  let organization = await prisma.organization.findFirst({
    where: { slug: 'nayara-group' }
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        id: 'org-nayara-group',
        name: 'Nayara Group',
        slug: 'nayara-group',
        description: 'Luxury hotel group specializing in eco-tourism and sustainable hospitality',
        contactEmail: 'admin@nayara.com',
        contactPhone: '+507-6000-0000',
        timezone: 'America/Panama',
        address: {
          street: 'Arenal Volcano National Park',
          city: 'La Fortuna',
          state: 'Alajuela',
          country: 'Costa Rica',
          zipCode: '21007'
        },
        settings: {
          multiLanguage: true,
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          allowCustomBranding: true
        },
        branding: {
          primaryColor: '#2D5A27',
          secondaryColor: '#8BC34A',
          logoUrl: 'https://nayara.com/logo.png'
        }
      }
    });
    console.log(`✅ Created organization: ${organization.name}`);
  } else {
    console.log(`ℹ️  Organization already exists: ${organization.name}`);
  }

  // Create default property
  let property = await prisma.property.findFirst({
    where: { slug: 'nayara-gardens' }
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        id: 'prop-nayara-gardens',
        organizationId: organization.id,
        name: 'Nayara Gardens',
        slug: 'nayara-gardens',
        description: 'Luxury eco-resort with stunning views of Arenal Volcano',
        propertyType: 'RESORT',
        address: {
          street: 'Arenal Volcano National Park',
          city: 'La Fortuna',
          state: 'Alajuela',
          country: 'Costa Rica',
          zipCode: '21007'
        },
        timezone: 'America/Panama',
        phoneNumber: '+507-6000-0000',
        email: 'reservations@nayara.com',
        website: 'https://nayara.com',
        settings: {
          roomCount: 50,
          checkInTime: '15:00',
          checkOutTime: '11:00',
          currency: 'USD',
          taxRate: 0.13
        },
        branding: {
          primaryColor: '#2D5A27',
          secondaryColor: '#8BC34A',
          accentColor: '#FFC107'
        }
      }
    });
    console.log(`✅ Created property: ${property.name}`);
  } else {
    console.log(`ℹ️  Property already exists: ${property.name}`);
  }

  console.log('\n📊 Default Tenant Summary:');
  console.log(`  - Organization: ${organization.name} (${organization.slug})`);
  console.log(`  - Property: ${property.name} (${property.slug})`);
  console.log('✅ Default tenant creation completed!');

  return { organization, property };
}

createDefaultTenant()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Default tenant creation failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });