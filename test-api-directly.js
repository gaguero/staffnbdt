const { chromium } = require('playwright');

async function testApiDirectly() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Testing API endpoints directly...');
    
    // Test the API endpoint directly
    console.log('🔍 Testing backend health...');
    
    // Enable request/response logging
    page.on('request', request => {
      console.log(`📤 ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      console.log(`📥 ${response.status()} ${response.url()}`);
    });
    
    // Navigate to frontend
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.waitForTimeout(2000);
    console.log('✅ Frontend loaded');
    
    // Try to test login by intercepting network requests
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/auth/login') || response.url().includes('/login')
    );
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', 'admin@nayara.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.screenshot({ path: '.playwright-mcp/api-01-login-form.png' });
    
    // Submit login
    await page.click('button[type="submit"]');
    
    try {
      const loginResponse = await loginPromise;
      const status = loginResponse.status();
      console.log(`🔐 Login response status: ${status}`);
      
      if (status === 200 || status === 201) {
        console.log('✅ Login successful');
        const responseBody = await loginResponse.json();
        console.log('📋 Login response:', JSON.stringify(responseBody, null, 2));
      } else {
        console.log('❌ Login failed');
        const responseText = await loginResponse.text();
        console.log('📋 Error response:', responseText);
      }
    } catch (error) {
      console.log('⚠️ No login request intercepted, checking page state...');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '.playwright-mcp/api-02-after-login.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // Try to navigate to users page
    await page.goto('https://frontend-production-55d3.up.railway.app/users');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '.playwright-mcp/api-03-users-page.png' });
    
    // Check if redirected back to login
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.includes('/login')) {
      console.log('❌ Still redirected to login - authentication failed');
      
      // Try to access the backend API directly to test it
      console.log('🔧 Testing backend API directly...');
      
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'admin@nayara.com',
              password: 'password123'
            })
          });
          
          return {
            status: response.status,
            ok: response.ok,
            text: await response.text()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      console.log('🔧 Direct API test result:', apiResponse);
      
      return false;
    } else {
      console.log('✅ Authentication successful, checking users page...');
      
      const pageText = await page.textContent('body');
      if (pageText.includes('User Management')) {
        console.log('✅ Users page loaded successfully');
        
        // Now test the user creation
        console.log('🔍 Looking for Add User button...');
        const addUserButton = await page.locator('button:has-text("Add User")').first();
        
        if (await addUserButton.isVisible()) {
          console.log('✅ Add User button found!');
          
          // Test user creation API call
          await addUserButton.click();
          await page.waitForTimeout(1000);
          
          // Fill form quickly and submit
          await page.fill('[name="firstName"]', 'Test');
          await page.fill('[name="lastName"]', 'User');
          await page.fill('[name="email"]', 'test@example.com');
          
          // Wait for API call
          const createUserPromise = page.waitForResponse(response => 
            response.url().includes('/users') && response.request().method() === 'POST'
          );
          
          await page.click('button[type="submit"]');
          
          try {
            const createResponse = await createUserPromise;
            const status = createResponse.status();
            console.log(`👤 Create user response status: ${status}`);
            
            if (status === 200 || status === 201) {
              console.log('✅ User creation successful!');
              return true;
            } else {
              console.log('❌ User creation failed');
              const errorText = await createResponse.text();
              console.log('📋 Error response:', errorText);
              return false;
            }
          } catch (error) {
            console.log('⚠️ No user creation request intercepted');
            return false;
          }
        } else {
          console.log('❌ Add User button not found');
          return false;
        }
      } else {
        console.log('❌ Users page did not load properly');
        return false;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '.playwright-mcp/api-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testApiDirectly().then(success => {
  if (success) {
    console.log('🎉 API test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 API test FAILED!');
    process.exit(1);
  }
});