# Test Data Setup Guide

## Environment Access

### Application URLs
- **Frontend**: https://frontend-production-55d3.up.railway.app
- **Backend API**: Auto-configured via Railway internal networking

### Test Account
- **Email**: roberto.martinez@vercel.com
- **Password**: Any password (development mode accepts any password)
- **Role**: PLATFORM_ADMIN
- **Access Level**: Full system access with no restrictions

### Browser Requirements
- **Primary**: Chrome (latest version) with DevTools
- **Secondary**: Firefox or Safari for cross-browser testing
- **Mobile Testing**: Chrome DevTools device simulation

---

## Initial System State

### Existing Data
The system contains seeded data from previous testing:

#### Organizations
- Multiple hotel organizations already exist
- Mix of active and inactive organizations
- Various contact information and descriptions

#### Properties
- Properties assigned to different organizations
- Different property types (Hotel, Resort, etc.)
- Various managers and locations

#### Departments
- Established department hierarchies
- Manager assignments
- Budget allocations
- Mix of parent and child departments

#### Users
- Various user roles (Platform Admin, Department Admin, Staff)
- Different department assignments
- Complete user profiles with photos and emergency contacts

### Data to Verify
- [ ] **Organizations**: At least 5-10 organizations present
- [ ] **Properties**: Multiple properties per organization
- [ ] **Departments**: Hierarchical structure exists
- [ ] **Users**: 20+ users with various roles
- [ ] **Analytics Data**: Department statistics populated

---

## Creating Test Data

### Test Organization Setup
If you need fresh test data:

#### 1. Create Test Organization
```
Name: "QA Test Hotels"
Slug: "qa-test-hotels"
Description: "Test organization for QA validation"
Contact Email: test@qahotels.com
Contact Phone: +1-555-0123
Website: https://qahotels.example.com
Status: Active
```

#### 2. Add Test Property
```
Name: "QA Grand Hotel"
Type: "Hotel"
Organization: QA Test Hotels
Address: 
  Street: 123 Test Avenue
  City: Testing City
  State: QA State
  Country: United States
  Postal Code: 12345
Phone: +1-555-0456
Status: Active
```

#### 3. Create Test Departments
```
1. Operations (Parent)
   - Budget: $500,000
   - Manager: Assign existing user
   
2. Front Desk (Child of Operations)
   - Budget: $150,000
   - Manager: Assign existing user
   
3. Housekeeping (Child of Operations)
   - Budget: $200,000
   - Manager: Assign existing user
   
4. Administration (Standalone)
   - Budget: $100,000
   - Manager: Assign existing user
```

#### 4. Add Test Users
```
1. Front Desk Manager
   - Name: Jane Smith
   - Email: jane.smith@qahotels.test
   - Role: DEPARTMENT_ADMIN
   - Department: Front Desk
   - Position: Front Desk Manager
   - Hire Date: 2024-01-15
   
2. Housekeeper
   - Name: Maria Garcia
   - Email: maria.garcia@qahotels.test
   - Role: STAFF
   - Department: Housekeeping
   - Position: Room Attendant
   - Hire Date: 2024-02-01
```

---

## File Upload Test Data

### Profile Photos
Prepare test images for upload:
- **Small Image**: 100KB JPEG for quick upload testing
- **Large Image**: 5MB+ JPEG for performance testing
- **Various Formats**: PNG, JPEG, GIF for format testing
- **Invalid Files**: PDF, TXT files for error testing

### ID Documents
Prepare test documents:
- **Valid PDF**: Sample ID document (not real personal info)
- **Large PDF**: 10MB+ file for size limit testing
- **Invalid Format**: Image files where PDF expected
- **Corrupt File**: Damaged file for error handling

### CSV Import Files
Create test CSV files for bulk import:

#### Valid User Import CSV
```csv
firstName,lastName,email,role,departmentId,position,phoneNumber,hireDate
John,Doe,john.doe@test.com,STAFF,dept-id-here,Receptionist,555-0001,2024-01-01
Jane,Smith,jane.smith@test.com,DEPARTMENT_ADMIN,dept-id-here,Manager,555-0002,2024-01-15
```

#### Invalid CSV (for error testing)
```csv
firstName,lastName,email,role,departmentId,position,phoneNumber,hireDate
,Incomplete,missing.first@test.com,STAFF,dept-id,Position,555-0003,2024-01-01
John,Invalid,invalid-email,INVALID_ROLE,bad-dept,Position,invalid-phone,invalid-date
```

---

## Test Scenarios Data Requirements

### Scenario 1: New Hotel Chain
**Goal**: Test complete setup from scratch
**Required**: Clean organization state or willingness to delete test data

### Scenario 2: Department Reorganization
**Required**: 
- Existing department with 3+ staff members
- Alternative department for staff reassignment
- Manager users available for reassignment

### Scenario 3: Property Portfolio
**Required**: 
- Organization with 2+ properties
- Users assigned to multiple properties
- Department structures across properties

### Scenario 4: User Onboarding
**Required**: 
- Valid CSV file with 5-10 user records
- Department IDs for user assignment
- Email addresses for invitation testing

### Scenario 5: Analytics Testing
**Required**: 
- Roberto Martinez account (already has analytics permissions)
- Populated departments with users
- Historical data for trend analysis

---

## Data Verification Checklist

### Before Testing
- [ ] **Login Successful**: Roberto Martinez account works
- [ ] **Role Verified**: PLATFORM_ADMIN permissions confirmed
- [ ] **Data Present**: Organizations, properties, departments, users exist
- [ ] **Relationships**: Parent-child relationships established
- [ ] **Analytics**: Department analytics accessible

### During Testing
- [ ] **Data Integrity**: Changes reflect across related modules
- [ ] **Counts Accurate**: Statistics match manual counts
- [ ] **Relationships Maintained**: Deletions handle dependencies correctly
- [ ] **Search Functional**: Search returns expected results

### After Testing
- [ ] **Test Data Cleanup**: Remove/mark test data created during session
- [ ] **System State**: Leave system in stable state for future testing
- [ ] **Documentation**: Record any permanent data changes made

---

## Known Data Issues

### Current System State
Based on previous testing sessions:

#### Organizations
- Some organizations may have incomplete contact information
- Mix of real and test data from previous sessions

#### Departments
- Department analytics require specific permission configuration
- Some departments may lack manager assignments

#### Users
- Various test users exist with different permission levels
- Some users may have incomplete profiles

#### Files/Photos
- Previous test uploads may exist in the system
- Gallery may contain test images from previous sessions

### Workarounds
- **Missing Managers**: Use existing users or create new ones
- **Incomplete Profiles**: Complete during profile testing
- **Test Data Mixing**: Use consistent naming convention (prefix with "QA-" or "TEST-")

---

## Performance Testing Data

### Large Dataset Testing
If testing with large datasets:

#### Organizations (100+)
- Use consistent naming: "Test Org 001", "Test Org 002", etc.
- Vary status between active/inactive
- Include complete contact information

#### Users (500+)
- Use CSV bulk import for efficient creation
- Distribute across multiple departments
- Use realistic but clearly test email addresses

#### Files (Large Uploads)
- Prepare 10MB+ test images
- Multiple concurrent upload testing
- Various file formats for compatibility testing

### Performance Benchmarks
- **Page Load**: < 3 seconds with 100+ organizations
- **Search**: < 2 seconds with 500+ users
- **Import**: 50 users should complete within 30 seconds
- **File Upload**: 5MB image should upload within 10 seconds

---

## Emergency Procedures

### If System Becomes Unresponsive
1. **Check Network**: Verify internet connection
2. **Refresh Browser**: Hard refresh (Ctrl+F5)
3. **Clear Cache**: Clear browser cache and cookies
4. **Try Incognito**: Test in private/incognito window
5. **Different Browser**: Switch to Firefox/Safari

### If Data Becomes Corrupted
1. **Document Issue**: Take screenshots and note exact steps
2. **Don't Delete**: Preserve corrupted data for debugging
3. **Use Different Data**: Switch to alternative test records
4. **Report Issue**: Note in testing documentation

### If Account Access Lost
1. **Try Alternative Login**: Test with different browser
2. **Clear Cookies**: Remove authentication cookies
3. **Contact Development**: Report authentication issues
4. **Use Backup Account**: If alternative test accounts available

This setup guide ensures Roberto has all necessary data and procedures for comprehensive testing while maintaining system integrity and providing fallback options for common issues.