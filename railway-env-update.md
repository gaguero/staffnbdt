# Railway Environment Variables Update - R2 Fix

## ⚠️ CRITICAL: Update These Environment Variables in Railway Dashboard

The R2 connection is failing because Railway deployment has **outdated credentials**. 

### 🔧 Required Environment Variables for Railway

Copy and paste these into the Railway dashboard for **dev environment**:

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:FKoqzYFizlVtabOdDgfxykAwAZuExGbW@shuttle.proxy.rlwy.net:43481/railway
JWT_SECRET=21KJ2BN21Y4223-125245642/12125412ASASXAXAX
JWT_EXPIRY=7d

# ✅ UPDATED R2 Configuration (FIXED CREDENTIALS + ENABLED)
R2_ACCOUNT_ID=5d3433b8618a65d5e8d459bd785d5f78
R2_ACCESS_KEY_ID=e73fae23393cfd49e2f6734b87d8625f
R2_SECRET_ACCESS_KEY=347f5467439c446b771ff27b7cf962f7bd92db3250d99c36bb1b5588fb3f7ecf
R2_BUCKET_NAME=hoh
R2_PUBLIC_URL=https://5d3433b8618a65d5e8d459bd785d5f78.r2.cloudflarestorage.com

# 🔴 CRITICAL: Enable R2 Storage (MISSING FROM RAILWAY)
STORAGE_USE_R2=true
STORAGE_HYBRID_MODE=false

# File Upload Configuration  
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx,mp4,avi

# Frontend Configuration
VITE_API_URL=http://localhost:3000
```

## 🔴 Key Changes Made

### 1. **R2_SECRET_ACCESS_KEY Updated**
- **OLD (broken)**: `021ab25f7ffc5b1d8adfa02612f2719916edf222ec37d423867a5c17e8600c17`
- **NEW (working)**: `347f5467439c446b771ff27b7cf962f7bd92db3250d99c36bb1b5588fb3f7ecf`

### 2. **Confirmed Working Credentials**
- These credentials were **tested and verified working** locally with our diagnostic script
- All R2 operations (bucket access, list objects, file upload) **passed successfully**

## 📊 Current Status

### ✅ Local Testing Results
```
Configuration: ✅ VALID
Bucket Access:  ✅ SUCCESS  
List Objects:   ✅ SUCCESS
File Upload:    ✅ SUCCESS
🏁 OVERALL RESULT: ✅ ALL TESTS PASSED
```

### ❌ Railway Deployment Issues  
```
- Backend 404 errors: "User not found" on /profile/photos
- Profile photo failed to load
- R2 connectivity failing  
- OLD credentials still in Railway environment
```

## 🚀 Deployment Steps

1. **Update Railway Environment Variables**
   - Go to Railway dashboard
   - Navigate to the backend service environment variables
   - Update the R2_SECRET_ACCESS_KEY with new value
   - Verify all other R2 variables match the list above

2. **Trigger Deployment**
   - Railway should auto-deploy after env variable changes
   - Monitor deployment logs for R2 connection success

3. **Verify Fix**
   - Test profile photo upload functionality  
   - Check backend logs for successful R2 health check
   - Confirm no more "Profile photo failed to load" errors

## 🧪 Post-Deployment Testing

After updating environment variables, test these endpoints:
- `GET /profile/photos` - Should return user photos
- `POST /profile/photos` - Should allow photo uploads
- Profile page photo display - Should show images correctly

---

**Note**: The R2 connection has been tested and confirmed working locally. The issue is specifically that Railway deployment environment has outdated credentials.