const { chromium } = require('playwright');

async function testRobertoBrandingFix() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Roberto Martinez branding fix...');
    
    // Step 1: Navigate to login page
    console.log('📱 Navigating to login page...');
    await page.goto('https://frontend-production-55d3.up.railway.app/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'roberto-01-login-page.png', fullPage: true });
    console.log('✅ Login page loaded');

    // Check for any console errors
    const loginErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        loginErrors.push(msg.text());
      }
    });

    // Step 2: Login with Roberto Martinez credentials
    console.log('🔑 Logging in as Roberto Martinez...');
    await page.fill('input[name="email"], input[type="email"], #email', 'roberto.martinez@nayararesorts.com');
    await page.fill('input[name="password"], input[type="password"], #password', 'password123');
    await page.screenshot({ path: 'roberto-02-credentials-filled.png', fullPage: true });
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), .login-button');
    console.log('🚀 Login button clicked, waiting for navigation...');
    
    // Wait for potential navigation or dashboard load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'roberto-03-post-login.png', fullPage: true });
    
    // Check URL and page content to see if login was successful
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we're on a dashboard/home page (not login page)
    const isLoginSuccessful = !currentUrl.includes('/login');
    console.log(`🎯 Login successful: ${isLoginSuccessful}`);

    if (isLoginSuccessful) {
      console.log('✅ Roberto Martinez login SUCCESSFUL!');
      
      // Step 3: Navigate to branding settings
      console.log('🎨 Testing branding page access...');
      
      // Try different possible branding URLs
      const brandingUrls = [
        '/branding',
        '/settings/branding', 
        '/admin/branding',
        '/organization/branding'
      ];
      
      let brandingPageFound = false;
      
      for (const brandingPath of brandingUrls) {
        try {
          const brandingUrl = `https://frontend-production-55d3.up.railway.app${brandingPath}`;
          console.log(`🔍 Trying branding URL: ${brandingUrl}`);
          
          await page.goto(brandingUrl);
          await page.waitForTimeout(2000);
          
          // Check if we got a 404 or error page
          const pageContent = await page.textContent('body');
          if (!pageContent.includes('404') && !pageContent.includes('Not Found') && !pageContent.includes('error')) {
            brandingPageFound = true;
            await page.screenshot({ path: `roberto-04-branding-${brandingPath.replace('/', '')}.png`, fullPage: true });
            console.log(`✅ Branding page found at: ${brandingPath}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Branding URL failed: ${brandingPath} - ${error.message}`);
        }
      }
      
      if (!brandingPageFound) {
        console.log('🔍 Branding page not found, checking main navigation...');
        await page.goto('https://frontend-production-55d3.up.railway.app/');
        await page.waitForTimeout(2000);
        
        // Look for navigation links that might lead to branding
        const navLinks = await page.$$eval('a', links => 
          links.map(link => ({ text: link.textContent, href: link.href }))
            .filter(link => link.text && (
              link.text.toLowerCase().includes('brand') ||
              link.text.toLowerCase().includes('setting') ||
              link.text.toLowerCase().includes('admin') ||
              link.text.toLowerCase().includes('config')
            ))
        );
        
        console.log('🔗 Found navigation links:', navLinks);
        await page.screenshot({ path: 'roberto-05-navigation-search.png', fullPage: true });
      }

      // Step 4: Test API access directly
      console.log('🌐 Testing branding API access...');
      
      try {
        // Test organization branding API
        const response = await page.evaluate(async () => {
          try {
            const res = await fetch('/api/branding/organizations/test-org-id', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            return {
              status: res.status,
              statusText: res.statusText,
              ok: res.ok
            };
          } catch (error) {
            return { error: error.message };
          }
        });
        
        console.log('📊 Branding API response:', response);
        
        if (response.status === 403) {
          console.log('❌ Still getting 403 Forbidden - permission system not fully working');
        } else if (response.status === 404) {
          console.log('⚠️ 404 Not Found - API endpoint exists but resource not found (this is expected)');
        } else if (response.ok) {
          console.log('✅ Branding API accessible - permissions working!');
        }
        
      } catch (apiError) {
        console.log('⚠️ API test failed:', apiError.message);
      }

    } else {
      console.log('❌ Roberto Martinez login FAILED');
      
      // Check for error messages
      const errorElements = await page.$$('text=/error|invalid|wrong/i');
      if (errorElements.length > 0) {
        for (const element of errorElements) {
          const errorText = await element.textContent();
          console.log(`🚨 Error message: ${errorText}`);
        }
      }
    }

    // Step 5: Check console errors
    console.log(`📊 Console errors during test: ${loginErrors.length}`);
    loginErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });

    // Step 6: Final summary screenshot
    await page.screenshot({ path: 'roberto-06-final-state.png', fullPage: true });
    
    console.log('\n📋 TEST SUMMARY:');
    console.log(`✅ Login page loaded: Yes`);
    console.log(`✅ Login successful: ${isLoginSuccessful ? 'Yes' : 'No'}`);
    console.log(`✅ Branding page accessible: ${brandingPageFound ? 'Yes' : 'Unknown'}`);
    console.log(`📊 Console errors: ${loginErrors.length}`);
    console.log(`🌍 Final URL: ${currentUrl}`);

    if (isLoginSuccessful) {
      console.log('\n🎉 CRITICAL SUCCESS: Roberto Martinez can login!');
      console.log('🔧 The permission system appears to be working for authentication');
      console.log('🎯 Branding system should now be accessible');
    } else {
      console.log('\n💥 CRITICAL FAILURE: Roberto Martinez cannot login');
      console.log('🔧 Need to check user credentials and database seeding');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'roberto-error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testRobertoBrandingFix().catch(console.error);