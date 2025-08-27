# Bug Report Template

## Bug Information

### Bug ID
**BR-[DATE]-[NUMBER]** (e.g., BR-20241221-001)

### Date Reported
**Date**: [YYYY-MM-DD]  
**Time**: [HH:MM] [Timezone]  
**Tester**: Roberto Martinez  
**Environment**: Production Railway Deployment

### Bug Summary
**Title**: [Brief, descriptive title of the issue]  
**Module**: [Organizations/Properties/Departments/Users/Profile]  
**Component**: [Specific page or modal name]  
**Severity**: [Critical/Major/Minor]

---

## Bug Details

### Description
[Clear, concise description of what went wrong]

### Steps to Reproduce
1. [First action taken]
2. [Second action taken]
3. [Third action taken]
4. [Continue with specific steps...]

### Expected Behavior
[What should have happened]

### Actual Behavior
[What actually happened instead]

### Reproducibility
- [ ] Always reproducible
- [ ] Sometimes reproducible (intermittent)
- [ ] Rarely reproducible
- [ ] Unable to reproduce

---

## Environment Details

### Browser Information
- **Browser**: [Chrome/Firefox/Safari]
- **Version**: [Browser version number]
- **Operating System**: [Windows/macOS/Linux]
- **Screen Resolution**: [e.g., 1920x1080]
- **Device Type**: [Desktop/Mobile/Tablet]

### Account Information
- **User**: roberto.martinez@vercel.com
- **Role**: PLATFORM_ADMIN
- **Session Duration**: [How long logged in]

### Network Conditions
- **Connection Type**: [WiFi/Ethernet/Mobile]
- **Speed**: [Fast/Normal/Slow]
- **Stability**: [Stable/Intermittent/Poor]

---

## Technical Information

### Console Errors
```
[Copy any JavaScript console errors here]
Example:
Uncaught TypeError: Cannot read property 'id' of undefined
    at OrganizationModal.tsx:45:12
```

### Network Requests
- **Failed API Calls**: [List any 4xx or 5xx responses]
- **Slow Requests**: [Requests taking >5 seconds]
- **Request Details**: 
  ```
  URL: [API endpoint]
  Method: [GET/POST/PUT/DELETE]
  Status: [HTTP status code]
  Response Time: [milliseconds]
  ```

### Browser DevTools Information
- **Elements**: [Any DOM issues noticed]
- **Console**: [All console messages/warnings]
- **Network**: [Failed or slow requests]
- **Application**: [Storage/cookie issues]

---

## Visual Evidence

### Screenshots
- [ ] **Before Action**: Screenshot showing initial state
- [ ] **Error State**: Screenshot showing the bug
- [ ] **Console**: Screenshot of browser console with errors
- [ ] **Network Tab**: Screenshot of failed requests (if applicable)

### Video Recording
- [ ] **Screen Recording**: [If bug involves interaction/animation]
- **Duration**: [Length of video]
- **File Size**: [Size of recording]

---

## Impact Assessment

### User Impact
- **Affected Users**: [Who experiences this bug]
- **Frequency**: [How often does this occur]
- **Workaround**: [Is there a way to accomplish the task differently]

### Business Impact
- **Data Loss**: [ ] Yes [ ] No
- **Security Risk**: [ ] Yes [ ] No
- **Performance Impact**: [ ] Yes [ ] No
- **Feature Blocking**: [ ] Yes [ ] No

### Severity Justification
**Critical**: System crash, data loss, security breach, core functionality completely broken
**Major**: Important feature not working, significant workflow disruption, affects many users
**Minor**: Small inconvenience, cosmetic issue, affects few users, workaround available

---

## Additional Context

### Related Issues
- **Similar Bugs**: [Reference to related bugs]
- **Recent Changes**: [Any recent system updates]
- **Data Context**: [Specific data being used]

### Testing Notes
- **First Occurrence**: [When first noticed]
- **Attempted Fixes**: [What was tried to resolve]
- **Other Browsers**: [Tested in other browsers]
- **Other Accounts**: [Tested with different user accounts]

---

## Developer Information

### Component References
- **File Path**: [e.g., apps/web/src/pages/OrganizationsPage.tsx]
- **Line Number**: [Approximate line where issue occurs]
- **Function/Method**: [Specific function with the bug]

### Possible Causes
[Tester's best guess about what might be causing the issue]

### Suggested Investigation
[Areas developers should look at first]

---

## Resolution Tracking

### Developer Assignment
- **Assigned To**: [Developer name]
- **Assignment Date**: [YYYY-MM-DD]
- **Priority**: [P0/P1/P2/P3]

### Progress Updates
| Date | Status | Notes |
|------|--------|--------|
| [YYYY-MM-DD] | New | Bug reported |
| [YYYY-MM-DD] | In Progress | [Developer notes] |
| [YYYY-MM-DD] | Testing | [Testing notes] |
| [YYYY-MM-DD] | Resolved | [Resolution description] |

### Resolution Details
- **Root Cause**: [What caused the bug]
- **Fix Applied**: [How it was fixed]
- **Testing Required**: [What needs to be retested]
- **Release Version**: [When fix will be deployed]

---

## Verification

### Re-testing Checklist
- [ ] **Original Steps**: Bug no longer occurs with original steps
- [ ] **Edge Cases**: Related edge cases also work
- [ ] **Regression**: No new bugs introduced
- [ ] **Performance**: Fix doesn't impact performance

### Sign-off
- **Tester Verification**: [Name and date]
- **Developer Confirmation**: [Name and date]
- **Quality Assurance**: [Name and date]

---

## Example Bug Report

### Bug ID: BR-20241221-001

**Title**: Organization Details Modal - Properties Tab Shows No Action Buttons  
**Module**: Organizations  
**Component**: OrganizationDetailsModal  
**Severity**: Major

### Description
When viewing an organization's details and clicking on the Properties tab, the list of properties is displayed but there are no action buttons to add, edit, or delete properties directly from this view.

### Steps to Reproduce
1. Login as roberto.martinez@vercel.com
2. Navigate to Organizations page
3. Click "View" on any organization with properties
4. Click on "Properties" tab in the modal
5. Observe the properties list

### Expected Behavior
Properties tab should include action buttons such as:
- "Add Property" button
- "Edit" button for each property
- "Delete" button for each property
- "View Details" button for each property

### Actual Behavior
Properties are displayed in a read-only list with no interactive elements or action buttons.

### Impact
Users must navigate to the Properties page separately to manage properties, causing workflow inefficiency and context switching.

### Technical Notes
- **File**: OrganizationDetailsModal.tsx
- **Issue**: Properties tab lacks contextual action buttons
- **UX Impact**: Forces navigation to separate module for property management

This is an excellent example of the UX friction points this testing is designed to identify.