# Railway Deployment Configuration

## Railway Volume Storage Setup

### Required Volume Configuration

1. **Create a Railway Volume**:
   - In Railway dashboard, go to your BFF service
   - Navigate to "Variables" tab
   - Add a new "Volume" mount
   - Set mount path: `/app/storage`
   - Set size: At least 1GB (recommended 5GB for production)

2. **Environment Variables**:
   ```bash
   STORAGE_PATH=/app/storage
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi
   ```

### Health Check Verification

The application includes a startup verification that checks:
- Storage directory exists and is writable
- Volume is properly mounted
- Application can create directories in the storage path

### File Structure in Volume

```
/app/storage/
├── documents/           # Document library files
│   ├── general/        # General access documents
│   ├── department/     # Department-specific documents
│   └── user/          # User-specific documents
├── payroll/            # Payroll-related files
│   ├── csv/           # Uploaded CSV files
│   └── payslips/      # Generated payslips
├── training/           # Training materials
│   ├── videos/        # Video content
│   └── files/         # Document attachments
├── profiles/           # User profile attachments
│   └── ids/           # ID document uploads
└── temp/              # Temporary upload staging
```

### Deployment Checklist

- [ ] Railway volume mounted at `/app/storage`
- [ ] Environment variables configured
- [ ] Storage path accessible (verified in startup logs)
- [ ] File upload endpoints testing successfully
- [ ] Health check endpoint returning 200

### Monitoring

Monitor the following for storage-related issues:
- Disk usage of the volume
- File upload success/failure rates
- Storage access errors in application logs
- Volume mount status in Railway dashboard

### Backup Strategy

Consider implementing:
- Regular volume snapshots via Railway
- Periodic backup of critical files to external storage
- Database backup strategy for file metadata
- Disaster recovery procedures