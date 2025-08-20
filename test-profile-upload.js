const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor console messages and network requests
    const logs = [];
    const networkErrors = [];
    
    page.on('console', (msg) => {
      logs.push(`Console [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') && !response.ok()) {
        try {
          const text = await response.text();
          networkErrors.push(`${response.status()} ${response.statusText()} - ${url} - ${text}`);
        } catch (e) {
          networkErrors.push(`${response.status()} ${response.statusText()} - ${url}`);
        }
      }
    });

    console.log('🚀 Navigating to Railway frontend...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'railway-profile-photo-fix-test-initial.png', fullPage: true });
    console.log('📸 Initial screenshot taken');
    
    // Try to login
    console.log('🔐 Attempting to login...');
    
    // Check if login form exists
    const loginEmailExists = await page.$('input[name="email"], input[type="email"]');
    if (loginEmailExists) {
      await page.type('input[name="email"], input[type="email"]', 'admin@hotel.com');
      await page.type('input[name="password"], input[type="password"]', 'admin123');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'railway-profile-photo-fix-dashboard.png', fullPage: true });
      console.log('📸 Dashboard screenshot taken');
    } else {
      console.log('ℹ️ Already logged in or no login form found');
    }
    
    // Navigate to profile page
    console.log('👤 Navigating to profile page...');
    
    // Try multiple selectors for profile navigation
    const profileSelectors = [
      'a[href*="/profile"]',
      'a[href*="/user"]',
      '[data-testid="profile"]',
    ];
    
    let profileFound = false;
    for (const selector of profileSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await page.click(selector);
          profileFound = true;
          console.log(`✅ Found profile link with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!profileFound) {
      // Try direct navigation
      console.log('🔗 Trying direct navigation to profile...');
      await page.goto('https://frontend-production-55d3.up.railway.app/profile', { 
        waitUntil: 'networkidle2' 
      });
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'railway-profile-photo-fix-profile-page.png', fullPage: true });
    console.log('📸 Profile page screenshot taken');
    
    // Look for profile photo upload elements
    console.log('📷 Looking for profile photo upload elements...');
    
    const photoUploadSelectors = [
      'input[type="file"]',
      'input[accept*="image"]',
      '[data-testid="photo-upload"]',
      '.profile-photo input',
      '#profile-photo-upload'
    ];
    
    let uploadElement = null;
    for (const selector of photoUploadSelectors) {
      try {
        uploadElement = await page.$(selector);
        if (uploadElement) {
          console.log(`✅ Found upload element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (uploadElement) {
      console.log('📤 Testing file upload...');
      
      // Create a small test image file (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      // Write test file
      fs.writeFileSync('test-profile-photo.png', testImageBuffer);
      
      // Upload the file
      await uploadElement.uploadFile('test-profile-photo.png');
      console.log('📁 File uploaded to input element');
      
      // Look for upload button or form submission
      const uploadButtons = [
        'button[type="submit"]',
        '[data-testid="upload-button"]'
      ];
      
      for (const buttonSelector of uploadButtons) {
        try {
          const button = await page.$(buttonSelector);
          if (button) {
            await page.click(buttonSelector);
            console.log(`✅ Clicked upload button: ${buttonSelector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Take screenshot after upload attempt
      await page.screenshot({ path: 'railway-profile-photo-upload-test.png', fullPage: true });
      console.log('📸 Upload test screenshot taken');
      
    } else {
      console.log('❌ No file upload element found');
    }
    
    // Check console logs and network errors
    console.log('\n📋 Console Logs:');
    logs.forEach(log => console.log('  ', log));
    
    console.log('\n🌐 Network Errors:');
    if (networkErrors.length === 0) {
      console.log('  ✅ No network errors detected');
    } else {
      networkErrors.forEach(error => console.log('  ❌', error));
    }
    
    // Clean up test file
    try {
      fs.unlinkSync('test-profile-photo.png');
    } catch (e) {
      // Ignore cleanup errors
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
})();