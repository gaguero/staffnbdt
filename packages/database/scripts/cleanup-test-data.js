#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * PRODUCTION SAFETY CLEANUP SCRIPT
 * This script removes test data that was accidentally seeded to production
 * It specifically targets the Nayara Resorts and Taso Group test organizations
 */

// Test organization names to identify and remove
const TEST_ORGANIZATIONS = [
  'Nayara Resorts',
  'Taso Group'
];

// Test property names that should be removed
const TEST_PROPERTIES = [
  'Nayara Bocas del Toro',
  'El Palmar Beach Resort'
];

async function confirmDatabaseEnvironment() {
  console.log('🔍 Checking database environment...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment');
  }
  
  console.log(`📍 Connected to: ${databaseUrl.replace(/:[^@]*@/, ':***@')}`);
  
  // Count total organizations to understand the scope
  const totalOrgs = await prisma.organization.count();
  const testOrgs = await prisma.organization.count({
    where: {
      name: { in: TEST_ORGANIZATIONS }
    }
  });
  
  console.log(`📊 Total organizations in database: ${totalOrgs}`);
  console.log(`🎯 Test organizations to remove: ${testOrgs}`);
  
  if (testOrgs === 0) {
    console.log('✅ No test organizations found - nothing to clean up');
    return false;
  }
  
  return true;
}

async function listTestDataToRemove() {
  console.log('📋 Analyzing test data to be removed...\n');
  
  // Find test organizations
  const testOrganizations = await prisma.organization.findMany({
    where: {
      name: { in: TEST_ORGANIZATIONS }
    },
    include: {
      properties: {
        include: {
          departments: true,
          users: true,
          documents: true,
          payslips: true,
          vacations: true,
          trainingSessions: true,
          commercialBenefits: true,
          notifications: true,
          auditLogs: true
        }
      },
      users: true,
      moduleSubscriptions: true
    }
  });
  
  let totalRecordsToDelete = 0;
  
  for (const org of testOrganizations) {
    console.log(`🏢 Organization: ${org.name} (ID: ${org.id})`);
    console.log(`   Properties: ${org.properties.length}`);
    
    let orgRecordCount = 1; // The organization itself
    
    for (const property of org.properties) {
      console.log(`   🏨 Property: ${property.name}`);
      console.log(`      Departments: ${property.departments.length}`);
      console.log(`      Users: ${property.users.length}`);
      console.log(`      Documents: ${property.documents.length}`);
      console.log(`      Payslips: ${property.payslips.length}`);
      console.log(`      Vacations: ${property.vacations.length}`);
      console.log(`      Training Sessions: ${property.trainingSessions.length}`);
      console.log(`      Commercial Benefits: ${property.commercialBenefits.length}`);
      console.log(`      Notifications: ${property.notifications.length}`);
      console.log(`      Audit Logs: ${property.auditLogs.length}`);
      
      orgRecordCount += 1; // Property
      orgRecordCount += property.departments.length;
      orgRecordCount += property.users.length;
      orgRecordCount += property.documents.length;
      orgRecordCount += property.payslips.length;
      orgRecordCount += property.vacations.length;
      orgRecordCount += property.trainingSessions.length;
      orgRecordCount += property.commercialBenefits.length;
      orgRecordCount += property.notifications.length;
      orgRecordCount += property.auditLogs.length;
    }
    
    orgRecordCount += org.users.length; // Org-level users
    orgRecordCount += org.moduleSubscriptions.length; // Module subscriptions
    
    console.log(`   📊 Total records for ${org.name}: ${orgRecordCount}\n`);
    totalRecordsToDelete += orgRecordCount;
  }
  
  console.log(`🗂️  TOTAL RECORDS TO DELETE: ${totalRecordsToDelete}\n`);
  return testOrganizations;
}

async function deleteTestData(testOrganizations) {
  console.log('🗑️  Starting deletion process...\n');
  
  let deletedCount = 0;
  
  for (const org of testOrganizations) {
    console.log(`🏢 Cleaning up organization: ${org.name}`);
    
    // Delete in proper order to respect foreign key constraints
    
    // 1. Delete property-level records first
    for (const property of org.properties) {
      console.log(`   🏨 Cleaning property: ${property.name}`);
      
      // Delete audit logs
      const auditLogs = await prisma.auditLog.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${auditLogs.count} audit logs`);
      deletedCount += auditLogs.count;
      
      // Delete notifications
      const notifications = await prisma.notification.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${notifications.count} notifications`);
      deletedCount += notifications.count;
      
      // Delete commercial benefits
      const benefits = await prisma.commercialBenefit.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${benefits.count} commercial benefits`);
      deletedCount += benefits.count;
      
      // Delete training sessions (and related data)
      const trainingSessions = await prisma.trainingSession.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${trainingSessions.count} training sessions`);
      deletedCount += trainingSessions.count;
      
      // Delete vacations
      const vacations = await prisma.vacation.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${vacations.count} vacations`);
      deletedCount += vacations.count;
      
      // Delete payslips
      const payslips = await prisma.payslip.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${payslips.count} payslips`);
      deletedCount += payslips.count;
      
      // Delete documents
      const documents = await prisma.document.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${documents.count} documents`);
      deletedCount += documents.count;
      
      // Delete users in this property
      const users = await prisma.user.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${users.count} users`);
      deletedCount += users.count;
      
      // Delete departments
      const departments = await prisma.department.deleteMany({
        where: { propertyId: property.id }
      });
      console.log(`      ✅ Deleted ${departments.count} departments`);
      deletedCount += departments.count;
      
      // Delete the property
      await prisma.property.delete({
        where: { id: property.id }
      });
      console.log(`      ✅ Deleted property: ${property.name}`);
      deletedCount += 1;
    }
    
    // 2. Delete organization-level records
    
    // Delete org-level users
    const orgUsers = await prisma.user.deleteMany({
      where: { 
        organizationId: org.id,
        propertyId: null
      }
    });
    console.log(`   ✅ Deleted ${orgUsers.count} org-level users`);
    deletedCount += orgUsers.count;
    
    // Delete module subscriptions
    const moduleSubscriptions = await prisma.moduleSubscription.deleteMany({
      where: { organizationId: org.id }
    });
    console.log(`   ✅ Deleted ${moduleSubscriptions.count} module subscriptions`);
    deletedCount += moduleSubscriptions.count;
    
    // 3. Finally delete the organization
    await prisma.organization.delete({
      where: { id: org.id }
    });
    console.log(`   ✅ Deleted organization: ${org.name}\n`);
    deletedCount += 1;
  }
  
  return deletedCount;
}

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup completion...');
  
  const remainingTestOrgs = await prisma.organization.count({
    where: {
      name: { in: TEST_ORGANIZATIONS }
    }
  });
  
  const remainingTestProperties = await prisma.property.count({
    where: {
      name: { in: TEST_PROPERTIES }
    }
  });
  
  console.log(`📊 Remaining test organizations: ${remainingTestOrgs}`);
  console.log(`📊 Remaining test properties: ${remainingTestProperties}`);
  
  if (remainingTestOrgs === 0 && remainingTestProperties === 0) {
    console.log('✅ Cleanup verification passed - all test data removed');
    return true;
  } else {
    console.log('⚠️  Some test data may still remain');
    return false;
  }
}

async function main() {
  console.log('🧹 PRODUCTION DATABASE CLEANUP SCRIPT');
  console.log('=====================================');
  console.log('This script will remove test data accidentally seeded to production\n');
  
  try {
    // 1. Confirm we can proceed
    const hasTestData = await confirmDatabaseEnvironment();
    if (!hasTestData) {
      return;
    }
    
    // 2. Show what will be removed
    const testOrganizations = await listTestDataToRemove();
    
    // 3. Wait for manual confirmation (since this is production)
    console.log('⚠️  WARNING: This will permanently delete the above data from PRODUCTION database!');
    console.log('🔧 To proceed, you must manually confirm by setting CONFIRM_CLEANUP=true');
    console.log('   Example: CONFIRM_CLEANUP=true node cleanup-test-data.js\n');
    
    if (process.env.CONFIRM_CLEANUP !== 'true') {
      console.log('❌ Cleanup aborted - confirmation required');
      console.log('💡 Run: CONFIRM_CLEANUP=true node cleanup-test-data.js');
      return;
    }
    
    console.log('✅ Confirmation received - proceeding with cleanup...\n');
    
    // 4. Perform the deletion
    const deletedCount = await deleteTestData(testOrganizations);
    
    // 5. Verify cleanup
    const cleanupSuccess = await verifyCleanup();
    
    console.log('\n🎉 CLEANUP COMPLETED');
    console.log('====================');
    console.log(`📊 Total records deleted: ${deletedCount}`);
    console.log(`✅ Success: ${cleanupSuccess ? 'YES' : 'PARTIAL'}`);
    
    if (cleanupSuccess) {
      console.log('\n🏁 Production database has been restored to pre-seeding state');
      console.log('💡 You can now safely seed the dev database with test data');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error('\n🔧 You may need to manually review the database state');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };