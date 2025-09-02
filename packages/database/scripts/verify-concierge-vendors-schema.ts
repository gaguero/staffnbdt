#!/usr/bin/env tsx
/**
 * Verify Concierge & Vendors Schema Implementation
 * This script verifies that all required schema elements are properly implemented
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SchemaCheck {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  required: boolean;
}

const schemaChecks: SchemaCheck[] = [
  {
    name: 'ConciergeObject Table',
    description: 'Main table for concierge objects with proper tenant isolation',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ConciergeObject'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'ConciergeAttribute EAV Table',
    description: 'EAV storage for dynamic concierge object attributes',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ConciergeAttribute'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'EAV Value Constraint',
    description: 'Ensures exactly one typed value per ConciergeAttribute',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.check_constraints 
          WHERE constraint_name = 'chk_concierge_attr_exactly_one_value'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'ObjectType Table',
    description: 'Schema definitions for concierge object types',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ObjectType'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'Playbook Table',
    description: 'Automation rules and workflow definitions',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Playbook'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'Vendor Table',
    description: 'Vendor directory and contact information',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Vendor'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'VendorLink Table',
    description: 'Links between vendors and concierge objects',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'VendorLink'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'VendorPortalToken Table',
    description: 'Magic-link tokens for vendor portal access',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'VendorPortalToken'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'ModuleSubscription Property Override',
    description: 'Property-level module subscription override capability',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ModuleSubscription' 
          AND column_name = 'propertyId'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'Concierge Module Manifest',
    description: 'Module definition for concierge operations',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM module_manifests 
          WHERE "moduleId" = 'concierge'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'Vendors Module Manifest',
    description: 'Module definition for vendor management',
    required: true,
    check: async () => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM module_manifests 
          WHERE "moduleId" = 'vendors'
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    }
  },
  {
    name: 'Performance Indexes',
    description: 'Optimized indexes for common query patterns',
    required: false,
    check: async () => {
      // Check for at least 3 performance indexes
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE tablename IN ('ConciergeObject', 'ConciergeAttribute', 'Vendor', 'VendorLink')
        AND indexname LIKE 'idx_%';
      ` as [{ count: string }];
      return parseInt(result[0]?.count || '0') >= 3;
    }
  },
  {
    name: 'Tenant Isolation Indexes',
    description: 'Proper tenant isolation indexes for multi-tenant queries',
    required: true,
    check: async () => {
      // Check for organizationId, propertyId indexes on key tables
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE tablename IN ('ConciergeObject', 'Vendor', 'ObjectType', 'Playbook')
        AND indexdef LIKE '%organizationId%'
        AND indexdef LIKE '%propertyId%';
      ` as [{ count: string }];
      return parseInt(result[0]?.count || '0') >= 3;
    }
  }
];

async function runSchemaChecks(): Promise<{ passed: number; failed: number; details: any[] }> {
  console.log('🔍 Running Concierge & Vendors Schema Verification');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let failed = 0;
  const details: any[] = [];
  
  for (const check of schemaChecks) {
    try {
      const result = await check.check();
      const status = result ? '✅' : (check.required ? '❌' : '⚠️ ');
      const severity = check.required ? (result ? 'PASS' : 'FAIL') : (result ? 'PASS' : 'WARN');
      
      console.log(`${status} ${check.name}: ${result ? 'OK' : 'Missing'} ${check.required ? '(Required)' : '(Optional)'}`);
      console.log(`   ${check.description}`);
      
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      details.push({
        name: check.name,
        description: check.description,
        required: check.required,
        passed: result,
        severity
      });
      
    } catch (error) {
      console.log(`❌ ${check.name}: ERROR`);
      console.log(`   ${error}`);
      failed++;
      
      details.push({
        name: check.name,
        description: check.description,
        required: check.required,
        passed: false,
        error: String(error),
        severity: 'ERROR'
      });
    }
    
    console.log(); // Add spacing
  }
  
  return { passed, failed, details };
}

async function generateSchemaReport(): Promise<void> {
  try {
    console.log('📊 Generating detailed schema report...');
    
    // Get table counts
    const tableCounts = await Promise.all([
      prisma.conciergeObject.count(),
      prisma.conciergeAttribute.count(),
      prisma.objectType.count(),
      prisma.playbook.count(),
      prisma.vendor.count(),
      prisma.vendorLink.count(),
      prisma.vendorPortalToken.count()
    ]);
    
    console.log('📋 Table Record Counts:');
    console.log(`   ConciergeObject: ${tableCounts[0]}`);
    console.log(`   ConciergeAttribute: ${tableCounts[1]}`);
    console.log(`   ObjectType: ${tableCounts[2]}`);
    console.log(`   Playbook: ${tableCounts[3]}`);
    console.log(`   Vendor: ${tableCounts[4]}`);
    console.log(`   VendorLink: ${tableCounts[5]}`);
    console.log(`   VendorPortalToken: ${tableCounts[6]}`);
    
    // Get module subscription counts
    const moduleSubscriptions = await prisma.moduleSubscription.count({
      where: {
        moduleName: {
          in: ['concierge', 'vendors']
        }
      }
    });
    
    console.log(`\n📦 Module Subscriptions: ${moduleSubscriptions}`);
    
    // Get organization counts with modules enabled
    const orgsWithModules = await prisma.organization.count({
      where: {
        moduleSubscriptions: {
          some: {
            moduleName: {
              in: ['concierge', 'vendors']
            },
            isEnabled: true
          }
        }
      }
    });
    
    console.log(`   Organizations with modules enabled: ${orgsWithModules}`);
    
  } catch (error) {
    console.error('❌ Error generating schema report:', error);
  }
}

async function main() {
  try {
    const { passed, failed, details } = await runSchemaChecks();
    
    console.log('📊 Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${passed + failed}`);
    
    const requiredFailed = details.filter(d => d.required && !d.passed).length;
    
    if (requiredFailed > 0) {
      console.log(`\n⚠️  ${requiredFailed} required checks failed!`);
      console.log('The Concierge & Vendors schema is not ready for production.');
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Run the migration: npm run migrate:concierge-vendors');
      console.log('2. Verify Prisma schema is up to date: npm run db:generate');
      console.log('3. Re-run this verification: npm run verify:concierge-vendors');
      
      process.exit(1);
    } else {
      console.log('\n🎉 All required checks passed!');
      console.log('The Concierge & Vendors schema is ready for development.');
      
      await generateSchemaReport();
      
      console.log('\n🚀 Ready for API implementation!');
    }
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main, runSchemaChecks };