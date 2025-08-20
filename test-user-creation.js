const { chromium } = require('playwright');

async function testUserCreation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Testing user creation fix on Railway...');
    
    // Navigate to the frontend
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.screenshot({ path: '.playwright-mcp/01-homepage-loaded.png' });
    console.log('✅ Homepage loaded');

    // Login with PLATFORM_ADMIN
    console.log('🔐 Logging in with PLATFORM_ADMIN...');
    
    // Look for login button or form
    const loginButton = await page.locator('button:has-text("Sign in"), button:has-text("Login"), a:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    
    // Fill in login form
    await page.fill('input[name="email"], input[type="email"]', 'admin@nayara.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.screenshot({ path: '.playwright-mcp/02-login-form-filled.png' });
    
    // Submit login
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/03-after-login.png' });
    console.log('✅ Login completed');

    // Navigate to users page
    console.log('👥 Navigating to users page...');
    const usersLink = await page.locator('a:has-text("Users"), a:has-text("User Management"), [href*="users"]').first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
    } else {
      // Try direct navigation
      await page.goto('https://frontend-production-55d3.up.railway.app/users');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '.playwright-mcp/04-users-page-loaded.png' });
    console.log('✅ Users page loaded');

    // Look for "Add User" button
    console.log('➕ Looking for Add User button...');
    const addUserButton = await page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User")').first();
    
    if (await addUserButton.isVisible()) {
      await addUserButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '.playwright-mcp/05-add-user-form-opened.png' });
      console.log('✅ Add User form opened');

      // Fill in the user form with the test data
      console.log('📝 Filling in user form...');
      
      await page.fill('input[name="firstName"]', 'Maria');
      await page.fill('input[name="lastName"]', 'Rodriguez');
      await page.fill('input[name="email"]', 'maria.rodriguez@nayararesorts.com');
      
      // Select role if dropdown exists
      const roleSelect = await page.locator('select[name="role"], .role-select').first();
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('STAFF');
      }
      
      // Fill other fields
      await page.fill('input[name="position"]', 'Front Desk Agent');
      await page.fill('input[name="phoneNumber"]', '+50771234567');
      
      // Select department if dropdown exists
      const departmentSelect = await page.locator('select[name="departmentId"], .department-select').first();
      if (await departmentSelect.isVisible()) {
        await departmentSelect.selectOption({ label: 'Front Desk' });
      }
      
      await page.screenshot({ path: '.playwright-mcp/06-form-filled.png' });
      console.log('✅ Form filled with test data');

      // Submit the form
      console.log('💾 Submitting user creation form...');
      const submitButton = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      await submitButton.click();
      
      // Wait for result
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '.playwright-mcp/07-after-submission.png' });
      
      // Check for success or error messages
      const errorMessage = await page.locator('.error, [role="alert"], .alert-error').first();
      const successMessage = await page.locator('.success, .alert-success, [role="status"]').first();
      
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('❌ Error occurred:', errorText);
        await page.screenshot({ path: '.playwright-mcp/08-error-result.png' });
        return false;
      } else if (await successMessage.isVisible()) {
        const successText = await successMessage.textContent();
        console.log('✅ Success:', successText);
        await page.screenshot({ path: '.playwright-mcp/08-success-result.png' });
        return true;
      } else {
        console.log('⚠️ No clear success/error message, checking page state...');
        
        // Check if we're back on users list (success indicator)
        const usersList = await page.locator('table, .users-list, .user-table').first();
        if (await usersList.isVisible()) {
          console.log('✅ Back on users list - likely successful');
          await page.screenshot({ path: '.playwright-mcp/08-back-on-users-list.png' });
          return true;
        }
        
        await page.screenshot({ path: '.playwright-mcp/08-unclear-result.png' });
        return false;
      }
    } else {
      console.log('❌ Add User button not found');
      await page.screenshot({ path: '.playwright-mcp/05-no-add-button.png' });
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '.playwright-mcp/error-screenshot.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testUserCreation().then(success => {
  if (success) {
    console.log('🎉 User creation test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 User creation test FAILED!');
    process.exit(1);
  }
});