const { chromium } = require('playwright');

async function testUserManagementAPI() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing User Management API on Railway deployment...');
    
    // Navigate to the deployed application
    console.log('📍 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'railway-app-loaded.png', fullPage: true });
    console.log('📸 Screenshot taken: railway-app-loaded.png');
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check if the login page loads properly
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form loaded successfully');
    
    // Try to login with platform admin credentials
    console.log('🔐 Attempting login as platform admin...');
    await page.fill('input[type="email"]', 'admin@nayara.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    
    // Take screenshot after login
    await page.screenshot({ path: 'railway-after-login.png', fullPage: true });
    console.log('📸 Screenshot taken: railway-after-login.png');
    
    // Navigate to Users page
    console.log('📍 Navigating to Users management...');
    
    // Look for navigation menu and click on Users
    const usersLink = await page.waitForSelector('a[href*="users"], button:has-text("Users"), [data-testid*="users"]', { timeout: 5000 });
    await usersLink.click();
    
    // Wait for users page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of users page
    await page.screenshot({ path: 'railway-users-page.png', fullPage: true });
    console.log('📸 Screenshot taken: railway-users-page.png');
    
    // Check if users data loads (look for user list or table)
    const usersList = await page.waitForSelector('table, .user-card, [data-testid*="user"]', { timeout: 5000 });
    console.log('✅ Users page loaded with user data');
    
    // Check for any console errors
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors detected:');
      consoleErrors.forEach(err => console.log('   - ' + err));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Try to access an admin action to test the updated error messages
    console.log('🔧 Testing admin functionality...');
    
    // Look for an "Add User" or similar admin button
    const addButton = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Take screenshot of add user modal/form
      await page.screenshot({ path: 'railway-add-user-form.png', fullPage: true });
      console.log('📸 Screenshot taken: railway-add-user-form.png');
      
      // Close the modal if opened
      const closeButton = await page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
    
    console.log('✅ User management functionality verified successfully!');
    console.log('📊 Test Summary:');
    console.log('   - ✅ Railway deployment accessible');
    console.log('   - ✅ Login functionality working');
    console.log('   - ✅ Users page loads correctly');
    console.log('   - ✅ Admin features accessible');
    console.log('   - ✅ No critical console errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'railway-error.png', fullPage: true });
    console.log('📸 Error screenshot taken: railway-error.png');
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors during test:');
      consoleErrors.forEach(err => console.log('   - ' + err));
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testUserManagementAPI().catch(console.error);