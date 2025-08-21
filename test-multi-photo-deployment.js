const { chromium } = require('playwright');

(async () => {
  console.log('⏳ Waiting for Railway deployment to complete...');
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Testing multi-photo system deployment...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '.playwright-mcp/homepage-after-deployment.png', fullPage: true });
    
    // Check if login is needed
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/login') || await page.locator('input[type="email"]').isVisible()) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', 'admin@vanguardtech.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '.playwright-mcp/logged-in-after-deployment.png', fullPage: true });
    }
    
    // Navigate to profile page
    console.log('👤 Navigating to profile page...');
    await page.goto('https://frontend-production-55d3.up.railway.app/profile', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '.playwright-mcp/profile-page-deployed.png', fullPage: true });
    
    // Check for Photo Gallery tab
    console.log('🖼️ Looking for Photo Gallery tab...');
    const galleryTab = page.locator('button:has-text("Photo Gallery")');
    if (await galleryTab.isVisible()) {
      console.log('✅ Photo Gallery tab found! Clicking it...');
      await galleryTab.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '.playwright-mcp/photo-gallery-tab.png', fullPage: true });
      
      // Check for all 4 photo types
      const photoTypes = ['Formal', 'Casual', 'Uniform', 'Fun'];
      for (const type of photoTypes) {
        const photoSection = page.locator(`h4:has-text("${type}")`);
        if (await photoSection.isVisible()) {
          console.log(`✅ ${type} photo section found`);
        } else {
          console.log(`❌ ${type} photo section not found`);
        }
      }
      
      // Look for style guidance
      const guidanceText = page.locator('text=Professional attire, neutral background');
      if (await guidanceText.isVisible()) {
        console.log('✅ Style guidance found for photos');
      }
      
      // Check for upload areas
      const choosePhotoButtons = page.locator('button:has-text("Choose Photo")');
      const buttonCount = await choosePhotoButtons.count();
      console.log(`🔄 Found ${buttonCount} photo upload areas`);
      
    } else {
      console.log('❌ Photo Gallery tab not found');
    }
    
    // Check legacy photo tab too
    console.log('📸 Checking legacy Profile Photo tab...');
    const profilePhotoTab = page.locator('button:has-text("Profile Photo")');
    if (await profilePhotoTab.isVisible()) {
      await profilePhotoTab.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '.playwright-mcp/profile-photo-tab.png', fullPage: true });
      console.log('✅ Legacy Profile Photo tab working');
    }
    
    // Check console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('❌ Console errors:', consoleErrors);
    }
    
    console.log('🎉 Multi-photo system deployment test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '.playwright-mcp/deployment-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();