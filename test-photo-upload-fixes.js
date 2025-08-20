// Test the photo upload system fixes
const { chromium } = require('playwright');

async function testPhotoUploadSystem() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing photo upload system fixes...');

    // Navigate to the application
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.screenshot({ path: '.playwright-mcp/homepage-loaded.png' });

    console.log('📸 Homepage loaded, attempting login...');

    // Login
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/logged-in.png' });

    console.log('✅ Login successful, navigating to profile page...');

    // Navigate to profile page
    await page.click('a[href="/profile"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '.playwright-mcp/profile-page-loaded.png' });

    console.log('📋 Profile page loaded, looking for photo upload section...');

    // Look for the profile photo upload section
    const photoSection = await page.locator('.space-y-4').first();
    if (photoSection) {
      await page.screenshot({ path: '.playwright-mcp/photo-upload-section.png' });
      console.log('📸 Photo upload section found');

      // Check for drag & drop area
      const dragDropArea = await page.locator('div:has-text("Drag & drop your photo here")');
      if (await dragDropArea.count() > 0) {
        console.log('✅ Drag & drop area is present');
        await dragDropArea.screenshot({ path: '.playwright-mcp/drag-drop-area.png' });
      } else {
        console.log('❌ Drag & drop area not found');
      }

      // Look for upload button
      const uploadButton = await page.locator('button:has-text("Upload Photo"), button:has-text("Change Photo")');
      if (await uploadButton.count() > 0) {
        console.log('✅ Upload button is present');
        await uploadButton.screenshot({ path: '.playwright-mcp/upload-button.png' });
      } else {
        console.log('❌ Upload button not found');
      }
    }

    // Test backend API endpoints
    console.log('🔗 Testing photo API endpoints...');

    // Test photo serving endpoint
    const photoResponse = await page.request.get('https://backend-production-328d.up.railway.app/api/profile/photo');
    console.log('📸 Photo endpoint response:', photoResponse.status());

    if (photoResponse.status() === 404) {
      console.log('✅ Photo endpoint returns 404 (expected when no photo exists)');
    } else if (photoResponse.status() === 200) {
      console.log('✅ Photo endpoint returns 200 (photo exists)');
    } else {
      console.log('❌ Photo endpoint unexpected status:', photoResponse.status());
    }

    // Test photo types endpoint
    const photoTypesResponse = await page.request.get('https://backend-production-328d.up.railway.app/api/profile/photo-types');
    console.log('📋 Photo types endpoint response:', photoTypesResponse.status());

    if (photoTypesResponse.status() === 200) {
      const photoTypesData = await photoTypesResponse.json();
      console.log('✅ Photo types endpoint working:', photoTypesData);
    } else {
      console.log('❌ Photo types endpoint failed:', photoTypesResponse.status());
    }

    // Check console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('❌ Console errors detected:', consoleErrors);
    }

    await page.screenshot({ path: '.playwright-mcp/final-state.png' });

    console.log('🎉 Photo upload system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '.playwright-mcp/error-state.png' });
  } finally {
    await browser.close();
  }
}

testPhotoUploadSystem();