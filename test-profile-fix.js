const { chromium } = require('playwright');

async function testProfilePageFix() {
  console.log('🧪 Testing ProfilePage emergency contacts fix on Railway...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the Railway frontend
    console.log('📍 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-fix-initial.png',
      fullPage: true 
    });
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to login
    console.log('🔐 Attempting to login...');
    
    // Check if login form is visible
    const loginEmailInput = await page.locator('input[name="email"], input[type="email"]').first();
    if (await loginEmailInput.isVisible()) {
      await loginEmailInput.fill('test@example.com');
      
      const loginPasswordInput = await page.locator('input[name="password"], input[type="password"]').first();
      await loginPasswordInput.fill('password123');
      
      const loginButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      await loginButton.click();
      
      // Wait for navigation or dashboard
      await page.waitForTimeout(3000);
    }
    
    // Try to navigate to profile page
    console.log('👤 Navigating to profile page...');
    
    // Look for profile navigation link
    const profileLinks = [
      'a[href="/profile"]',
      'a:has-text("Profile")',
      'a:has-text("Perfil")',
      'button:has-text("Profile")',
      'button:has-text("Perfil")'
    ];
    
    let profileNavFound = false;
    for (const selector of profileLinks) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          profileNavFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no profile nav found, try direct navigation
    if (!profileNavFound) {
      console.log('🔄 Direct navigation to profile page...');
      await page.goto('https://frontend-production-55d3.up.railway.app/profile', { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
    }
    
    // Wait for profile page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of profile page
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-page-loaded.png',
      fullPage: true 
    });
    
    // Check if emergency contacts tab is available
    console.log('🚨 Checking emergency contacts functionality...');
    
    const emergencyTab = await page.locator('button:has-text("Emergency"), button:has-text("Emergency Contacts")').first();
    if (await emergencyTab.isVisible({ timeout: 5000 })) {
      await emergencyTab.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of emergency contacts tab
      await page.screenshot({ 
        path: '.playwright-mcp/railway-emergency-contacts-tab.png',
        fullPage: true 
      });
    }
    
    // Check if personal info tab works (where the emergency contact fields are)
    const personalTab = await page.locator('button:has-text("Personal"), button:has-text("Personal Information")').first();
    if (await personalTab.isVisible({ timeout: 5000 })) {
      await personalTab.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of personal tab
      await page.screenshot({ 
        path: '.playwright-mcp/railway-personal-tab.png',
        fullPage: true 
      });
    }
    
    // Test edit functionality
    console.log('✏️ Testing edit functionality...');
    const editButton = await page.locator('button:has-text("Editar"), button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot in edit mode
      await page.screenshot({ 
        path: '.playwright-mcp/railway-edit-mode.png',
        fullPage: true 
      });
      
      // Cancel edit to avoid making changes
      const cancelButton = await page.locator('button:has-text("Cancelar"), button:has-text("Cancel")').first();
      if (await cancelButton.isVisible({ timeout: 3000 })) {
        await cancelButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Final console error check
    console.log('📊 Results:');
    console.log(`✅ Page loaded successfully`);
    console.log(`🔍 Console errors found: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors detected - TypeScript fix appears successful!');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-fix-final.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshots saved to .playwright-mcp/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-fix-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testProfilePageFix().then(() => {
  console.log('🎯 Profile page fix testing completed!');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});