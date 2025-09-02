import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Comprehensive fix for Vendor module access issues...');
  
  // Users mentioned in the error logs
  const userIds = [
    'cmf0gg0wn000elzp5l9dzkzs1', // User from permission error logs
  ];
  
  // Also find user by email
  const userByEmail = await prisma.user.findUnique({
    where: { email: 'roberto.martinez@nayararesorts.com' }
  });
  
  if (userByEmail && !userIds.includes(userByEmail.id)) {
    userIds.push(userByEmail.id);
  }
  
  console.log(`📋 Processing ${userIds.length} users...`);
  
  for (const userId of userIds) {
    await fixUserIssues(userId);
  }
  
  console.log('🎉 All fixes completed successfully!');
}

async function fixUserIssues(userId: string) {
  console.log(`\n🔧 Processing user: ${userId}`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      property: true,
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
    console.log(`❌ User ${userId} not found`);
    return;
  }
  
  console.log(`👤 User: ${user.email} (${user.firstName} ${user.lastName})`);
  console.log(`🎭 Role: ${user.role}`);
  console.log(`🏢 Organization: ${user.organizationId} (${user.organization?.name || 'NOT FOUND'})`);
  console.log(`🏨 Property: ${user.propertyId} (${user.property?.name || 'NOT FOUND'})`);
  
  // Step 1: Fix tenant assignments
  await fixTenantAssignments(user);
  
  // Step 2: Add missing permissions
  await fixPermissions(user.id);
  
  // Step 3: Validate fixes
  await validateUserAccess(user.id);
}

async function fixTenantAssignments(user: any) {
  console.log('\n🏗️ Checking tenant assignments...');
  
  let organizationId = user.organizationId;
  let propertyId = user.propertyId;
  let needsUpdate = false;
  
  // If user has no organization, assign to default
  if (!organizationId) {
    console.log('⚠️ User has no organization assignment');
    const defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'nayara-group' },
      orderBy: { createdAt: 'asc' }
    });
    
    if (!defaultOrg) {
      console.log('❌ No default organization found, creating one...');
      const newOrg = await prisma.organization.create({
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
      organizationId = newOrg.id;
      console.log(`✅ Created organization: ${newOrg.name} (${newOrg.id})`);
    } else {
      organizationId = defaultOrg.id;
      console.log(`✅ Found organization: ${defaultOrg.name} (${defaultOrg.id})`);
    }
    needsUpdate = true;
  }
  
  // If user has no property, assign to first available
  if (!propertyId) {
    console.log('⚠️ User has no property assignment');
    const firstProperty = await prisma.property.findFirst({
      where: { 
        organizationId,
        isActive: true 
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (!firstProperty) {
      console.log('❌ No property found, creating default...');
      const newProperty = await prisma.property.create({
        data: {
          organizationId,
          name: 'Nayara Gardens',
          slug: 'nayara-gardens',
          description: 'Default property for Hotel Operations Hub',
          propertyType: 'RESORT',
          timezone: 'America/Costa_Rica',
          settings: {
            modules: ['HR', 'DOCUMENTS', 'TRAINING', 'BENEFITS', 'CONCIERGE', 'VENDORS'],
            defaultDepartments: ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Administration']
          },
          branding: {
            inherit: true
          },
          isActive: true
        }
      });
      propertyId = newProperty.id;
      console.log(`✅ Created property: ${newProperty.name} (${newProperty.id})`);
    } else {
      propertyId = firstProperty.id;
      console.log(`✅ Found property: ${firstProperty.name} (${firstProperty.id})`);
    }
    needsUpdate = true;
  }
  
  // Update user if needed
  if (needsUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId,
        propertyId
      }
    });
    console.log('✅ Updated user tenant assignments');
  } else {
    console.log('✓ User tenant assignments are correct');
  }
}

async function fixPermissions(userId: string) {
  console.log('\n🔐 Checking permissions...');
  
  // All required permissions for Concierge and Vendors modules
  const requiredPermissions = [
    // Concierge permissions
    'concierge.read.property',
    'concierge.create.property',
    'concierge.update.property',
    'concierge.complete.property',
    'concierge.execute.property',
    'concierge.objects.read.property',
    'concierge.objects.create.property',
    'concierge.objects.update.property',
    'concierge.objects.delete.property',
    'concierge.object-types.read.property',
    'concierge.object-types.create.property',
    'concierge.object-types.update.property',
    'concierge.playbooks.read.property',
    'concierge.playbooks.create.property',
    'concierge.playbooks.execute.property',
    // Vendors permissions
    'vendors.read.property',
    'vendors.create.property',
    'vendors.update.property',
    'vendors.delete.property',
    'vendors.links.read.property',
    'vendors.links.create.property',
    'vendors.links.update.property',
    'vendors.links.confirm.property',
    'vendors.portal.access',
    // Additional common permissions they might need
    'user.read.property',
    'user.create.property',
    'user.update.property',
    'department.read.property',
    'organization.read.own',
    'property.read.own'
  ];
  
  let addedCount = 0;
  let existingCount = 0;
  let notFoundCount = 0;
  
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
        console.log(`✅ Added: ${permKey}`);
        addedCount++;
      } else {
        existingCount++;
      }
    } else {
      console.log(`❌ Permission not found: ${permKey}`);
      notFoundCount++;
    }
  }
  
  console.log(`📊 Permission summary: ${addedCount} added, ${existingCount} existing, ${notFoundCount} not found`);
}

async function validateUserAccess(userId: string) {
  console.log('\n🔍 Validating user access...');
  
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      property: true,
      userPermissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  if (!updatedUser) {
    console.log('❌ User not found after updates');
    return;
  }
  
  // Check key requirements
  const hasOrgId = !!updatedUser.organizationId;
  const hasPropId = !!updatedUser.propertyId;
  const hasVendorsRead = updatedUser.userPermissions.some(up => 
    up.permission.resource === 'vendors' && 
    up.permission.action === 'read' && 
    up.permission.scope === 'property'
  );
  const hasConciergeRead = updatedUser.userPermissions.some(up => 
    up.permission.resource === 'concierge' && 
    up.permission.action === 'read' && 
    up.permission.scope === 'property'
  );
  
  console.log(`✅ Organization ID: ${hasOrgId ? '✓' : '❌'} (${updatedUser.organizationId})`);
  console.log(`✅ Property ID: ${hasPropId ? '✓' : '❌'} (${updatedUser.propertyId})`);
  console.log(`✅ Vendors Read Permission: ${hasVendorsRead ? '✓' : '❌'}`);
  console.log(`✅ Concierge Read Permission: ${hasConciergeRead ? '✓' : '❌'}`);
  console.log(`📊 Total permissions: ${updatedUser.userPermissions.length}`);
  
  if (hasOrgId && hasPropId && hasVendorsRead && hasConciergeRead) {
    console.log('🎉 User validation successful - all requirements met!');
  } else {
    console.log('⚠️ User validation incomplete - some issues remain');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());