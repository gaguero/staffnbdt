const { chromium } = require('playwright');

async function testDeployment() {
  console.log('🚀 Testing Railway deployment after Prisma fixes...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 API Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 API Response: ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        console.log(`❌ Error response: ${response.status()} ${response.url()}`);
      }
    }
  });
  
  // Capture console logs and errors
  const consoleMessages = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(message);
    console.log(`🖥️ Console: ${message}`);
    
    if (msg.type() === 'error') {
      consoleErrors.push(message);
      console.log(`🚨 Console Error: ${message}`);
    }
  });
  
  try {
    console.log('\n1️⃣ Navigating to Railway frontend deployment...');
    await page.goto('https://frontend-production-55d3.up.railway.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ 
      path: 'deployment-test-1-initial.png', 
      fullPage: true 
    });
    
    console.log('\n2️⃣ Waiting for page to fully load...');
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking loaded page screenshot...');
    await page.screenshot({ 
      path: 'deployment-test-2-loaded.png', 
      fullPage: true 
    });
    
    console.log('\n3️⃣ Checking for permission-related API calls...');
    
    // Look for login form or navigation that might trigger permission calls
    const loginButton = await page.$('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), a:has-text("Sign In")');
    if (loginButton) {
      console.log('🔐 Found login button, clicking to test authentication flow...');
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'deployment-test-3-login-clicked.png', 
        fullPage: true 
      });
    }
    
    // Check if there are any forms to test
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (emailInput) {
      console.log('📧 Found email input, testing login flow...');
      await emailInput.fill('test@example.com');
      
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      if (passwordInput) {
        await passwordInput.fill('testpassword');
        
        const submitButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
        if (submitButton) {
          console.log('🔑 Attempting login to trigger permission calls...');
          await submitButton.click();
          await page.waitForTimeout(5000);
          
          await page.screenshot({ 
            path: 'deployment-test-4-login-attempt.png', 
            fullPage: true 
          });
        }
      }
    }
    
    console.log('\n4️⃣ Testing API endpoints directly...');
    
    // Test the specific permission endpoint that was failing
    try {
      const response = await page.goto('https://frontend-production-55d3.up.railway.app/api/permissions/my/summary', {
        waitUntil: 'networkidle'
      });
      console.log(`📊 /api/permissions/my/summary responded with: ${response.status()}`);
      
      if (response.status() === 200) {
        console.log('✅ Permission endpoint is now working! (200 response)');
      } else if (response.status() === 401) {
        console.log('🔐 Permission endpoint requires authentication (401 - expected)');
      } else if (response.status() === 500) {
        console.log('❌ Still getting 500 error on permission endpoint');
      }
    } catch (error) {
      console.log(`⚠️ Could not test permission endpoint directly: ${error.message}`);
    }
    
    // Go back to main page
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.waitForTimeout(2000);
    
    console.log('\n5️⃣ Final screenshot and summary...');
    await page.screenshot({ 
      path: 'deployment-test-5-final.png', 
      fullPage: true 
    });
    
    // Summary
    console.log('\n📋 DEPLOYMENT TEST SUMMARY:');
    console.log('================================');
    console.log(`📸 Screenshots taken: 5`);
    console.log(`💬 Console messages: ${consoleMessages.length}`);
    console.log(`🚨 Console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 CONSOLE ERRORS FOUND:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors detected!');
    }
    
    console.log('\n🔍 Key indicators to check:');
    console.log('- Look for "Invalid prisma.user.findUnique arguments" errors (should be gone)');
    console.log('- Check if permission endpoints return 200 instead of 500');
    console.log('- Verify "Failed to fetch user permissions" errors are resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'deployment-test-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testDeployment().catch(console.error);