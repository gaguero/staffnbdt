#!/usr/bin/env ts-node

/**
 * Storage Migration CLI Script
 * 
 * Usage:
 * npm run script:migrate-storage -- --help
 * npm run script:migrate-storage -- --migrate --dry-run
 * npm run script:migrate-storage -- --migrate --batch-size=20
 * npm run script:migrate-storage -- --rollback --dry-run
 * npm run script:migrate-storage -- --verify
 * npm run script:migrate-storage -- --health-check
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { StorageMigrationService } from '../shared/storage/storage-migration.service';
import { R2Service } from '../shared/storage/r2.service';
import { StorageService } from '../shared/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { RequestTenantContext } from '../shared/tenant/tenant-context.service';
import { Role } from '@prisma/client';

interface CliOptions {
  migrate?: boolean;
  rollback?: boolean;
  verify?: boolean;
  healthCheck?: boolean;
  dryRun?: boolean;
  batchSize?: number;
  deleteAfterMigration?: boolean;
  skipExisting?: boolean;
  filterByModule?: string[];
  help?: boolean;
}

async function parseArgs(): Promise<CliOptions> {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--migrate') {
      options.migrate = true;
    } else if (arg === '--rollback') {
      options.rollback = true;
    } else if (arg === '--verify') {
      options.verify = true;
    } else if (arg === '--health-check') {
      options.healthCheck = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--delete-after-migration') {
      options.deleteAfterMigration = true;
    } else if (arg === '--skip-existing=false') {
      options.skipExisting = false;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--filter-by-module=')) {
      options.filterByModule = arg.split('=')[1].split(',');
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Storage Migration CLI Tool

Usage: npm run script:migrate-storage -- [options]

Commands:
  --migrate                    Migrate files from local storage to R2
  --rollback                   Rollback files from R2 to local storage
  --verify                     Verify migration integrity
  --health-check              Check R2 connectivity and configuration

Options:
  --dry-run                   Preview changes without making them
  --batch-size=N              Number of files to process in each batch (default: 10)
  --delete-after-migration    Delete local files after successful migration
  --skip-existing=false       Do not skip files that already exist (default: true)
  --filter-by-module=m1,m2    Only migrate files from specified modules
  --help, -h                  Show this help message

Examples:
  # Preview migration
  npm run script:migrate-storage -- --migrate --dry-run

  # Migrate with custom batch size
  npm run script:migrate-storage -- --migrate --batch-size=20

  # Migrate only documents module
  npm run script:migrate-storage -- --migrate --filter-by-module=documents

  # Verify migration integrity
  npm run script:migrate-storage -- --verify

  # Check R2 health
  npm run script:migrate-storage -- --health-check

  # Rollback (dry run)
  npm run script:migrate-storage -- --rollback --dry-run
  `);
}

async function main() {
  const logger = new Logger('StorageMigrationCLI');
  const options = await parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.migrate && !options.rollback && !options.verify && !options.healthCheck) {
    logger.error('Please specify a command. Use --help for usage information.');
    process.exit(1);
  }

  logger.log('Initializing NestJS application...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const migrationService = app.get(StorageMigrationService);
    const r2Service = app.get(R2Service);
    const storageService = app.get(StorageService);
    const configService = app.get(ConfigService);

    // Create a default tenant context for CLI operations
    // In production, you might want to specify these via CLI args
    const defaultTenantContext: RequestTenantContext = {
      userId: 'system-migration-user',
      organizationId: configService.get('DEFAULT_ORGANIZATION_ID') || '1',
      propertyId: configService.get('DEFAULT_PROPERTY_ID') || '1',
      userRole: Role.PLATFORM_ADMIN,
    };

    try {
      if (options.healthCheck) {
        logger.log('Performing health checks...');
        
        const storageConfig = storageService.getStorageConfig();
        logger.log(`Storage Configuration: ${JSON.stringify(storageConfig, null, 2)}`);
        
        if (storageConfig.r2Available) {
          const r2Healthy = await r2Service.healthCheck();
          logger.log(`R2 Health Check: ${r2Healthy ? 'PASS' : 'FAIL'}`);
          
          if (r2Healthy) {
            const stats = await r2Service.getTenantStorageStats(defaultTenantContext);
            logger.log(`R2 Storage Stats: ${stats.totalFiles} files, ${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`);
          }
        } else {
          logger.warn('R2 service not available');
        }
      }

      if (options.migrate) {
        logger.log('Starting migration to R2...');
        
        const migrationOptions = {
          batchSize: options.batchSize,
          dryRun: options.dryRun,
          deleteAfterMigration: options.deleteAfterMigration,
          filterByModule: options.filterByModule,
          skipExisting: options.skipExisting,
        };
        
        logger.log(`Migration options: ${JSON.stringify(migrationOptions, null, 2)}`);
        
        const stats = await migrationService.migrateToR2(defaultTenantContext, migrationOptions);
        
        logger.log('Migration Results:');
        logger.log(`  Total files: ${stats.totalFiles}`);
        logger.log(`  Migrated: ${stats.migratedFiles}`);
        logger.log(`  Failed: ${stats.failedFiles}`);
        logger.log(`  Skipped: ${stats.skippedFiles}`);
        logger.log(`  Total size: ${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`);
        
        if (stats.errors.length > 0) {
          logger.warn('Migration errors:');
          stats.errors.forEach(error => logger.warn(`  - ${error}`));
        }
      }

      if (options.rollback) {
        logger.log('Starting rollback from R2...');
        
        const rollbackOptions = {
          batchSize: options.batchSize,
          dryRun: options.dryRun,
        };
        
        logger.log(`Rollback options: ${JSON.stringify(rollbackOptions, null, 2)}`);
        
        const stats = await migrationService.rollbackMigration(defaultTenantContext, rollbackOptions);
        
        logger.log('Rollback Results:');
        logger.log(`  Total files: ${stats.totalFiles}`);
        logger.log(`  Restored: ${stats.migratedFiles}`);
        logger.log(`  Failed: ${stats.failedFiles}`);
        logger.log(`  Total size: ${Math.round(stats.totalSize / 1024 / 1024 * 100) / 100} MB`);
        
        if (stats.errors.length > 0) {
          logger.warn('Rollback errors:');
          stats.errors.forEach(error => logger.warn(`  - ${error}`));
        }
      }

      if (options.verify) {
        logger.log('Starting migration verification...');
        
        const verification = await migrationService.verifyMigration(defaultTenantContext);
        
        logger.log('Verification Results:');
        logger.log(`  Total files: ${verification.totalFiles}`);
        logger.log(`  Matching: ${verification.matchingFiles}`);
        logger.log(`  Missing: ${verification.missingFiles}`);
        logger.log(`  Size mismatches: ${verification.sizeMismatches}`);
        
        if (verification.errors.length > 0) {
          logger.warn('Verification errors:');
          verification.errors.forEach(error => logger.warn(`  - ${error}`));
        }
        
        if (verification.missingFiles > 0 || verification.sizeMismatches > 0) {
          logger.error('Migration verification FAILED - some files are missing or corrupted');
          process.exit(1);
        } else {
          logger.log('Migration verification PASSED - all files are intact');
        }
      }

      logger.log('Operation completed successfully');
      await app.close();
      process.exit(0);
      
    } catch (error) {
      logger.error('Operation failed:', error);
      await app.close();
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  console.error('CLI script failed:', error);
  process.exit(1);
});