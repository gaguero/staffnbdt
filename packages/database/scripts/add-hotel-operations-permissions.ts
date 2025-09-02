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

async function addHotelOperationsPermissions() {
  console.log('🏨 Adding Hotel Operations Permissions...');
  
  try {
    const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
    
    // List of hotel operations permissions that are missing
    const hotelPermissions = [
      // Reservation permissions
      'reservation.read.property',
      'reservation.create.property', 
      'reservation.update.property',
      'reservation.delete.property',
      'reservation.checkin.property',
      'reservation.checkout.property',
      'reservation.cancel.property',
      
      // Guest permissions
      'guest.read.property',
      'guest.create.property',
      'guest.update.property', 
      'guest.delete.property',
      'guest.profile.property',
      
      // Unit (Room) permissions
      'unit.read.property',
      'unit.create.property',
      'unit.update.property',
      'unit.delete.property',
      'unit.status.property',
      'unit.maintenance.property',
      
      // Additional property-level permissions
      'property.read.organization',
      'property.update.organization',
      'organization.read.organization',
      
      // Analytics permissions
      'analytics.read.property',
      'analytics.revenue.property',
      
      // Reporting permissions  
      'report.create.property',
      'report.read.property',
      
      // Admin permissions for comprehensive access
      'audit.read.property',
      'setting.read.property',
      'setting.update.property'
    ];

    console.log(`👤 User: ${userId}`);
    console.log(`🔑 Adding ${hotelPermissions.length} hotel operations permissions...`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const permissionKey of hotelPermissions) {
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
              category: 'Hotel Operations',
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
    console.log('✅ Hotel operations permissions added successfully');
    console.log('🔄 Please refresh the page to see all menu items');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHotelOperationsPermissions().catch(console.error);