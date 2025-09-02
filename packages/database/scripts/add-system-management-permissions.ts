import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const railwayDatabaseUrl = process.env.DATABASE_URL;
if (!railwayDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: railwayDatabaseUrl
    }
  }
});

async function addSystemManagementPermissions() {
  console.log('🏛️ Adding System Management and Navigation Permissions...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    
    // List of system management and navigation permissions that are missing
    const systemPermissions = [
      // System management permissions for navigation
      'system.manage.departments',
      'system.manage.organizations', 
      'system.manage.properties',
      'system.manage.roles',
      
      // Concierge module permissions
      'concierge.read.property',
      'concierge.create.property',
      'concierge.update.property',
      'concierge.delete.property',
      'concierge.objects.read.property',
      'concierge.objects.create.property',
      'concierge.objects.update.property',
      'concierge.objects.complete.property',
      'concierge.playbooks.manage.property',
      'concierge.playbooks.execute.property',
      'concierge.object-types.read.property',
      
      // Vendors module permissions  
      'vendors.read.property',
      'vendors.create.property',
      'vendors.update.property',
      'vendors.delete.property',
      'vendors.manage.property',
      'vendors.links.confirm.property',
      
      // Additional administrative permissions
      'department.read.organization',
      'department.create.organization', 
      'department.update.organization',
      'department.delete.organization',
      
      // Analytics and reporting
      'analytics.view.department',
      'analytics.view.property',
      'analytics.view.organization'
    ];

    console.log(`👤 User: ${userId}`);
    console.log(`🔑 Adding ${systemPermissions.length} system management permissions...`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const permissionKey of systemPermissions) {
      try {
        const [resource, action, scope] = permissionKey.split('.');
        
        // Find the permission in the database
        const permission = await prisma.permission.findFirst({
          where: {
            resource,
            action, 
            scope
          }
        });

        if (!permission) {
          console.log(`⚠️  Permission ${permissionKey} does not exist in database - creating it...`);
          
          // Create the permission if it doesn't exist
          const newPermission = await prisma.permission.create({
            data: {
              resource,
              action,
              scope,
              name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource} (${scope})`,
              description: `Permission to ${action} ${resource} at ${scope} level`,
              category: getPermissionCategory(resource),
              isSystem: true
            }
          });
          
          console.log(`✅ Created permission: ${permissionKey}`);
          
          // Grant it to the user
          await prisma.userPermission.create({
            data: {
              userId,
              permissionId: newPermission.id,
              granted: true,
              grantedBy: userId,
              isActive: true
            }
          });
          
          addedCount++;
          continue;
        }

        // Check if user already has this permission
        const existingUserPermission = await prisma.userPermission.findFirst({
          where: {
            userId,
            permissionId: permission.id,
            isActive: true
          }
        });

        if (existingUserPermission) {
          if (existingUserPermission.granted) {
            console.log(`✓ User already has: ${permissionKey}`);
            skippedCount++;
          } else {
            // Update denied permission to granted
            await prisma.userPermission.update({
              where: { id: existingUserPermission.id },
              data: { granted: true }
            });
            console.log(`🔄 Updated ${permissionKey} from DENIED to GRANTED`);
            addedCount++;
          }
        } else {
          // Grant new permission to user
          await prisma.userPermission.create({
            data: {
              userId,
              permissionId: permission.id,
              granted: true,
              grantedBy: userId,
              isActive: true
            }
          });
          console.log(`✅ Added: ${permissionKey}`);
          addedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${permissionKey}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  - Added/Updated: ${addedCount}`);
    console.log(`  - Already had: ${skippedCount}`);
    console.log(`  - Errors: ${errorCount}`);

    // Get final permission count
    const finalPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        granted: true,
        isActive: true
      },
      include: {
        permission: true
      }
    });

    console.log(`\n🎉 User now has ${finalPermissions.length} total permissions!`);
    console.log('✅ System management and navigation permissions added successfully');
    console.log('🔄 Please refresh the page to see all menu items');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getPermissionCategory(resource: string): string {
  const categoryMap: Record<string, string> = {
    'system': 'System Administration',
    'department': 'Human Resources', 
    'concierge': 'Hotel Operations',
    'vendors': 'Hotel Operations',
    'analytics': 'Reports & Analytics'
  };
  
  return categoryMap[resource] || 'System';
}

addSystemManagementPermissions().catch(console.error);