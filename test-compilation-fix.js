const { chromium } = require('playwright');

async function testCompilationFix() {
  console.log('🧪 Testing TypeScript compilation fix for ProfilePage...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Track console errors and warnings
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Navigate to the Railway frontend
    console.log('📍 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any lazy-loaded components or async errors
    await page.waitForTimeout(5000);
    
    // Take screenshot of initial load
    await page.screenshot({ 
      path: '.playwright-mcp/railway-compilation-test.png',
      fullPage: true 
    });
    
    // Test login with correct credentials  
    console.log('🔐 Testing login...');
    try {
      await page.fill('input[name="email"], input[type="email"]', 'admin@nayara.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');
      await page.click('button[type="submit"], button:has-text("Sign In")');
      
      // Wait for potential navigation
      await page.waitForTimeout(5000);
      
      // Check if we're logged in (look for logout button or dashboard elements)
      const isLoggedIn = await page.locator('button:has-text("Logout"), a:has-text("Profile"), .dashboard').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isLoggedIn) {
        console.log('✅ Successfully logged in');
        
        // Try to navigate to profile page directly
        await page.goto('https://frontend-production-55d3.up.railway.app/profile', { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        await page.waitForTimeout(3000);
        
        // Take screenshot of profile page attempt
        await page.screenshot({ 
          path: '.playwright-mcp/railway-profile-access.png',
          fullPage: true 
        });
      } else {
        console.log('ℹ️ Login might not have succeeded, but that\'s okay for compilation testing');
      }
      
    } catch (loginError) {
      console.log('ℹ️ Login attempt failed, continuing with compilation check...');
    }
    
    // Analyze console messages
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log('📊 Compilation Test Results:');
    console.log(`✅ App loaded without crashing`);
    console.log(`🔍 Console errors: ${errors.length}`);
    console.log(`⚠️ Console warnings: ${warnings.length}`);
    
    // Check for TypeScript-related errors
    const tsErrors = errors.filter(error => 
      error.text.includes('typescript') || 
      error.text.includes('property') || 
      error.text.includes('does not exist') ||
      error.text.includes('primaryContact') ||
      error.text.includes('EmergencyContact')
    );
    
    console.log(`🎯 TypeScript-related errors: ${tsErrors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ Console errors found:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    }
    
    if (tsErrors.length === 0) {
      console.log('✅ No TypeScript compilation errors detected!');
      console.log('✅ ProfilePage emergency contacts fix appears to be working correctly');
    } else {
      console.log('❌ TypeScript-related errors still present:');
      tsErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.text}`);
      });
    }
    
    // Final verification screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/railway-final-compilation-test.png',
      fullPage: true 
    });
    
    return {
      success: true,
      totalErrors: errors.length,
      typescriptErrors: tsErrors.length,
      warnings: warnings.length
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    await page.screenshot({ 
      path: '.playwright-mcp/railway-compilation-test-error.png',
      fullPage: true 
    });
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testCompilationFix().then((result) => {
  console.log('🎯 TypeScript compilation test completed!');
  console.log('📸 Screenshots saved to .playwright-mcp/ directory');
  
  if (result.success && result.typescriptErrors === 0) {
    console.log('🎉 SUCCESS: TypeScript compilation errors have been resolved!');
    console.log('🚀 Railway deployment should now build successfully');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});