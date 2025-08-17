const { chromium } = require('playwright');

async function testRailwayDeployment() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Testing Railway deployment at https://frontend-production-55d3.up.railway.app');
    
    // Navigate to Railway deployment
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: 'railway-homepage.png', 
      fullPage: true 
    });
    console.log('✅ Homepage screenshot saved: railway-homepage.png');
    
    // Check for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a moment for any console errors to appear
    await page.waitForTimeout(3000);
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if the app loaded (look for React root or common elements)
    const hasReactRoot = await page.locator('#root').isVisible();
    console.log('⚛️ React root element present:', hasReactRoot);
    
    // Try to find navigation or header elements
    const hasNavigation = await page.locator('nav, header, [role="navigation"]').count() > 0;
    console.log('🧭 Navigation elements found:', hasNavigation);
    
    // Test login page if available
    try {
      // Look for login button or link
      const loginButton = page.locator('text=/login|sign in/i').first();
      if (await loginButton.isVisible()) {
        console.log('🔐 Login button found, testing login page...');
        await loginButton.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot of login page
        await page.screenshot({ 
          path: 'railway-login-page.png', 
          fullPage: true 
        });
        console.log('✅ Login page screenshot saved: railway-login-page.png');
      } else {
        console.log('ℹ️ No login button found on homepage');
      }
    } catch (error) {
      console.log('⚠️ Could not access login page:', error.message);
    }
    
    // Check for any network errors
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Report network errors
    if (networkErrors.length > 0) {
      console.log('❌ Network Errors Found:');
      networkErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No network errors detected');
    }
    
    // Check if this looks like the multi-tenant app
    const hasMultiTenantElements = await page.locator('text=/organization|property|tenant/i').count() > 0;
    console.log('🏢 Multi-tenant elements detected:', hasMultiTenantElements);
    
    console.log('\n🎉 Railway deployment test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'railway-error.png', 
      fullPage: true 
    });
    console.log('📸 Error screenshot saved: railway-error.png');
  } finally {
    await browser.close();
  }
}

testRailwayDeployment();