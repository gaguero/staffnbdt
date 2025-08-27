# Comprehensive UI Testing Guide: Hotel Operations Hub

## Testing Overview

This guide provides step-by-step procedures for testing the Hotel Operations Hub's core features. Focus on functionality verification and user experience optimization.

### Test Account Details
- **Tester**: Roberto Martinez
- **Email**: roberto.martinez@vercel.com
- **Password**: Any password (development mode)
- **Role**: PLATFORM_ADMIN (full access)
- **URL**: https://frontend-production-55d3.up.railway.app

---

## 1. Organizations Module Testing

### 1.1 Basic Functionality

#### Statistics Dashboard
- [ ] Verify statistics cards show correct counts
- [ ] Check Total Organizations, Active, Inactive, Total Properties, Total Users
- [ ] **UX Test**: Try clicking statistics cards (should provide drill-down but may not)

#### List Operations
- [ ] Test search functionality with organization names
- [ ] Test status filter (All/Active/Inactive)
- [ ] Verify organization list loads properly
- [ ] Check pagination if multiple organizations exist

#### CRUD Operations
- [ ] **Create**: Click "➕ Add Organization" button
  - **EXISTS**: Full creation modal with 7 sections (Basic Info, Contact, Branding, Settings)
  - **FIELDS**: name (required), slug (auto-generated), description, timezone, contactEmail, contactPhone, website
  - **VALIDATION**: Built-in validation for email format, URL format, slug format
  - **BRANDING**: Color pickers for primary (#AA8E67), secondary (#F5EBD7), accent (#4A4A4A) colors
  - **SETTINGS**: Default language (en/es), supported languages checkboxes, theme selection
  - Confirm successful creation and list refresh
- [ ] **View**: Click "View" button on any organization
  - **EXISTS**: Comprehensive details modal with 3 tabs: Overview, Properties, Users
  - **OVERVIEW TAB**: Basic info, contact details, settings, branding colors, metadata
  - **PROPERTIES TAB**: Grid view of associated properties with status badges and counts
  - **USERS TAB**: Table view with user roles, positions, and status
  - **VERIFIED**: ✏️ Edit button launches edit modal (permission-gated)
  - **UX LIMITATION**: Properties and Users tabs are VIEW ONLY - no management actions available
- [ ] **Edit**: Click "✏️ Edit" button (permission-gated)
  - **EXISTS**: Full edit modal with same structure as create modal
  - **VERIFIED**: All fields pre-populated with current values
  - **VALIDATION**: Same validation rules as creation
  - Confirm changes save and display
- [ ] **Status Toggle**: "Activate"/"Deactivate" button (permission-gated)
  - **EXISTS**: Immediate status toggle with confirmation
- [ ] **Delete**: "Delete" button with confirmation dialog (permission-gated)
  - **EXISTS**: Confirmation dialog shows impact (properties count, users count)
  - **CONFIRMED**: Cascading deletion warning for associated data

### 1.2 UX Friction Points to Document
- Missing action buttons in organization detail modal tabs
- No bulk operations for multiple organizations
- Statistics cards not interactive
- No quick actions from list view

---

## 2. Properties Module Testing

### 2.1 Basic Functionality

#### Statistics and Filters
- [ ] Verify property statistics accuracy
- [ ] Test organization filter dropdown
- [ ] Test property type filter
- [ ] Test status filter (Active/Inactive)
- [ ] Test search functionality

#### CRUD Operations
- [ ] **Create**: "+ Add Property" button
  - **EXISTS**: Comprehensive form with organization selection, property details, address, contact info
  - **FIELDS**: name (required), type dropdown, organization selection, address object/string, phone, email, website
  - **VALIDATION**: Required field validation, email format, phone format
  - **ADDRESS HANDLING**: Supports both string and object formats (line1, line2, city, state, country, postalCode)
  - Verify successful creation
- [ ] **View**: Property details modal
  - **EXISTS**: Full details modal with 3 tabs: Overview, Departments, Users
  - **OVERVIEW TAB**: Basic info, location (formatted address), contact info, settings, branding colors, metadata
  - **DEPARTMENTS TAB**: Table of associated departments with names, descriptions, status, user counts
  - **USERS TAB**: Table of property users with names, roles, departments, status
  - **UX LIMITATION**: All tabs are VIEW ONLY - no management actions for departments or users
- [ ] **Edit**: "Edit Property" button (permission-gated)
  - **EXISTS**: Edit modal with all property fields
  - **VERIFIED**: Organization reassignment possible
  - **VERIFIED**: Property type changes supported via dropdown
- [ ] **Status Management**: Activate/deactivate toggle
  - **EXISTS**: Status toggle functionality
- [ ] **Delete**: "🗑️" button with confirmation
  - **EXISTS**: Delete functionality with confirmation dialog

### 2.2 Multi-Tenant Relationships
- [ ] Verify properties are properly linked to organizations
- [ ] Test filtering properties by organization
- [ ] Check department counts per property

---

## 3. Departments Module Testing

### 3.1 View Modes
- [ ] **Cards View**: Default department card layout
  - **EXISTS**: Responsive grid layout with department cards
  - **VERIFIED**: Cards show name, description, manager, location, budget, user count, level badges
  - **HIERARCHY DISPLAY**: Cards grouped by parent departments with indentation
  - **ACTIONS**: ✏️ Edit, 🗑️ Delete, 👥 View Staff buttons per card
- [ ] **Hierarchy View**: Department tree structure
  - **EXISTS**: Tree view with proper parent-child relationships
  - **VERIFIED**: Indentation levels, tree connectors (└─), department icons
  - **INTERACTIVE**: Expandable user lists, hover effects
  - **ACTIONS**: Edit and delete buttons with tooltips
- [ ] **Analytics View**: Department statistics and insights
  - **EXISTS**: DepartmentStats component loaded in analytics tab
  - **VERIFIED**: Separate component for advanced analytics
  - **REQUIRES**: Testing the actual DepartmentStats component functionality

### 3.2 Department Management

#### Basic Operations
- [ ] **Create Department**:
  - Fill name, description, location
  - Assign manager from dropdown
  - Set parent department (hierarchy)
  - Set budget amount
  - Verify creation and hierarchy updates
- [ ] **Edit Department**:
  - Modify all department fields
  - Change manager assignment
  - Test budget updates
- [ ] **Delete Department**:
  - Test deletion options (reassign users/children vs unassign)
  - Verify confirmation dialogs
  - Check cascade effects

#### Staff Management
- [ ] **View Staff**: Click "👥" button on department
  - **EXISTS**: DepartmentStaffModal component opens
  - **VERIFIED**: Modal shows department name and ID in props
  - **UX LIMITATION**: Modal implementation details need verification - staff management actions unknown
- [ ] **Manager Assignment**: 
  - **EXISTS**: Manager dropdown in create/edit forms
  - **VERIFIED**: Filters users by role (DEPARTMENT_ADMIN, PROPERTY_MANAGER, ORGANIZATION_ADMIN, etc.)
  - **DISPLAYS**: "FirstName LastName - Position/Role" format
  - **ALLOWS**: Manager unassignment with empty option

### 3.3 Hierarchy Testing
- [ ] Create parent-child department relationships
- [ ] Verify hierarchy displays correctly in tree view
- [ ] Test department level calculations
- [ ] Check that children departments show under parents

---

## 4. Users Module Testing

### 4.1 User Management

#### List Operations
- [ ] Test user list display and pagination
- [ ] Test search by name/email
- [ ] Test role filter dropdown
- [ ] Test department filter
- [ ] Verify user statistics display

#### CRUD Operations
- [ ] **Create User**:
  - Fill all required fields
  - Select role (PLATFORM_ADMIN, ORGANIZATION_OWNER, etc.)
  - Assign to department
  - Set hire date, position, phone
  - Test email validation
  - Verify successful creation
- [ ] **Edit User**:
  - Modify user details
  - Change role assignment
  - Change department assignment
  - Test form validation
- [ ] **Status Management**:
  - Activate/deactivate users
  - Test status change confirmations

### 4.2 Bulk Operations
- [ ] **Bulk Import**: "📤 Bulk Import" button (permission-gated)
  - **EXISTS**: Full CSV import modal with file upload
  - **OPTIONS**: "Validate only" checkbox, "Send invitation emails" checkbox
  - **TEMPLATE**: "Download CSV Template" button provides proper format
  - **RESULTS**: Comprehensive import results modal showing success/failure counts and detailed error reports
  - **VERIFIED**: BulkImportResult interface with successCount, failureCount, failed array
- [ ] **Export**: "📥 Export CSV" button (permission-gated)
  - **EXISTS**: Export functionality with current filter application
  - **GENERATES**: CSV download with filename format "users-export-YYYY-MM-DD.csv"
  - **VERIFIED**: Applies current search/filter state to export

### 4.3 Role and Permission Testing
- [ ] Test role assignments (with Roberto's admin access)
- [ ] Verify department assignments work correctly
- [ ] Test manager assignments for departments

---

## 5. Profile Module Testing

### 5.1 Profile Tabs Navigation
- [ ] **Personal Tab**: Basic information editing
- [ ] **Emergency Contacts Tab**: Contact management
- [ ] **Photos Tab**: Profile photo and gallery
- [ ] **Documents Tab**: ID document uploads
- [ ] **Security Tab**: Password and security settings

### 5.2 Personal Information
- [ ] **Edit Mode**: Toggle editing on/off
- [ ] **Form Fields**: Test all personal info fields
  - First/Last name
  - Phone number
  - Position
  - Department display
- [ ] **Save Changes**: Verify updates persist
- [ ] **Cancel Changes**: Test form reset

### 5.3 Photo Management
- [ ] **Profile Photo Upload** (Legacy Single Upload):
  - **EXISTS**: ProfilePhotoUpload component in "Quick Photo Upload" section
  - **VERIFIED**: Handles photo update and delete operations
  - **API**: Uses `/api/profile/photo/${profile.id}` endpoint
  - **UX**: Error handling for failed photo loads
- [ ] **Photo Gallery** (Multi-Photo System):
  - **EXISTS**: PhotoGallery component in "Professional Photo Gallery" section
  - **SUPPORTS**: Up to 4 different photo types for professional contexts
  - **LOGIC**: First uploaded photo becomes primary photo automatically
  - **FEATURES**: Photo deletion, primary photo updates, thumbnail grid
  - **INTEGRATION**: Updates both local state and auth context on changes

### 5.4 Emergency Contacts
- [ ] **Add Contact**: Create new emergency contact
- [ ] **Edit Contact**: Modify existing contact details
- [ ] **Delete Contact**: Remove emergency contact
- [ ] **Data Format**: Verify both legacy and new format handling

### 5.5 Document Management
- [ ] **ID Document Upload**: Upload identification documents
- [ ] **Document Verification**: Check verification status
- [ ] **Document Download**: Access uploaded documents

---

## 6. Cross-Module Integration Testing

### 6.1 Navigation Flow
- [ ] Organizations → Properties → Departments → Users
- [ ] **BREADCRUMB NAVIGATION**: NOT IMPLEMENTED
  - **CODE ANALYSIS**: No breadcrumb component found in App.tsx or Layout.tsx
  - **CURRENT NAVIGATION**: Only main menu items in sidebar, no path indication
  - **UX IMPROVEMENT OPPORTUNITY**: Add breadcrumb navigation for better context
- [ ] **Context Switching**: Sidebar navigation between modules
  - **EXISTS**: NavLink components with active state styling
  - **VERIFIED**: Role-based navigation filtering
- [ ] **Direct Navigation**: No inter-module navigation implemented
  - **UX LIMITATION**: Must use main navigation to switch between related entities

### 6.2 Data Consistency
- [ ] Create organization → Add property → Create department → Assign users
- [ ] Verify counts update across all modules
- [ ] Test cascading deletions
- [ ] Check reference integrity

### 6.3 Performance and Responsiveness
- [ ] Test loading times for each module
- [ ] Verify responsive design on mobile/tablet
- [ ] Check for memory leaks during navigation
- [ ] Test concurrent user actions

---

## 7. Error Handling and Edge Cases

### 7.1 Form Validation
- [ ] Test required field validation
- [ ] Test email format validation
- [ ] Test date field formats
- [ ] Test numeric field limits
- [ ] Test special characters in text fields

### 7.2 Network Error Handling
- [ ] Test behavior with slow network
- [ ] Check error messages for failed API calls
- [ ] Verify retry mechanisms
- [ ] Test offline behavior

### 7.3 Edge Cases
- [ ] Test with empty databases
- [ ] Test with maximum data loads
- [ ] Test concurrent editing of same records
- [ ] Test session timeout handling

---

## 8. Documentation Requirements

For each issue found, document:
- **Module**: Which feature area
- **Steps to Reproduce**: Exact user actions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Severity**: Critical/Major/Minor
- **Screenshots**: Visual evidence
- **Console Errors**: Any browser console messages

### UX Improvement Categories
- **Missing Actions**: Features that should exist but don't
- **Workflow Efficiency**: Ways to reduce clicks/steps
- **Information Architecture**: Better data organization
- **Visual Design**: Layout and presentation improvements
- **Performance**: Speed and responsiveness issues

This comprehensive testing approach ensures thorough coverage of all core features while maintaining focus on real-world usability and workflow optimization.