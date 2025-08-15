const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🚀 Starting Puppeteer UI Login Test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    // Test accounts
    const accounts = [
      { email: 'admin@nayara.com', password: 'password123', role: 'SUPERADMIN' },
      { email: 'hr@nayara.com', password: 'password123', role: 'DEPARTMENT_ADMIN' },
      { email: 'staff@nayara.com', password: 'password123', role: 'STAFF' }
    ];
    
    for (const account of accounts) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing ${account.role} Login`);
      console.log(`Email: ${account.email}`);
      console.log(`${'='.repeat(60)}`);
      
      // Navigate to the frontend
      console.log('1. Navigating to frontend...');
      await page.goto('https://frontend-production-55d3.up.railway.app', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Check if we're on the login page
      const url = page.url();
      console.log(`   Current URL: ${url}`);
      
      // Take screenshot of login page
      await page.screenshot({ 
        path: `login-page-${account.role}.png`,
        fullPage: true 
      });
      console.log(`   ✅ Screenshot saved: login-page-${account.role}.png`);
      
      // Wait for login form elements
      console.log('2. Finding login form elements...');
      await page.waitForSelector('#email', { timeout: 5000 });
      await page.waitForSelector('#password', { timeout: 5000 });
      
      // Clear fields first (in case of previous values)
      await page.click('#email', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      
      // Fill in email
      console.log('3. Filling in credentials...');
      await page.type('#email', account.email);
      console.log(`   ✅ Email entered: ${account.email}`);
      
      // Fill in password
      await page.type('#password', account.password);
      console.log(`   ✅ Password entered`);
      
      // Take screenshot with filled form
      await page.screenshot({ 
        path: `login-filled-${account.role}.png`,
        fullPage: true 
      });
      console.log(`   ✅ Screenshot saved: login-filled-${account.role}.png`);
      
      // Click Sign In button
      console.log('4. Clicking Sign In button...');
      await page.click('button[type="submit"]');
      
      // Wait for navigation or response
      console.log('5. Waiting for response...');
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: 10000 
      }).catch(() => {
        console.log('   Navigation timeout - checking current state...');
      });
      
      // Check where we are now
      const newUrl = page.url();
      console.log(`   New URL: ${newUrl}`);
      
      // Check for dashboard elements
      if (newUrl.includes('/dashboard')) {
        console.log('   ✅ Successfully redirected to dashboard!');
        
        // Wait a moment for content to load
        await page.waitForTimeout(2000);
        
        // Take screenshot of dashboard
        await page.screenshot({ 
          path: `dashboard-${account.role}.png`,
          fullPage: true 
        });
        console.log(`   ✅ Screenshot saved: dashboard-${account.role}.png`);
        
        // Try to find user info
        const userInfo = await page.evaluate(() => {
          const welcomeText = document.body.innerText;
          return welcomeText;
        });
        
        if (userInfo.includes('Welcome')) {
          console.log(`   ✅ User welcomed on dashboard`);
        }
        
        // Look for Sign Out button
        const signOutButton = await page.$('button:has-text("Sign Out")').catch(() => null);
        if (signOutButton) {
          console.log('   ✅ Sign Out button found');
          await signOutButton.click();
          console.log('   ✅ Signed out successfully');
          await page.waitForTimeout(2000);
        }
        
      } else {
        console.log('   ⚠️ Still on login page - checking for errors...');
        
        // Check for error messages
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.text-red-600');
          return errorEl ? errorEl.textContent : null;
        });
        
        if (errorText) {
          console.log(`   ❌ Error message: ${errorText}`);
        }
        
        // Take screenshot of error state
        await page.screenshot({ 
          path: `login-error-${account.role}.png`,
          fullPage: true 
        });
        console.log(`   ✅ Screenshot saved: login-error-${account.role}.png`);
      }
      
      // Check console for errors
      const consoleErrors = await page.evaluate(() => {
        return window.consoleErrors || [];
      });
      
      if (consoleErrors.length > 0) {
        console.log('   ⚠️ Console errors:', consoleErrors);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ 
      path: 'error-state.png',
      fullPage: true 
    });
  } finally {
    console.log('\n📊 Test Summary:');
    console.log('Screenshots saved in current directory');
    console.log('Check the screenshots to see the UI state at each step');
    
    await browser.close();
    console.log('\n✅ Browser closed. Test complete!');
  }
}

// Add console error tracking
puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  await browser.close();
});

// Run the test
testLogin().catch(console.error);