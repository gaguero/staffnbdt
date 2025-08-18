const { chromium } = require('playwright');

async function testRailwayLogin() {
  console.log('🚀 Starting Railway deployment test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to Railway frontend
    console.log('📍 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take initial screenshot
    await page.screenshot({ 
      path: 'railway-homepage.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: railway-homepage.png');

    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Look for login form or navigate to login
    console.log('🔍 Looking for login interface...');
    
    // Check if we're already on login page or need to navigate
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    
    if (await emailInput.isVisible()) {
      console.log('✅ Already on login page');
    } else if (await loginButton.isVisible()) {
      console.log('🔗 Clicking login button...');
      await loginButton.first().click();
      await page.waitForTimeout(2000);
    } else {
      console.log('🔍 Looking for login in navigation...');
      // Try common login paths
      try {
        await page.goto('https://frontend-production-55d3.up.railway.app/login');
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('ℹ️  /login route not found, checking for other auth patterns...');
      }
    }

    await page.screenshot({ 
      path: 'railway-login-page.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: railway-login-page.png');

    // Test PLATFORM_ADMIN login
    console.log('🔐 Testing PLATFORM_ADMIN login with admin@nayara.com...');
    
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    
    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('admin@nayara.com');
      await passwordField.fill('password123');
      
      console.log('✅ Credentials entered');
      
      await page.screenshot({ 
        path: 'railway-credentials-filled.png',
        fullPage: true
      });
      console.log('📸 Screenshot taken: railway-credentials-filled.png');

      // Find and click login/submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Submit")');
      
      if (await submitButton.isVisible()) {
        await submitButton.first().click();
        console.log('🚀 Login submitted');
        
        // Wait for navigation or dashboard
        await page.waitForTimeout(3000);
        
        // Check if we're redirected to dashboard
        const currentUrl = page.url();
        console.log('📍 Current URL after login:', currentUrl);
        
        await page.screenshot({ 
          path: 'railway-after-login.png',
          fullPage: true
        });
        console.log('📸 Screenshot taken: railway-after-login.png');
        
        // Look for admin dashboard elements
        const dashboardIndicators = [
          'Users', 'Departments', 'Dashboard', 'Profile', 'Admin', 'Staff',
          'User Management', 'Department Management', 'Create User', 'Add User'
        ];
        
        let dashboardFound = false;
        for (const indicator of dashboardIndicators) {
          const element = page.locator(`text="${indicator}"`);
          if (await element.isVisible()) {
            console.log(`✅ Found dashboard element: ${indicator}`);
            dashboardFound = true;
            break;
          }
        }
        
        if (dashboardFound) {
          console.log('🎉 PLATFORM_ADMIN login successful - dashboard accessible!');
          
          // Test user creation/management
          console.log('🧪 Testing user management functionality...');
          
          const userManagementLinks = page.locator('a:has-text("Users"), a:has-text("User Management"), button:has-text("Users")');
          if (await userManagementLinks.first().isVisible()) {
            await userManagementLinks.first().click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ 
              path: 'railway-user-management.png',
              fullPage: true
            });
            console.log('📸 Screenshot taken: railway-user-management.png');
            
            console.log('✅ User management page accessible');
          }
          
        } else {
          console.log('⚠️  Dashboard elements not found, checking for error messages...');
          
          const errorMessages = await page.locator('.error, .alert-error, [class*="error"]').allTextContents();
          if (errorMessages.length > 0) {
            console.log('❌ Error messages found:', errorMessages);
          }
        }
        
      } else {
        console.log('❌ Submit button not found');
      }
      
    } else {
      console.log('❌ Login form fields not found');
      console.log('Email field visible:', await emailField.isVisible());
      console.log('Password field visible:', await passwordField.isVisible());
    }

    // Test responsive design
    console.log('📱 Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'railway-mobile-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: railway-mobile-view.png');

    // Check console errors
    console.log('🔍 Console errors during test:', consoleErrors);
    
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('⚠️  Console errors found:', consoleErrors.length);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    await page.screenshot({ 
      path: 'railway-error.png',
      fullPage: true
    });
    console.log('📸 Error screenshot taken: railway-error.png');
  }

  await browser.close();
  console.log('🏁 Test completed');
}

testRailwayLogin();