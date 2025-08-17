#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDefaultTenant() {
  console.log('🌱 Seeding default organization and property for multi-tenant migration...');
  
  try {
    // Check if we already have organizations
    const existingOrgs = await prisma.organization.count();
    if (existingOrgs > 0) {
      console.log('✅ Organizations already exist, skipping seed');
      return;
    }

    // Create default organization
    console.log('📝 Creating default organization...');
    const defaultOrg = await prisma.organization.create({
      data: {
        name: 'Nayara Group',
        slug: 'nayara-group',
        description: 'Default organization for Hotel Operations Hub',
        timezone: 'America/Costa_Rica',
        settings: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'es'],
          theme: 'nayara'
        },
        branding: {
          primaryColor: '#AA8E67',
          secondaryColor: '#F5EBD7',
          accentColor: '#4A4A4A',
          logoUrl: null
        },
        isActive: true
      }
    });
    console.log(`✅ Created organization: ${defaultOrg.name} (${defaultOrg.id})`);

    // Create default property
    console.log('🏨 Creating default property...');
    const defaultProperty = await prisma.property.create({
      data: {
        organizationId: defaultOrg.id,
        name: 'Nayara Gardens',
        slug: 'nayara-gardens',
        description: 'Default property for Hotel Operations Hub',
        propertyType: 'RESORT',
        timezone: 'America/Costa_Rica',
        settings: {
          modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'],
          defaultDepartments: ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Administration']
        },
        branding: {
          inherit: true // Inherit from organization
        },
        isActive: true
      }
    });
    console.log(`✅ Created property: ${defaultProperty.name} (${defaultProperty.id})`);

    // Update existing users to belong to the default organization and property
    console.log('👥 Updating existing users...');
    const userUpdateResult = await prisma.user.updateMany({
      where: {
        organizationId: null
      },
      data: {
        organizationId: defaultOrg.id,
        propertyId: defaultProperty.id
      }
    });
    console.log(`✅ Updated ${userUpdateResult.count} users`);

    // Update existing departments to belong to the default property
    console.log('🏢 Updating existing departments...');
    const deptUpdateResult = await prisma.department.updateMany({
      where: {
        propertyId: null
      },
      data: {
        propertyId: defaultProperty.id
      }
    });
    console.log(`✅ Updated ${deptUpdateResult.count} departments`);

    // Update all other tables
    const tables = [
      'document', 'payslip', 'vacation', 'trainingSession', 
      'commercialBenefit', 'notification', 'invitation', 'auditLog'
    ];

    for (const table of tables) {
      console.log(`📄 Updating existing ${table} records...`);
      try {
        const result = await prisma[table].updateMany({
          where: {
            propertyId: null
          },
          data: {
            propertyId: defaultProperty.id
          }
        });
        console.log(`✅ Updated ${result.count} ${table} records`);
      } catch (error) {
        console.log(`⚠️  ${table} table might not exist yet: ${error.message}`);
      }
    }

    // Create default module subscriptions
    console.log('📦 Creating default module subscriptions...');
    const modules = [
      'HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 
      'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY'
    ];

    for (const moduleName of modules) {
      try {
        await prisma.moduleSubscription.create({
          data: {
            organizationId: defaultOrg.id,
            moduleName,
            isEnabled: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'].includes(moduleName),
            enabledAt: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS'].includes(moduleName) ? new Date() : null,
            settings: {}
          }
        });
        console.log(`✅ Created module subscription: ${moduleName}`);
      } catch (error) {
        console.log(`⚠️  Module ${moduleName} already exists: ${error.message}`);
      }
    }

    console.log('\n🎉 Default tenant seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Organization: ${defaultOrg.name}`);
    console.log(`   - Property: ${defaultProperty.name}`);
    console.log(`   - Users updated: ${userUpdateResult.count}`);
    console.log(`   - Departments updated: ${deptUpdateResult.count}`);

  } catch (error) {
    console.error('❌ Error seeding default tenant:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultTenant()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDefaultTenant };