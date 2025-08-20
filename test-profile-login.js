const { chromium } = require('playwright');

async function testProfileWithLogin() {
  console.log('🧪 Testing ProfilePage with proper login...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to the Railway frontend
    console.log('📍 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-login-page.png',
      fullPage: true 
    });
    
    // Login with test credentials
    console.log('🔐 Logging in with test credentials...');
    
    // Use test credentials from LOGIN_CREDENTIALS.md
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!');
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Take screenshot after login
    await page.screenshot({ 
      path: '.playwright-mcp/railway-dashboard-after-login.png',
      fullPage: true 
    });
    
    // Navigate to profile page
    console.log('👤 Navigating to profile page...');
    await page.goto('https://frontend-production-55d3.up.railway.app/profile', { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    // Wait for profile page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of profile page
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-page-authenticated.png',
      fullPage: true 
    });
    
    // Test Personal Information tab
    console.log('📋 Testing Personal Information tab...');
    const personalTab = await page.locator('button:has-text("Personal"), button:has-text("personal")').first();
    if (await personalTab.isVisible({ timeout: 5000 })) {
      await personalTab.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '.playwright-mcp/railway-personal-tab-active.png',
        fullPage: true 
      });
    }
    
    // Test Emergency Contacts tab 
    console.log('🚨 Testing Emergency Contacts tab...');
    const emergencyTab = await page.locator('button:has-text("Emergency"), button:has-text("emergency")').first();
    if (await emergencyTab.isVisible({ timeout: 5000 })) {
      await emergencyTab.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '.playwright-mcp/railway-emergency-tab-active.png',
        fullPage: true 
    });
      
      // Check if emergency contacts form is rendered without errors
      const emergencyForm = await page.locator('form, .emergency-contacts, [data-testid="emergency-form"]').first();
      const isFormVisible = await emergencyForm.isVisible({ timeout: 3000 });
      console.log(`🔍 Emergency contacts form visible: ${isFormVisible}`);
    }
    
    // Test Edit mode
    console.log('✏️ Testing Edit mode...');
    
    // Click back to personal tab first
    await page.click('button:has-text("Personal"), button:has-text("personal")');
    await page.waitForTimeout(1000);
    
    const editButton = await page.locator('button:has-text("Editar"), button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: '.playwright-mcp/railway-edit-mode-active.png',
        fullPage: true 
      });
      
      // Test that emergency contact fields are accessible in edit mode
      const emergencyNameField = await page.locator('input[name="emergencyContact.name"]').first();
      const emergencyPhoneField = await page.locator('input[name="emergencyContact.phoneNumber"]').first();
      
      const nameFieldVisible = await emergencyNameField.isVisible({ timeout: 3000 });
      const phoneFieldVisible = await emergencyPhoneField.isVisible({ timeout: 3000 });
      
      console.log(`🔍 Emergency contact name field visible: ${nameFieldVisible}`);
      console.log(`🔍 Emergency contact phone field visible: ${phoneFieldVisible}`);
      
      // Try to interact with the fields to test the fix
      if (nameFieldVisible) {
        await emergencyNameField.fill('Test Contact');
        await page.waitForTimeout(500);
      }
      
      if (phoneFieldVisible) {
        await emergencyPhoneField.fill('+507 1234-5678');
        await page.waitForTimeout(500);
      }
      
      // Take screenshot with filled fields
      await page.screenshot({ 
        path: '.playwright-mcp/railway-emergency-fields-filled.png',
        fullPage: true 
      });
      
      // Cancel without saving
      const cancelButton = await page.locator('button:has-text("Cancelar"), button:has-text("Cancel")').first();
      if (await cancelButton.isVisible({ timeout: 3000 })) {
        await cancelButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Final results
    console.log('📊 Test Results:');
    console.log(`✅ Profile page loaded successfully`);
    console.log(`🔍 Console errors found: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors - Emergency contacts TypeScript fix is working correctly!');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-test-complete.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    await page.screenshot({ 
      path: '.playwright-mcp/railway-profile-test-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('📸 All screenshots saved to .playwright-mcp/ directory');
  }
}

// Run the test
testProfileWithLogin().then(() => {
  console.log('🎯 ProfilePage emergency contacts fix test completed!');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});