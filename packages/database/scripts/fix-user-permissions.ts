import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fixing user permissions for Concierge and Vendors...');
  
  // Get the user ID from the logs (cmf0gg0wn000elzp5l9dzkzs1)
  const userId = 'cmf0gg0wn000elzp5l9dzkzs1';
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userCustomRoles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      },
      userPermissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('👤 User:', user.email, 'Role:', user.role);
  console.log('🏢 Organization:', user.organizationId);
  console.log('🏨 Property:', user.propertyId);
  
  // Add the missing permissions directly to the user
  const requiredPermissions = [
    'concierge.read.property',
    'concierge.create.property',
    'concierge.update.property',
    'concierge.complete.property',
    'concierge.execute.property',
    'vendors.read.property',
    'vendors.create.property',
    'vendors.update.property'
  ];
  
  for (const permKey of requiredPermissions) {
    const [resource, action, scope] = permKey.split('.');
    
    const permission = await prisma.permission.findFirst({
      where: { 
        resource: resource,
        action: action,
        scope: scope
      }
    });
    
    if (permission) {
      const existing = await prisma.userPermission.findFirst({
        where: {
          userId: userId,
          permissionId: permission.id
        }
      });
      
      if (!existing) {
        await prisma.userPermission.create({
          data: {
            userId: userId,
            permissionId: permission.id,
            granted: true,
            grantedBy: userId
          }
        });
        console.log('✅ Added permission:', permKey);
      } else {
        console.log('✓ Permission already exists:', permKey);
      }
    } else {
      console.log('❌ Permission not found:', permKey, `(resource: ${resource}, action: ${action}, scope: ${scope})`);
    }
  }
  
  console.log('🎉 Permissions updated successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());