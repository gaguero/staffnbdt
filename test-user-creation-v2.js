const { chromium } = require('playwright');

async function testUserCreation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Testing user creation fix on Railway...');
    
    // Navigate to the frontend
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.screenshot({ path: '.playwright-mcp/v2-01-homepage-loaded.png' });
    console.log('✅ Homepage loaded');

    // Login with PLATFORM_ADMIN
    console.log('🔐 Logging in with PLATFORM_ADMIN...');
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Look for email input
    const emailInput = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@nayara.com');
    } else {
      console.log('❌ Email input not found, trying different approach...');
      await page.fill('input', 'admin@nayara.com');
    }
    
    // Look for password input
    const passwordInput = await page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
    } else {
      console.log('❌ Password input not found, trying different approach...');
      const inputs = await page.locator('input').all();
      if (inputs.length >= 2) {
        await inputs[1].fill('password123');
      }
    }
    
    await page.screenshot({ path: '.playwright-mcp/v2-02-login-form-filled.png' });
    
    // Submit login
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Sign In")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    } else {
      console.log('❌ Submit button not found, trying Enter key...');
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/v2-03-after-login.png' });
    console.log('✅ Login completed');

    // Check current URL and page content
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Navigate to users page directly
    console.log('👥 Navigating to users page...');
    await page.goto('https://frontend-production-55d3.up.railway.app/users');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/v2-04-users-page-direct.png' });
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('📄 Page contains "User Management":', pageText.includes('User Management'));
    console.log('📄 Page contains "Add User":', pageText.includes('Add User'));
    
    // Look for Add User button with multiple strategies
    console.log('🔍 Looking for Add User button...');
    
    // Strategy 1: Direct text search
    let addUserButton = await page.locator('button:has-text("Add User")').first();
    if (await addUserButton.isVisible()) {
      console.log('✅ Found "Add User" button via text search');
    } else {
      // Strategy 2: Look for any button with "User" in it
      addUserButton = await page.locator('button:has-text("User")').first();
      if (await addUserButton.isVisible()) {
        console.log('✅ Found button with "User" text');
      } else {
        // Strategy 3: Look for buttons with plus icon
        addUserButton = await page.locator('button:has-text("➕"), button:has-text("+")').first();
        if (await addUserButton.isVisible()) {
          console.log('✅ Found button with plus icon');
        } else {
          // Strategy 4: Look for any primary button
          addUserButton = await page.locator('button.btn-primary, .btn.btn-primary').first();
          if (await addUserButton.isVisible()) {
            console.log('✅ Found primary button');
          } else {
            console.log('❌ No Add User button found with any strategy');
            
            // Debug: List all buttons on the page
            const allButtons = await page.locator('button').all();
            console.log(`🔍 Found ${allButtons.length} buttons on page:`);
            for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
              const buttonText = await allButtons[i].textContent();
              const buttonClasses = await allButtons[i].getAttribute('class');
              console.log(`  - Button ${i}: "${buttonText}" (classes: ${buttonClasses})`);
            }
            
            await page.screenshot({ path: '.playwright-mcp/v2-05-no-add-button-debug.png' });
            return false;
          }
        }
      }
    }
    
    // Click the Add User button
    console.log('🖱️ Clicking Add User button...');
    await addUserButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '.playwright-mcp/v2-06-add-user-clicked.png' });
    
    // Check if modal opened
    const modal = await page.locator('.modal, [role="dialog"], .fixed.inset-0').first();
    if (await modal.isVisible()) {
      console.log('✅ Add User modal opened');
      
      // Fill the form
      console.log('📝 Filling user creation form...');
      
      // Use more specific selectors for the modal
      await page.fill('[name="firstName"]', 'Maria');
      await page.fill('[name="lastName"]', 'Rodriguez');
      await page.fill('[name="email"]', 'maria.rodriguez@nayararesorts.com');
      await page.fill('[name="position"]', 'Front Desk Agent');
      await page.fill('[name="phoneNumber"]', '+50771234567');
      
      // Select role
      await page.selectOption('[name="role"]', 'STAFF');
      
      // Select department if available
      const departmentSelect = await page.locator('[name="departmentId"]').first();
      if (await departmentSelect.isVisible()) {
        const options = await departmentSelect.locator('option').all();
        console.log(`🏢 Found ${options.length} department options`);
        if (options.length > 1) {
          await departmentSelect.selectOption({ index: 1 }); // Select first non-empty option
        }
      }
      
      await page.screenshot({ path: '.playwright-mcp/v2-07-form-filled.png' });
      
      // Submit the form
      console.log('💾 Submitting form...');
      const submitBtn = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Create User")').first();
      await submitBtn.click();
      
      // Wait for response
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '.playwright-mcp/v2-08-after-submit.png' });
      
      // Check for success or error
      const hasError = await page.locator('.error, [role="alert"], .alert-error, .text-red').first().isVisible();
      const hasSuccess = await page.locator('.success, .alert-success, .text-green').first().isVisible();
      
      if (hasError) {
        const errorText = await page.locator('.error, [role="alert"], .alert-error, .text-red').first().textContent();
        console.log('❌ Error occurred:', errorText);
        return false;
      } else if (hasSuccess) {
        console.log('✅ Success message found');
        return true;
      } else {
        // Check if modal closed (success indicator)
        const modalStillVisible = await modal.isVisible();
        if (!modalStillVisible) {
          console.log('✅ Modal closed - likely successful');
          return true;
        } else {
          console.log('⚠️ Modal still open, checking page content...');
          const bodyText = await page.textContent('body');
          if (bodyText.includes('created') || bodyText.includes('success')) {
            console.log('✅ Success text found in page');
            return true;
          } else {
            console.log('❌ No clear success indicator');
            return false;
          }
        }
      }
    } else {
      console.log('❌ Add User modal did not open');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: '.playwright-mcp/v2-error-screenshot.png' });
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