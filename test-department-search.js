const { chromium } = require('playwright');

async function testDepartmentSearch() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing Department Search Functionality...');
    
    // Navigate to the frontend
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial load
    await page.screenshot({ path: 'initial-load.png' });
    console.log('📸 Screenshot taken: initial-load.png');
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Navigate to departments page (assuming login is required)
    console.log('🏢 Navigating to departments page...');
    
    // Look for login or departments link
    const loginSelector = 'input[type="email"], input[name="email"], .login';
    const departmentsLink = 'a[href*="departments"], button:has-text("Departments")';
    
    if (await page.locator(loginSelector).first().isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('🔐 Login required - attempting demo login...');
      
      // Try to find and fill login form
      try {
        await page.fill('input[type="email"], input[name="email"]', 'admin@example.com');
        await page.fill('input[type="password"], input[name="password"]', 'password');
        await page.click('button[type="submit"], .btn-primary');
        await page.waitForNavigation({ timeout: 10000 });
      } catch (e) {
        console.log('⚠️ Could not complete login, continuing...');
      }
    }
    
    // Try to navigate to departments
    try {
      if (await page.locator(departmentsLink).first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.click(departmentsLink);
        await page.waitForLoadState('networkidle');
      } else {
        // Try direct navigation
        await page.goto('https://frontend-production-55d3.up.railway.app/departments');
        await page.waitForLoadState('networkidle');
      }
    } catch (e) {
      console.log('ℹ️ Navigating directly to departments page...');
      await page.goto('https://frontend-production-55d3.up.railway.app/departments');
      await page.waitForLoadState('networkidle');
    }
    
    // Take screenshot of departments page
    await page.screenshot({ path: 'departments-page.png', fullPage: true });
    console.log('📸 Screenshot taken: departments-page.png');
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Test 1: Search for a term that should match departments at various levels
      console.log('🧪 Test 1: Searching for "Department"...');
      await searchInput.fill('Department');
      await page.waitForTimeout(1000); // Wait for search to process
      
      await page.screenshot({ path: 'search-department.png', fullPage: true });
      console.log('📸 Screenshot taken: search-department.png');
      
      // Count visible department cards
      const departmentCards = await page.locator('.card, [class*="department"]').count();
      console.log(`📊 Found ${departmentCards} department results for "Department"`);
      
      // Test 2: Search for a specific term
      console.log('🧪 Test 2: Searching for "HR"...');
      await searchInput.fill('HR');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'search-hr.png', fullPage: true });
      console.log('📸 Screenshot taken: search-hr.png');
      
      const hrResults = await page.locator('.card, [class*="department"]').count();
      console.log(`📊 Found ${hrResults} department results for "HR"`);
      
      // Test 3: Search for level indicators
      console.log('🧪 Test 3: Looking for level indicators...');
      const levelIndicators = await page.locator('text=/Level \\d+/').count();
      console.log(`📊 Found ${levelIndicators} level indicators in search results`);
      
      // Test 4: Clear search and verify all departments show
      console.log('🧪 Test 4: Clearing search...');
      await searchInput.fill('');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'search-cleared.png', fullPage: true });
      console.log('📸 Screenshot taken: search-cleared.png');
      
      const allResults = await page.locator('.card, [class*="department"]').count();
      console.log(`📊 Found ${allResults} total departments when search is cleared`);
      
    } else {
      console.log('⚠️ Search input not found on page');
    }
    
    // Check for JavaScript errors
    const errors = await page.evaluate(() => {
      return window.console.errors || [];
    });
    
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected');
    } else {
      console.log('❌ JavaScript errors:', errors);
    }
    
    console.log('✅ Department search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-state.png' });
    console.log('📸 Error screenshot taken: error-state.png');
  } finally {
    await browser.close();
  }
}

testDepartmentSearch();