# Railway Production Deployment Guide

This guide provides step-by-step instructions for safely deploying the permission system to Railway production environment.

## 🚀 Quick Start

### Option 1: Safe Initial Deployment (Recommended)
```bash
# Deploy schema only, skip permissions initially
npm run deploy:production:schema-only

# Verify deployment
npm run verify:production

# Enable permissions when ready
npm run deploy:production:permissions
```

### Option 2: Full Deployment
```bash
# Deploy everything at once
npm run deploy:production:permissions

# Verify deployment
npm run verify:production
```

### Option 3: Preview Changes (No Risk)
```bash
# See what would happen without making changes
npm run deploy:production:dry-run

# Detailed verification output
npm run verify:production:detailed
```

## 📋 Pre-Deployment Checklist

### 1. Railway Environment Setup
- [ ] Railway project created and configured
- [ ] PostgreSQL service provisioned
- [ ] Environment variables configured (see below)
- [ ] Domain and SSL configured (if needed)

### 2. Database Readiness
- [ ] Database is accessible and has recent backup
- [ ] Current schema is up to date
- [ ] No pending critical migrations
- [ ] Database has sufficient storage space

### 3. Application Readiness
- [ ] Code changes tested locally
- [ ] Permission decorators ready to deploy
- [ ] Rollback plan prepared
- [ ] Team notified of deployment window

## 🔧 Railway Environment Variables

### Required Variables
```bash
# Database connection (auto-configured by Railway)
DATABASE_URL=postgresql://...

# Application configuration
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=7d

# Permission system configuration
SKIP_PERMISSION_INIT=true    # Set to false when ready to enable permissions
```

### Optional Variables (Advanced)
```bash
# Deployment configuration
DRY_RUN=false               # Set to true for preview mode
AUTO_ROLLBACK=true          # Automatically rollback on failure
BACKUP_ENABLED=true         # Create deployment backup

# Emergency settings
EMERGENCY_ROLLBACK=false    # Required for production rollbacks
```

### Setting Environment Variables in Railway
1. Go to your Railway dashboard
2. Select your project and service
3. Go to "Variables" tab
4. Add each variable with its value
5. Deploy the changes

## 📦 Deployment Scenarios

### Scenario 1: Fresh Database (New Installation)
```bash
# 1. Deploy schema and setup basic structure
npm run deploy:production:schema-only

# 2. Verify everything is working
npm run verify:production

# 3. Enable permissions when ready
SKIP_PERMISSION_INIT=false npm run deploy:production:permissions
```

### Scenario 2: Existing Database (Migration)
```bash
# 1. Preview the migration
npm run deploy:production:dry-run

# 2. Deploy with auto-rollback enabled
AUTO_ROLLBACK=true npm run deploy:production:permissions

# 3. Verify successful migration
npm run verify:production:detailed
```

### Scenario 3: Emergency Rollback
```bash
# 1. Preview rollback (recommended first)
npm run rollback:production:dry-run

# 2. Execute rollback (DANGEROUS!)
CONFIRM_ROLLBACK=true EMERGENCY_ROLLBACK=true npm run rollback:production:permissions

# 3. Verify system is restored
npm run verify:production
```

## 🔒 Security Considerations

### Database Security
- Railway PostgreSQL is isolated by default
- Use strong passwords and rotate regularly
- Monitor connection logs for suspicious activity
- Enable Railway's audit logging if available

### Environment Variables
- Never commit secrets to code repository
- Use Railway's encrypted variable storage
- Rotate JWT secrets periodically
- Monitor for unauthorized access

### Access Control
- Limit Railway project access to essential team members
- Use Railway's team management features
- Enable two-factor authentication
- Regular access audits

## 📊 Monitoring and Alerts

### Railway Platform Monitoring
```bash
# View real-time logs
railway logs

# Check service status
railway status

# Monitor resource usage
railway ps
```

### Application Health Checks
```bash
# Verify deployment health
npm run verify:production

# Check specific components
railway run npm run verify:production:detailed

# Database connectivity test
railway run npx prisma db pull --preview-feature
```

### Custom Monitoring Setup
1. **Database Monitoring**
   - Set up connection pool monitoring
   - Track query performance
   - Monitor storage usage

2. **Application Monitoring**
   - API response times
   - Error rates and patterns
   - User authentication success rates

3. **Permission System Monitoring**
   - Permission check performance
   - Failed authorization attempts
   - User role distribution

## 🔄 Rollback Procedures

### When to Rollback
- Permission system is causing authentication failures
- Database corruption or performance issues
- Critical application functionality is broken
- User access is severely impacted

### Rollback Types

#### 1. Application-Level Rollback (Recommended)
```bash
# Revert to previous code version
git revert <commit-hash>
git push origin main

# Railway will auto-deploy the revert
```

#### 2. Permission System Rollback (Nuclear Option)
```bash
# Preview what will be removed
npm run rollback:production:dry-run

# Execute rollback (REMOVES ALL PERMISSION DATA)
CONFIRM_ROLLBACK=true EMERGENCY_ROLLBACK=true npm run rollback:production:permissions
```

#### 3. Database Rollback (Emergency Only)
```bash
# Restore from Railway backup (via Railway dashboard)
# Or use database-specific restore commands
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Migration Fails
```bash
# Check migration status
railway run npx prisma migrate status

# Try manual migration
railway run npx prisma migrate deploy

# Fallback: Push schema directly
railway run npx prisma db push --accept-data-loss
```

#### 2. Permission Seeding Fails
```bash
# Check if permissions already exist
railway run npm run permissions:validate

# Force re-seed (removes existing)
railway run npm run permissions:seed

# Check database connectivity
railway run npx prisma db pull
```

#### 3. User Migration Fails
```bash
# Check user count and roles
railway run npm run verify:production

# Try migration again (idempotent)
railway run npm run permissions:migrate

# Rollback if necessary
railway run npm run permissions:rollback
```

#### 4. Application Won't Start
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables

# Check database connection
railway run npm run verify:production
```

### Emergency Contact Information
- **Railway Support**: support@railway.app
- **Team Lead**: [Your team lead contact]
- **Database Admin**: [Your DBA contact]
- **On-Call Engineer**: [Your on-call contact]

## 📝 Deployment Log Template

```markdown
## Deployment Log: Permission System Migration

**Date**: [Date]
**Engineer**: [Your name]
**Environment**: Production (Railway)
**Deployment Type**: [Schema Only / Full / Rollback]

### Pre-Deployment Status
- Database Users: [count]
- Current Permissions: [count]
- Application Version: [version]

### Deployment Steps
- [ ] Environment variables verified
- [ ] Database backup created
- [ ] Schema migration executed
- [ ] Permission system seeded
- [ ] User migration completed
- [ ] Verification passed

### Post-Deployment Status
- Database Users: [count]
- Total Permissions: [count]
- User Permissions: [count]
- Application Status: [Working / Issues]

### Issues Encountered
[Describe any issues and how they were resolved]

### Rollback Plan
[If needed, describe rollback approach]

### Next Steps
[Any follow-up actions required]
```

## 🎯 Success Criteria

### Deployment Success Indicators
- [ ] All verification checks pass
- [ ] Application starts without errors
- [ ] User authentication works
- [ ] API endpoints respond correctly
- [ ] Role-based access preserved
- [ ] No data loss occurred

### Performance Benchmarks
- [ ] API response times < 200ms
- [ ] Database queries < 100ms average
- [ ] User login time < 2 seconds
- [ ] Permission checks < 10ms

### User Experience Validation
- [ ] All user roles can access appropriate features
- [ ] No unexpected access denials
- [ ] UI displays correctly for all roles
- [ ] Mobile and desktop interfaces work

## 📚 Additional Resources

### Railway Documentation
- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Database Management](https://docs.railway.app/databases/postgresql)

### Internal Documentation
- `README.md` - Permission system overview
- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation notes
- `packages/database/scripts/README.md` - Script documentation

### Support Channels
- Railway Discord: [Railway Community](https://discord.gg/railway)
- Internal Slack: #deployments
- Documentation: `/docs` directory in this repository

---

**Remember**: Production deployments affect real users. Always test thoroughly, have a rollback plan, and deploy during low-traffic periods when possible.