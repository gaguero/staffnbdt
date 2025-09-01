import { PrismaClient } from '@prisma/client';

// Use Railway DATABASE_URL from environment or set it directly
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function updateHRModuleToOptional() {
  try {
    console.log('🚀 Updating HR module to be optional...');

    // Update HR module to be optional (not a system module)
    const hrModule = await prisma.moduleManifest.update({
      where: { moduleId: 'hr' },
      data: {
        isSystemModule: false,
        description: 'Optional employee HR services: Payroll, Vacation, Training, Benefits'
      }
    });

    console.log('✅ HR module updated to optional');
    console.log(`   - isSystemModule: ${hrModule.isSystemModule}`);
    console.log(`   - description: ${hrModule.description}`);

    // Ensure HR module is enabled for existing organizations that were using it
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true }
    });

    for (const org of organizations) {
      // Check if HR subscription already exists
      const existingSubscription = await prisma.moduleSubscription.findFirst({
        where: {
          organizationId: org.id,
          moduleName: 'hr',
          propertyId: null // Organization-level subscription
        }
      });

      if (!existingSubscription) {
        // Create HR subscription for organizations that don't have it
        await prisma.moduleSubscription.create({
          data: {
            organizationId: org.id,
            moduleName: 'hr',
            propertyId: null,
            isEnabled: true,
            enabledAt: new Date()
          }
        });
        console.log(`✅ Enabled HR module for organization: ${org.name}`);
      } else {
        console.log(`ℹ️  HR module already configured for: ${org.name}`);
      }
    }

    console.log('🎉 HR module migration completed successfully!');
    console.log('📊 HR module is now:');
    console.log('  - Optional (can be enabled/disabled per organization)');
    console.log('  - Includes: Payroll, Vacation, Training, Benefits');
    console.log('  - Backward compatible (enabled for existing organizations)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
updateHRModuleToOptional();