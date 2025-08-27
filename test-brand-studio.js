const playwright = require('playwright');

async function testBrandStudio() {
  let browser = null;
  
  try {
    // Launch browser
    browser = await playwright.chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🧪 Testing Brand Studio on Railway deployment...');
    
    // Navigate to the frontend
    console.log('📍 Navigating to production environment...');
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.waitForTimeout(3000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Check if login form exists
    const loginForm = await page.locator('form').count();
    console.log(`✅ Login form found: ${loginForm > 0 ? 'Yes' : 'No'}`);
    
    // Login with test credentials
    console.log('🔐 Attempting login...');
    await page.fill('input[name="email"]', 'admin@nayara.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForTimeout(5000);
    
    // Check if we're logged in (should redirect to dashboard)
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
      await page.screenshot({ path: 'dashboard-loaded.png', fullPage: true });
      
      // Navigate to Brand Studio
      console.log('🎨 Navigating to Brand Studio...');
      await page.goto('https://frontend-production-55d3.up.railway.app/brand-studio');
      await page.waitForTimeout(3000);
      
      // Check if Brand Studio page loads
      const brandStudioTitle = await page.locator('h1:has-text("Brand Studio")').count();
      console.log(`✅ Brand Studio title found: ${brandStudioTitle > 0 ? 'Yes' : 'No'}`);
      
      // Take screenshot of Brand Studio
      await page.screenshot({ path: 'brand-studio-page.png', fullPage: true });
      console.log('📸 Brand Studio page screenshot saved');
      
      // Test the tabs
      console.log('🔄 Testing Brand Studio tabs...');
      
      // Check Colors tab
      const colorsTab = await page.locator('button:has-text("Colors")').count();
      console.log(`📊 Colors tab found: ${colorsTab > 0 ? 'Yes' : 'No'}`);
      
      // Check Typography tab
      const typographyTab = await page.locator('button:has-text("Typography")').count();
      console.log(`✏️ Typography tab found: ${typographyTab > 0 ? 'Yes' : 'No'}`);
      
      // Check Assets tab
      const assetsTab = await page.locator('button:has-text("Assets")').count();
      console.log(`📸 Assets tab found: ${assetsTab > 0 ? 'Yes' : 'No'}`);
      
      // Check Preview tab
      const previewTab = await page.locator('button:has-text("Preview")').count();
      console.log(`👁️ Preview tab found: ${previewTab > 0 ? 'Yes' : 'No'}`);
      
      // Test clicking on Typography tab
      if (typographyTab > 0) {
        await page.click('button:has-text("Typography")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'brand-studio-typography.png', fullPage: true });
        console.log('📸 Typography tab screenshot saved');
      }
      
      // Test clicking on Assets tab
      if (assetsTab > 0) {
        await page.click('button:has-text("Assets")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'brand-studio-assets.png', fullPage: true });
        console.log('📸 Assets tab screenshot saved');
      }
      
      // Test clicking on Preview tab
      if (previewTab > 0) {
        await page.click('button:has-text("Preview")');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'brand-studio-preview.png', fullPage: true });
        console.log('📸 Preview tab screenshot saved');
      }
      
      // Check for any JavaScript errors
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      // Wait a bit more for any async operations
      await page.waitForTimeout(2000);
      
      if (logs.length > 0) {
        console.log('❌ JavaScript errors found:');
        logs.forEach(log => console.log(`  - ${log}`));
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      // Test some interactive features
      console.log('🧪 Testing interactive features...');
      
      // Go back to Colors tab and test color picker
      await page.click('button:has-text("Colors")');
      await page.waitForTimeout(1000);
      
      // Look for color picker buttons
      const colorPickerButtons = await page.locator('button:has([style*="backgroundColor"])').count();
      console.log(`🎨 Color picker buttons found: ${colorPickerButtons}`);
      
      if (colorPickerButtons > 0) {
        // Click on first color picker
        await page.click('button:has([style*="backgroundColor"]) >> first');
        await page.waitForTimeout(1000);
        
        // Check if color picker modal opened
        const colorPickerModal = await page.locator('.absolute.top-12').count();
        console.log(`🎨 Color picker modal opened: ${colorPickerModal > 0 ? 'Yes' : 'No'}`);
        
        if (colorPickerModal > 0) {
          await page.screenshot({ path: 'color-picker-modal.png', fullPage: true });
          console.log('📸 Color picker modal screenshot saved');
        }
      }
      
    } else {
      console.log('❌ Login failed or unexpected redirect');
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
    }
    
    console.log('🏁 Brand Studio testing complete');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (browser) {
      const page = (await browser.contexts())[0]?.pages()[0];
      if (page) {
        await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
        console.log('📸 Error screenshot saved');
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testBrandStudio().catch(console.error);