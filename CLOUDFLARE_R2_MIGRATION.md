# Cloudflare R2 Storage Migration Guide

This guide covers the implementation and usage of Cloudflare R2 storage integration for the Hotel Operations Hub platform, including migration from Railway local filesystem storage.

## Overview

The system now supports three storage strategies:

1. **Local Storage Only**: Files stored on Railway volume (default)
2. **R2 Storage Only**: Files stored in Cloudflare R2
3. **Hybrid Mode**: Files stored in both locations for redundancy

## Architecture

### Storage Services

- **R2Service**: Handles all Cloudflare R2 operations with tenant-scoped file organization
- **StorageService**: Enhanced with R2 integration and fallback capabilities
- **StorageMigrationService**: Manages migration between storage systems

### Tenant-Scoped File Organization

Files in R2 are organized with strict tenant isolation:

```
/org/{organizationId}/property/{propertyId}/module/{type}/timestamp-random-filename.ext
/org/{organizationId}/property/{propertyId}/module/{type}/dept/{departmentId}/timestamp-random-filename.ext
```

Example paths:
```
/org/1/property/1/documents/general/1703123456789-a1b2c3d4-employee-handbook.pdf
/org/1/property/1/payroll/payslips/dept/5/1703123456790-e5f6g7h8-john-doe-payslip.pdf
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Storage Strategy
STORAGE_USE_R2=false              # Set to 'true' to use R2 instead of local
STORAGE_HYBRID_MODE=false         # Set to 'true' to use both R2 and local

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=staffnbdt-storage
R2_PUBLIC_URL=https://your-bucket.r2.dev  # Optional: for public access

# Existing local storage settings
STORAGE_PATH=/app/storage
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi
```

### Cloudflare R2 Setup

1. **Create R2 Bucket**:
   - Log into Cloudflare Dashboard
   - Go to R2 Object Storage
   - Create bucket named `staffnbdt-storage`

2. **Create API Token**:
   - Go to R2 → Manage R2 API Tokens
   - Create token with `Object Read & Write` permissions
   - Note down the credentials

3. **Optional - Custom Domain**:
   - Configure custom domain in R2 settings
   - Update `R2_PUBLIC_URL` environment variable

## Migration Process

### 1. Pre-Migration Health Check

Check current configuration and R2 connectivity:

```bash
cd apps/bff
npm run script:migrate-storage -- --health-check
```

### 2. Dry Run Migration

Preview what will be migrated without making changes:

```bash
npm run script:migrate-storage -- --migrate --dry-run
```

### 3. Actual Migration

Migrate all files with default settings:

```bash
npm run script:migrate-storage -- --migrate
```

Advanced migration options:

```bash
# Migrate with larger batch size
npm run script:migrate-storage -- --migrate --batch-size=20

# Migrate only specific modules
npm run script:migrate-storage -- --migrate --filter-by-module=documents,payroll

# Delete local files after successful migration
npm run script:migrate-storage -- --migrate --delete-after-migration
```

### 4. Verification

Verify migration integrity:

```bash
npm run script:migrate-storage -- --verify
```

### 5. Switch to R2 Mode

After successful migration and verification:

```bash
# Update environment variables
STORAGE_USE_R2=true
STORAGE_HYBRID_MODE=false  # Optional: keep false for R2-only mode
```

Restart the application to apply changes.

### 6. Cleanup (Optional)

Clean up empty directories after migration:

```bash
npm run script:migrate-storage -- --cleanup-directories
```

## Rollback Process

If you need to rollback from R2 to local storage:

```bash
# Preview rollback
npm run script:migrate-storage -- --rollback --dry-run

# Perform rollback
npm run script:migrate-storage -- --rollback

# Update environment to use local storage
STORAGE_USE_R2=false
```

## API Endpoints

### Admin Storage Management

All endpoints require `PLATFORM_ADMIN` role and appropriate permissions.

#### Migration Control
- `POST /admin/storage/migrate/to-r2` - Start migration to R2
- `POST /admin/storage/rollback/from-r2` - Rollback from R2
- `GET /admin/storage/verify/migration` - Verify migration integrity

#### Monitoring & Stats
- `GET /admin/storage/config` - Get storage configuration
- `GET /admin/storage/stats/tenant` - Get tenant storage statistics
- `POST /admin/storage/health/r2` - R2 health check

#### Maintenance
- `POST /admin/storage/cleanup/empty-directories` - Clean up empty directories

### Example API Calls

```bash
# Check storage configuration
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/admin/storage/config

# Start migration (dry run)
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "batchSize": 10}' \
  http://localhost:3000/admin/storage/migrate/to-r2

# Get tenant storage stats
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:3000/admin/storage/stats/tenant
```

## Storage Modes

### Local Storage Only (Default)
```bash
STORAGE_USE_R2=false
STORAGE_HYBRID_MODE=false
```
- All files stored in Railway volume
- Fastest for small deployments
- Limited scalability

### R2 Storage Only
```bash
STORAGE_USE_R2=true
STORAGE_HYBRID_MODE=false
```
- All files stored in Cloudflare R2
- Highly scalable and cost-effective
- Global CDN distribution available

### Hybrid Mode
```bash
STORAGE_USE_R2=true
STORAGE_HYBRID_MODE=true
```
- Files stored in both R2 and local
- Maximum redundancy
- Automatic failover
- Higher storage costs

## File Operations

### Upload with Tenant Context

```typescript
const fileMetadata = await storageService.saveFile(fileBuffer, {
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
  tenantContext: {
    userId: 'user-123',
    organizationId: 'org-1',
    propertyId: 'prop-1',
    departmentId: 'dept-5', // Optional
    userRole: Role.STAFF,
  },
  module: 'documents',
  type: 'general',
});
```

### Download with Tenant Validation

```typescript
// Tenant access is automatically validated based on request context
const fileBuffer = await storageService.getFile(key, request);
```

### Generate Presigned URLs

```typescript
const urls = await storageService.generatePresignedUploadUrl(
  'filename.pdf',
  'application/pdf',
  tenantContext,
  'documents',
  'general',
  300 // expires in 5 minutes
);
```

## Security Features

### Tenant Isolation
- Files are organized by organization and property
- Access validation based on user's tenant context
- Department-level isolation for sensitive files

### Permission Integration
- All storage operations respect the existing RBAC system
- Permission decorators: `@RequirePermission('system.storage.manage')`
- Role-based access to admin endpoints

### Secure File Access
- Presigned URLs for temporary access
- Tenant context validation on all operations
- Audit logging for sensitive operations

## Monitoring & Troubleshooting

### Health Checks

The R2 service includes comprehensive health monitoring:

```typescript
// Check R2 connectivity
const isHealthy = await r2Service.healthCheck();

// Get storage configuration
const config = storageService.getStorageConfig();

// Get tenant statistics
const stats = await r2Service.getTenantStorageStats(tenantContext);
```

### Common Issues

1. **R2 Authentication Errors**
   - Verify R2 credentials in environment variables
   - Check API token permissions
   - Ensure correct account ID

2. **Migration Failures**
   - Check available disk space
   - Verify file permissions
   - Review batch size (reduce if memory issues)

3. **Hybrid Mode Issues**
   - Monitor logs for sync failures
   - Check both storage systems independently
   - Verify network connectivity to R2

### Logging

Storage operations are logged with appropriate levels:

```typescript
// Info level: Successful operations
logger.log('File uploaded successfully: org/1/property/1/documents/general/file.pdf');

// Warn level: Fallback scenarios
logger.warn('R2 download failed, trying local storage');

// Error level: Operation failures
logger.error('Failed to upload file to R2', error);
```

## Performance Considerations

### Batch Processing
- Default batch size: 10 files
- Increase for better performance: `--batch-size=50`
- Decrease for memory-constrained environments: `--batch-size=5`

### Network Optimization
- Use presigned URLs for direct client uploads
- Enable compression for large files
- Consider CDN for frequently accessed files

### Cost Management
- Monitor R2 usage in Cloudflare dashboard
- Implement lifecycle policies for old files
- Use hybrid mode selectively for critical files

## Best Practices

### Migration Strategy
1. Start with dry run to estimate scope
2. Migrate during low-traffic periods
3. Verify migration before switching modes
4. Keep local files until verification complete
5. Monitor application performance after switch

### File Organization
- Use descriptive module and type names
- Consider future reorganization needs
- Document custom file paths
- Implement consistent naming conventions

### Security
- Rotate R2 API keys regularly
- Use least-privilege API tokens
- Monitor access logs
- Implement file encryption for sensitive data

## Troubleshooting Commands

```bash
# Check storage status
npm run script:migrate-storage -- --health-check

# Re-verify migration
npm run script:migrate-storage -- --verify

# Test with small batch
npm run script:migrate-storage -- --migrate --batch-size=1 --filter-by-module=documents

# Check logs
tail -f /app/logs/application.log | grep -i storage
```

## Support & Maintenance

### Regular Tasks
- Monitor storage usage and costs
- Review and rotate API credentials
- Update file retention policies
- Test backup and recovery procedures

### Incident Response
1. Check service health endpoints
2. Review application logs
3. Verify R2 service status
4. Test fallback mechanisms
5. Contact support if needed

For additional support or questions about the R2 migration, consult the system documentation or contact the development team.