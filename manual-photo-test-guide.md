# Manual Photo Upload Testing Guide

## Testing the Fixed Photo Upload and Cropping Issues

### Test Environment
- **Frontend URL**: https://frontend-production-55d3.up.railway.app
- **Backend URL**: https://backend-production-55d3.up.railway.app

### Fixed Issues
1. ✅ `completedCrop` state initialization 
2. ✅ Canvas element proper initialization
3. ✅ Image loading state management
4. ✅ File input reference conflicts
5. ✅ Removed hardcoded "Nayara" branding

### Test Steps

#### Test 1: Basic Photo Upload (ProfilePhotoUpload Component)
1. Navigate to the application
2. Login with test credentials
3. Go to **Profile** → **Photos** tab
4. Scroll down to **"Quick Photo Upload"** section (legacy mode)
5. Click **"Upload Photo"** or drag an image file
6. **Expected**: 
   - Image preview loads
   - Cropping modal opens with center square crop
   - Console logs show: "Image loaded for cropping"

#### Test 2: Multi-Photo System (PhotoGallery Component)  
1. In the same Photos tab, scroll up to **"Professional Photo Gallery"** section
2. Try uploading to each photo type:
   - **Formal** (👔): Professional headshot
   - **Casual** (😊): Friendly team photo
   - **Uniform** (👕): Work attire photo  
   - **Fun** (🎉): Creative personality photo
3. For each photo type:
   - Click **"Choose Photo"** 
   - Select an image file
   - **Expected**: Unique file input works (no conflicts)
   - Cropping modal opens properly

#### Test 3: Cropping Interface
1. Once cropping modal is open:
   - **Expected**: Center square crop area is visible
   - Drag the crop corners to adjust
   - **Expected**: Console logs show "Crop changing:" and "Crop completed:"
   - Click **"Upload Photo"**
   - **Expected**: NO "Failed to crop image" error
   - **Expected**: Upload progress shows
   - **Expected**: Photo appears after upload

#### Test 4: Error Cases
1. Try uploading a very large file (>5MB)
   - **Expected**: Clear error message about file size
2. Try uploading an unsupported format (like .gif or .bmp)
   - **Expected**: Clear error message about file type
3. Check browser console throughout
   - **Expected**: Debug logs showing crop states
   - **Expected**: No JavaScript errors

### Debug Information to Check
Open browser dev tools console and look for these logs:
- `"Image loaded for cropping"` or `"PhotoGallery image loaded for cropping"`
- `"Crop changing:"` with crop data
- `"Crop completed:"` with pixel crop coordinates
- `"getCroppedCanvas called with:"` with canvas state
- `"Canvas cropping successful:"` with output details

### Success Criteria
- ✅ Image preview loads without errors
- ✅ Cropping interface initializes properly
- ✅ Crop area can be adjusted by dragging
- ✅ Upload completes successfully 
- ✅ Photo appears in the interface
- ✅ No "Failed to crop image" errors
- ✅ Console shows proper debug information
- ✅ All 4 photo types work independently
- ✅ Generic "Hotel Operations Hub" branding (no "Nayara")

### If Issues Persist
1. Check browser console for specific error messages
2. Take screenshots of the cropping interface
3. Note which photo type (if any) is causing issues
4. Check if the error is in canvas initialization or blob creation

### Known Improvements Made
- Added `imageLoaded` state to ensure proper timing
- Force `completedCrop` initialization after image loads
- Unique file input refs for each photo type
- Enhanced error handling and debugging
- Improved canvas context validation
- Added comprehensive logging for troubleshooting