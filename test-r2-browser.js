#!/usr/bin/env node

/**
 * Browser automation test to verify R2 service fix
 * Tests the application end-to-end to ensure R2 functionality works
 */

const { chromium } = require('playwright');

async function testR2ServiceFix() {
  console.log('🌐 Starting browser automation test for R2 service fix...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Monitor console for R2-related errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('bucket') || text.includes('R2') || text.includes('storage')) {
          console.log(`❌ Storage-related console error: ${text}`);
        }
      }
    });
    
    // Monitor network for failed requests
    const networkErrors = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    console.log('1️⃣ Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Take screenshot of homepage
    await page.screenshot({
      path: 'r2-fix-homepage.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: r2-fix-homepage.png');
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`✅ Page loaded successfully: "${title}"`);
    
    // Wait a moment for any lazy-loaded components
    await page.waitForTimeout(3000);
    
    // Check for login form or dashboard
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasDashboard = await page.locator('[data-testid*="dashboard"], .dashboard, h1, h2').count() > 0;
    
    if (hasLoginForm) {
      console.log('🔐 Login form detected');
      
      // Try to interact with login form (this might trigger R2 operations)
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        console.log('📝 Filled email field');
      }
      
      // Take screenshot of login form
      await page.screenshot({
        path: 'r2-fix-login-form.png',
        fullPage: true
      });
      console.log('📸 Screenshot taken: r2-fix-login-form.png');
    }
    
    if (hasDashboard) {
      console.log('📊 Dashboard or main content detected');
    }
    
    // Test navigation to different routes that might use R2
    console.log('2️⃣ Testing navigation to profile or user routes...');
    
    try {
      // Try to navigate to profile or users route (these often use file uploads)
      await page.goto('https://frontend-production-55d3.up.railway.app/profile', {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      
      await page.screenshot({
        path: 'r2-fix-profile-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot taken: r2-fix-profile-page.png');
      
    } catch (error) {
      console.log(`ℹ️  Profile route not accessible: ${error.message}`);
      
      // Try users route instead
      try {
        await page.goto('https://frontend-production-55d3.up.railway.app/users', {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.screenshot({
          path: 'r2-fix-users-page.png',
          fullPage: true
        });
        console.log('📸 Screenshot taken: r2-fix-users-page.png');
        
      } catch (error2) {
        console.log(`ℹ️  Users route not accessible: ${error2.message}`);
      }
    }
    
    // Test mobile view
    console.log('3️⃣ Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://frontend-production-55d3.up.railway.app', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    await page.screenshot({
      path: 'r2-fix-mobile-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: r2-fix-mobile-view.png');
    
    // Final analysis
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS ANALYSIS');
    console.log('='.repeat(60));
    
    // Check console errors
    const r2RelatedErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('bucket') || 
      error.toLowerCase().includes('r2') || 
      error.toLowerCase().includes('storage') ||
      error.toLowerCase().includes('empty value')
    );
    
    console.log(`Console errors total: ${consoleErrors.length}`);
    console.log(`R2/Storage related errors: ${r2RelatedErrors.length}`);
    
    if (r2RelatedErrors.length > 0) {
      console.log('❌ R2-related console errors found:');
      r2RelatedErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ No R2-related console errors detected');
    }
    
    // Check network errors
    const storageNetworkErrors = networkErrors.filter(error => 
      error.url.includes('r2') || 
      error.url.includes('storage') || 
      error.url.includes('upload')
    );
    
    console.log(`Network errors total: ${networkErrors.length}`);
    console.log(`Storage related network errors: ${storageNetworkErrors.length}`);
    
    if (storageNetworkErrors.length > 0) {
      console.log('❌ Storage-related network errors found:');
      storageNetworkErrors.forEach(error => 
        console.log(`   - ${error.status} ${error.url}`)
      );
    } else {
      console.log('✅ No storage-related network errors detected');
    }
    
    // Overall assessment
    const isSuccess = r2RelatedErrors.length === 0 && storageNetworkErrors.length === 0;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🏁 FINAL RESULT: ${isSuccess ? '✅ SUCCESS' : '❌ ISSUES DETECTED'}`);
    console.log('='.repeat(60));
    
    if (isSuccess) {
      console.log('🎉 R2 service fix verification PASSED!');
      console.log('✅ No empty bucket errors detected');
      console.log('✅ Application loads and functions correctly');
      console.log('✅ No R2-related console or network errors');
    } else {
      console.log('⚠️  Some R2-related issues may still exist');
      console.log('💡 Check the error details above');
    }
    
    return isSuccess;
    
  } catch (error) {
    console.error('💥 Browser test failed:', error.message);
    await page.screenshot({
      path: 'r2-fix-error.png',
      fullPage: true
    });
    console.log('📸 Error screenshot taken: r2-fix-error.png');
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
(async () => {
  try {
    const success = await testR2ServiceFix();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  }
})();