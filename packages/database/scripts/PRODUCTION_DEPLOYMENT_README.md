# Production Permission System Deployment

This document provides comprehensive guidance for deploying the permission system to production Railway environment safely and efficiently.

## 📚 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Deployment Scripts](#deployment-scripts)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Workflows](#deployment-workflows)
5. [Safety Measures](#safety-measures)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## 🚀 Quick Reference

### Essential Commands
```bash
# Safe deployment (recommended for first time)
npm run deploy:production:schema-only
npm run verify:production
npm run deploy:production:permissions

# Full deployment (experienced users)
npm run deploy:production:permissions

# Health monitoring
npm run health:production

# Emergency rollback
CONFIRM_ROLLBACK=true EMERGENCY_ROLLBACK=true npm run rollback:production:permissions
```

### Pre-Deployment Checklist
- [ ] Railway environment configured
- [ ] Database backup available
- [ ] Environment variables set
- [ ] Team notified
- [ ] Rollback plan ready

## 📦 Deployment Scripts

### 1. `deploy-production-permissions.ts`
**Primary deployment script with comprehensive safety measures**

**Features:**
- Schema migration with fallback strategies
- Permission system seeding
- User migration with validation
- Automatic rollback on failure
- Backup creation
- Comprehensive error handling

**Usage:**
```bash
# Standard deployment
npm run deploy:production:permissions

# Schema only (safer for first deployment)
npm run deploy:production:schema-only

# Preview mode (no changes made)
npm run deploy:production:dry-run
```

**Environment Variables:**
- `SKIP_PERMISSION_INIT=true` - Deploy schema only
- `DRY_RUN=true` - Preview changes without applying
- `AUTO_ROLLBACK=false` - Disable automatic rollback
- `BACKUP_ENABLED=false` - Skip backup creation

### 2. `verify-production-deployment.ts`
**Comprehensive deployment verification and health validation**

**Features:**
- Database connectivity verification
- Schema integrity checks
- Permission system validation
- User migration verification
- Performance benchmarking
- Data integrity validation

**Usage:**
```bash
# Standard verification
npm run verify:production

# Detailed output with diagnostics
npm run verify:production:detailed
```

**Exit Codes:**
- `0` - All checks passed
- `1` - Critical failures detected
- `2` - Warnings present but functional

### 3. `rollback-production-permissions.ts`
**Emergency rollback tool for permission system**

**Features:**
- Complete permission system removal
- Role-based access restoration
- Backup data restoration
- Safety confirmations
- Graceful degradation

**Usage:**
```bash
# Preview rollback (recommended first)
npm run rollback:production:dry-run

# Execute rollback (DESTRUCTIVE!)
CONFIRM_ROLLBACK=true npm run rollback:production:permissions

# Production emergency rollback
CONFIRM_ROLLBACK=true EMERGENCY_ROLLBACK=true npm run rollback:production:permissions
```

**Safety Requirements:**
- `CONFIRM_ROLLBACK=true` - Required for execution
- `EMERGENCY_ROLLBACK=true` - Required for production

### 4. `health-check-production.ts`
**Continuous health monitoring for production systems**

**Features:**
- Database connectivity monitoring
- Permission system integrity
- User access validation
- Performance monitoring
- Data integrity checks
- Alerting integration ready

**Usage:**
```bash
# Human-readable health check
npm run health:production

# JSON output for monitoring systems
npm run health:production:json

# Alert on critical failures
npm run health:production:alert
```

## 🔧 Environment Configuration

### Required Railway Environment Variables

#### Core Application
```bash
DATABASE_URL=postgresql://...          # Auto-configured by Railway
NODE_ENV=production
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=7d
```

#### Permission System
```bash
SKIP_PERMISSION_INIT=true             # Set false when ready for permissions
```

#### Optional Configuration
```bash
# Deployment Safety
AUTO_ROLLBACK=true                    # Auto-rollback on failure
BACKUP_ENABLED=true                   # Create deployment backups
DRY_RUN=false                        # Preview mode

# Emergency Controls
EMERGENCY_ROLLBACK=false              # Required for production rollbacks
CONFIRM_ROLLBACK=false               # Required for any rollback

# Monitoring
ALERT_ON_FAILURE=false               # Enable alerting
JSON_OUTPUT=false                    # JSON format for monitoring tools
DETAILED=false                       # Detailed verification output
```

### Setting Variables in Railway
1. Navigate to Railway dashboard
2. Select your project and service
3. Go to "Variables" tab
4. Add variables one by one
5. Deploy the changes

## 🛡️ Deployment Workflows

### Workflow 1: First-Time Production Deployment
```bash
# Step 1: Deploy schema only (safest approach)
SKIP_PERMISSION_INIT=true npm run deploy:production:permissions

# Step 2: Verify schema deployment
npm run verify:production

# Step 3: Check application functionality
npm run health:production

# Step 4: Enable permission system when ready
SKIP_PERMISSION_INIT=false npm run deploy:production:permissions

# Step 5: Final verification
npm run verify:production:detailed
```

### Workflow 2: Existing System Migration
```bash
# Step 1: Preview the migration
npm run deploy:production:dry-run

# Step 2: Execute with auto-rollback protection
AUTO_ROLLBACK=true npm run deploy:production:permissions

# Step 3: Comprehensive verification
npm run verify:production:detailed

# Step 4: Monitor system health
npm run health:production
```

### Workflow 3: Emergency Deployment
```bash
# Step 1: Quick deployment
npm run deploy:production:permissions

# Step 2: Immediate verification
npm run verify:production

# Step 3: Monitor for issues
npm run health:production:alert
```

## 🔒 Safety Measures

### Pre-Deployment Safety
1. **Database Backup**: Automatic backup creation before changes
2. **Dry Run Mode**: Preview all changes without applying them
3. **Environment Validation**: Verify all required configuration
4. **Connectivity Testing**: Ensure database access is stable

### During Deployment Safety
1. **Atomic Operations**: All changes are transactional
2. **Progress Tracking**: Detailed logging of each step
3. **Error Handling**: Graceful failure with informative messages
4. **Auto-Rollback**: Automatic rollback on critical failures

### Post-Deployment Safety
1. **Verification Suite**: Comprehensive validation of deployment
2. **Health Monitoring**: Continuous system health checking
3. **Performance Monitoring**: Track query performance and response times
4. **Data Integrity**: Validate data consistency and relationships

### Emergency Safety
1. **Manual Rollback**: Complete permission system removal
2. **Backup Restoration**: Restore from deployment backups
3. **Graceful Degradation**: Fall back to role-based system
4. **Emergency Contacts**: Clear escalation procedures

## 📊 Monitoring & Health Checks

### Automated Health Monitoring
```bash
# Set up continuous monitoring (run every 5 minutes)
*/5 * * * * cd /app && npm run health:production:json >> /var/log/health.log 2>&1

# Alert on critical failures
npm run health:production:alert
```

### Key Metrics to Monitor
1. **Database Performance**
   - Connection time < 100ms
   - Query response time < 500ms
   - No connection pool exhaustion

2. **Permission System Health**
   - All required permissions present (60+)
   - Role mappings complete
   - No orphaned records

3. **User Access Integrity**
   - 100% of users have access methods
   - No authentication failures
   - Permission checks performing well

4. **Application Health**
   - API endpoints responding
   - No critical errors in logs
   - Normal resource utilization

### Railway Monitoring Integration
```bash
# Monitor via Railway CLI
railway logs --tail

# Check service status
railway status

# Monitor resource usage
railway ps
```

### External Monitoring Integration
The health check script outputs JSON for easy integration with:
- **Datadog**: Parse JSON logs for metrics
- **New Relic**: Custom events from health data
- **Prometheus**: Export metrics from health checks
- **PagerDuty**: Alert on critical failures

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Schema Migration Fails
```bash
# Symptoms: Migration deploy fails, schema out of sync
# Check migration status
railway run npx prisma migrate status

# Solutions:
# Option 1: Retry migration
npm run deploy:production:permissions

# Option 2: Force schema push (data loss risk)
railway run npx prisma db push --accept-data-loss

# Option 3: Manual migration
railway run npx prisma migrate deploy
```

#### 2. Permission Seeding Fails
```bash
# Symptoms: Permissions not created, role mappings missing
# Check current permissions
railway run npm run permissions:validate

# Solutions:
# Option 1: Re-seed permissions
railway run npm run permissions:seed

# Option 2: Clear and re-seed
railway run npx prisma db execute --file clear-permissions.sql
railway run npm run permissions:seed
```

#### 3. User Migration Fails
```bash
# Symptoms: Users don't have permissions, access denied errors
# Check user status
railway run npm run verify:production

# Solutions:
# Option 1: Retry migration
railway run npm run permissions:migrate

# Option 2: Rollback and retry
railway run npm run permissions:rollback
railway run npm run permissions:migrate
```

#### 4. Application Won't Start
```bash
# Symptoms: Service fails to start, crashes on boot
# Check Railway logs
railway logs

# Check environment variables
railway variables

# Solutions:
# Option 1: Verify database connection
railway run npm run health:production

# Option 2: Check environment variables
railway run printenv | grep -E "(DATABASE_URL|NODE_ENV|JWT_SECRET)"

# Option 3: Rollback deployment
CONFIRM_ROLLBACK=true npm run rollback:production:permissions
```

#### 5. Performance Issues
```bash
# Symptoms: Slow response times, timeouts
# Check system health
npm run health:production:detailed

# Check database performance
railway run npx prisma db execute --file analyze-performance.sql

# Solutions:
# Option 1: Check database connections
railway run npx prisma db execute --query "SELECT count(*) FROM pg_stat_activity"

# Option 2: Optimize queries
# Review slow query logs

# Option 3: Scale resources
# Upgrade Railway plan if needed
```

### Diagnostic Commands
```bash
# Database diagnostics
railway run npx prisma db execute --query "SELECT version()"
railway run npx prisma db execute --query "SELECT count(*) FROM \"User\""
railway run npx prisma db execute --query "SELECT count(*) FROM \"Permission\""

# Application diagnostics
railway run npm run verify:production:detailed
railway run npm run health:production:json
railway logs --tail

# Performance diagnostics
railway run npm run health:production
railway ps
railway status
```

## 🔄 Rollback Procedures

### When to Rollback
- **Critical System Failure**: Application completely down
- **Authentication Issues**: Users cannot log in
- **Data Corruption**: Inconsistent or missing data
- **Performance Degradation**: Unacceptable response times
- **Security Concerns**: Potential access control bypass

### Rollback Types

#### 1. Application Code Rollback (Preferred)
```bash
# Revert to previous working commit
git revert <commit-hash>
git push origin main

# Railway will auto-deploy the revert
# This preserves data and is safest
```

#### 2. Permission System Rollback (Data Loss)
```bash
# Preview what will be removed
npm run rollback:production:dry-run

# Execute rollback (removes all permission data)
CONFIRM_ROLLBACK=true npm run rollback:production:permissions

# Production requires additional confirmation
CONFIRM_ROLLBACK=true EMERGENCY_ROLLBACK=true npm run rollback:production:permissions
```

#### 3. Database Rollback (Last Resort)
```bash
# Restore from Railway backup (via dashboard)
# Or restore from external backup

# Manual database restore commands
railway run pg_restore --clean --no-acl --no-owner -d $DATABASE_URL backup.sql
```

### Post-Rollback Verification
```bash
# Verify system is functional
npm run verify:production

# Check user access is restored
npm run health:production

# Test critical functionality
# Manual testing of login, user management, etc.
```

### Rollback Communication
1. **Immediate**: Notify team of rollback execution
2. **Status Update**: Share rollback results and system status
3. **Root Cause**: Document what went wrong
4. **Prevention**: Plan improvements to prevent recurrence

## 📞 Emergency Contacts

### Escalation Path
1. **Primary Engineer**: [Your name/contact]
2. **Team Lead**: [Team lead contact]
3. **Database Admin**: [DBA contact]
4. **Platform Admin**: [Platform admin contact]

### External Support
- **Railway Support**: support@railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status Page**: https://status.railway.app

### Internal Communication Channels
- **Slack**: #deployments, #incidents
- **Email**: deployments@yourcompany.com
- **On-Call**: [Your on-call system]

## 📋 Deployment Checklist Template

### Pre-Deployment
- [ ] Database backup verified
- [ ] Environment variables configured
- [ ] Team notified of deployment window
- [ ] Rollback plan documented
- [ ] Monitor dashboards ready

### During Deployment
- [ ] Deployment script executed successfully
- [ ] Verification checks passed
- [ ] Health checks show green
- [ ] No error alerts triggered
- [ ] Performance metrics normal

### Post-Deployment
- [ ] Full functionality tested
- [ ] User access verified
- [ ] Performance benchmarks met
- [ ] Monitoring systems updated
- [ ] Documentation updated
- [ ] Team notified of completion

### Emergency Response
- [ ] Issue identified and categorized
- [ ] Stakeholders notified
- [ ] Rollback decision made
- [ ] Rollback executed (if needed)
- [ ] System restored and verified
- [ ] Post-incident review scheduled

---

**Remember**: Production deployments affect real users. Always prioritize safety, have multiple verification steps, and be prepared to rollback quickly if issues arise.