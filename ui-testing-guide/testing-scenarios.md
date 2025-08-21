# Real-World Testing Scenarios

## Complete User Journey Testing

### Scenario 1: New Hotel Chain Setup
**Goal**: Test complete organization setup from scratch

#### Steps:
1. **Create Organization**
   - Login as Roberto Martinez
   - Navigate to Organizations
   - Click "Add Organization"
   - Fill: Name "Grand Hotels", Slug "grand-hotels"
   - Add contact email, phone, website
   - Save and verify creation

2. **Add First Property**
   - From Organizations list, click "View" on Grand Hotels
   - **UX Test**: Look for "Add Property" button in modal (may not exist)
   - Navigate to Properties page
   - Click "Add Property"
   - Select "Grand Hotels" as organization
   - Fill property details: "Grand Hotel Downtown", type "Hotel"
   - Add address, phone, manager info
   - Save and verify

3. **Create Department Structure**
   - Navigate to Departments
   - Create "Operations" (parent department)
   - Create "Front Desk" (child of Operations)
   - Create "Housekeeping" (child of Operations)
   - Create "Administration" (standalone department)
   - Verify hierarchy displays correctly

4. **Add Staff Members**
   - Navigate to User Management
   - Create Front Desk Manager:
     - Role: DEPARTMENT_ADMIN
     - Department: Front Desk
     - Position: Front Desk Manager
   - Create Housekeeping Staff:
     - Role: STAFF
     - Department: Housekeeping
     - Position: Room Attendant
   - Verify users appear in correct departments

#### Expected Results:
- Complete organizational structure created
- Proper hierarchy relationships
- Staff assigned to correct departments
- Statistics update across all modules

#### UX Issues to Document:
- Missing contextual "Add" buttons in view modals
- Excessive navigation between modules for setup
- No bulk user creation for initial staff

---

### Scenario 2: Department Reorganization
**Goal**: Test moving staff and restructuring departments

#### Steps:
1. **View Current Structure**
   - Navigate to Departments → Hierarchy view
   - Document current department tree
   - Note staff assignments

2. **Create New Department**
   - Add "Guest Services" under Operations
   - Set budget: $150,000
   - Assign manager from existing staff

3. **Reassign Staff**
   - Move 2 staff members from Front Desk to Guest Services
   - **UX Test**: Can this be done from department view?
   - Change department manager assignments
   - Update reporting relationships

4. **Verify Changes**
   - Check user counts in department cards
   - Verify hierarchy updates correctly
   - Confirm analytics reflect changes

#### Expected Results:
- Staff successfully moved between departments
- Department counts update immediately
- Analytics and statistics reflect new structure

#### UX Issues to Document:
- Difficulty of staff reassignment process
- No bulk user movement options
- Missing manager change notifications

---

### Scenario 3: Property Portfolio Management
**Goal**: Test managing multiple properties under one organization

#### Steps:
1. **Add Multiple Properties**
   - Create 3 properties under Grand Hotels:
     - "Grand Hotel Beach Resort"
     - "Grand Hotel City Center"
     - "Grand Hotel Airport"
   - Set different property types and managers

2. **Department Replication**
   - Create similar department structures for each property
   - Test if departments can be copied between properties
   - Assign property-specific managers

3. **Cross-Property Staff Management**
   - Create staff assigned to multiple properties
   - Test property switching functionality
   - Verify permissions across properties

4. **Portfolio Overview**
   - View organization statistics
   - Check property comparison capabilities
   - Test filtering by property

#### Expected Results:
- Multiple properties managed efficiently
- Cross-property relationships work
- Portfolio-level insights available

#### UX Issues to Document:
- No template system for department structures
- Difficult cross-property staff management
- Limited portfolio-level analytics

---

### Scenario 4: User Onboarding Workflow
**Goal**: Test complete new employee setup

#### Steps:
1. **Bulk Import Preparation**
   - Prepare CSV file with 10 new employees
   - Include varied roles and departments
   - Test validation-only import first

2. **Execute Import**
   - Run actual import with invitation sending
   - Monitor import results
   - Check for any failed imports

3. **Manual Setup for Failed Imports**
   - Create users that failed import manually
   - Complete profile information
   - Upload profile photos and ID documents

4. **Department Assignment**
   - Assign users to appropriate departments
   - Set reporting relationships
   - Update department budgets if needed

5. **Profile Completion Testing**
   - Test profile photo upload and cropping
   - Add emergency contact information
   - Upload ID documents for verification

#### Expected Results:
- Bulk import works without errors
- Manual user creation seamless
- Profile completion straightforward

#### UX Issues to Document:
- Import error handling and recovery
- Profile completion workflow efficiency
- Missing profile completion guidance

---

### Scenario 5: Analytics and Reporting
**Goal**: Test department analytics and insights

#### Steps:
1. **Access Analytics**
   - Navigate to Departments → Analytics view
   - **Note**: This requires special permissions (Roberto should have access)
   - Review all available charts and statistics

2. **Data Verification**
   - Compare analytics numbers with manual counts
   - Check growth trends accuracy
   - Verify role distribution charts

3. **Interactive Elements**
   - **UX Test**: Try clicking on charts for drill-down
   - Test filtering analytics by date range
   - Check export functionality

4. **Cross-Module Consistency**
   - Compare analytics data with individual department cards
   - Verify organization-level statistics match
   - Check property-level breakdowns

#### Expected Results:
- Analytics load and display correctly
- Data matches manual verification
- Interactive elements work as expected

#### UX Issues to Document:
- Limited interactivity in charts
- Missing export capabilities
- No drill-down functionality

---

## Edge Case Testing Scenarios

### Scenario 6: Data Validation and Error Handling

#### Invalid Data Testing:
- [ ] **Email Validation**: Try invalid email formats
- [ ] **Phone Numbers**: Test various phone number formats
- [ ] **Date Fields**: Enter invalid dates (future hire dates, etc.)
- [ ] **Numeric Fields**: Test negative budgets, extreme values
- [ ] **Text Length**: Exceed character limits in description fields

#### Network Error Testing:
- [ ] **Slow Connection**: Test behavior with throttled network
- [ ] **Connection Loss**: Simulate network disconnection during operations
- [ ] **Server Errors**: Check error message display and recovery options
- [ ] **Timeout Handling**: Test long-running operations

#### Concurrent User Testing:
- [ ] **Simultaneous Edits**: Two users editing same record
- [ ] **Race Conditions**: Rapid successive operations
- [ ] **Data Refresh**: Auto-refresh during active editing

### Scenario 7: Performance and Scale Testing

#### Large Dataset Testing:
- [ ] **100+ Organizations**: Test performance with many organizations
- [ ] **500+ Users**: Check user list pagination and search
- [ ] **Deep Hierarchy**: Create 5+ level department nesting
- [ ] **Large Files**: Upload maximum size profile photos and documents

#### Mobile Device Testing:
- [ ] **Responsive Design**: Test all modules on mobile/tablet
- [ ] **Touch Interactions**: Verify mobile-friendly controls
- [ ] **Performance**: Check loading times on mobile networks

---

## Data Integrity Scenarios

### Scenario 8: Cascade Operations

#### Deletion Testing:
1. **Organization with Dependencies**
   - Create org with properties, departments, users
   - Attempt deletion
   - Verify proper cascade warnings
   - Test reassignment options

2. **Department Deletion**
   - Delete department with staff
   - Test user reassignment workflow
   - Verify child department handling

3. **Property Removal**
   - Remove property with departments
   - Check department reassignment
   - Verify user property access updates

#### Reference Integrity:
- [ ] **Manager Deletion**: Delete user who manages departments
- [ ] **Organization Changes**: Move properties between organizations
- [ ] **Role Changes**: Change user roles and verify access updates

---

## Performance Benchmarks

### Loading Time Expectations:
- **Initial Page Load**: < 3 seconds
- **Module Navigation**: < 1 second
- **Search Results**: < 2 seconds
- **Form Submission**: < 5 seconds
- **File Upload**: Progress indication for >10MB files

### User Experience Metrics:
- **Clicks to Complete Task**: Document for common operations
- **Error Recovery**: Time to resolve common mistakes
- **Form Completion**: Efficiency of data entry workflows

---

## Documentation Template for Each Scenario

```markdown
### Scenario: [Name]
**Date Tested**: 
**Tester**: Roberto Martinez
**Environment**: Production Railway deployment

#### Test Results:
- [ ] Completed Successfully
- [ ] Completed with Issues
- [ ] Failed to Complete

#### Issues Found:
1. **Issue Description**
   - Severity: Critical/Major/Minor
   - Steps to Reproduce:
   - Expected vs Actual Behavior:
   - Screenshots/Console Errors:

#### UX Improvements Identified:
1. **Improvement Description**
   - Current Workflow: 
   - Suggested Improvement:
   - Potential Impact:

#### Performance Notes:
- Loading times:
- Responsiveness:
- Error handling:

#### Overall Assessment:
- Functionality Score: /10
- User Experience Score: /10
- Performance Score: /10
- Comments:
```

These scenarios provide comprehensive coverage of the Hotel Operations Hub's functionality while focusing on real-world usage patterns and workflow optimization opportunities.