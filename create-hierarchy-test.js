const { chromium } = require('playwright');

async function testWithHierarchyCreation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing Department Search with Hierarchy...');
    
    // Navigate to the frontend
    await page.goto('https://frontend-production-55d3.up.railway.app');
    await page.waitForLoadState('networkidle');
    
    console.log('🔐 Logging in as admin...');
    
    // Login with admin credentials
    await page.fill('input[placeholder*="email"], input[name="email"]', 'admin@nayara.com');
    await page.fill('input[placeholder*="password"], input[name="password"]', 'testpass123');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for navigation after login
    await page.waitForNavigation({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after login
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('📸 Screenshot taken: after-login.png');
    
    // Navigate to departments page
    console.log('🏢 Navigating to departments page...');
    
    // Try multiple ways to get to departments
    try {
      await page.click('a[href*="departments"], button:has-text("Departments")');
    } catch {
      await page.goto('https://frontend-production-55d3.up.railway.app/departments');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'departments-main.png', fullPage: true });
    console.log('📸 Screenshot taken: departments-main.png');
    
    // Create hierarchical departments for testing
    console.log('🏗️ Creating hierarchical departments...');
    
    // Click Add Department button
    const addButton = page.locator('button:has-text("Add Department")');
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Create a sub-department under Front Office
      await page.fill('input[name="name"]', 'Front Office Reception');
      await page.fill('textarea[name="description"]', 'Reception and guest check-in services');
      await page.fill('input[name="location"]', 'Main Lobby Reception');
      await page.fill('input[name="budget"]', '50000');
      
      // Set parent department to Front Office
      const parentSelect = page.locator('select[name="parentId"]');
      if (await parentSelect.isVisible()) {
        await parentSelect.selectOption({ label: /Front Office/ });
      }
      
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(2000);
      
      console.log('✅ Created Front Office Reception sub-department');
      
      // Create another sub-department
      await addButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="name"]', 'Kitchen Operations');
      await page.fill('textarea[name="description"]', 'Kitchen staff and food preparation');
      await page.fill('input[name="location"]', 'Main Kitchen');
      await page.fill('input[name="budget"]', '80000');
      
      // Set parent to Food & Beverage
      if (await parentSelect.isVisible()) {
        await parentSelect.selectOption({ label: /Food.*Beverage/ });
      }
      
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(2000);
      
      console.log('✅ Created Kitchen Operations sub-department');
      
      // Create a level 2 department
      await addButton.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="name"]', 'Pastry Team');
      await page.fill('textarea[name="description"]', 'Specialized pastry and dessert preparation');
      await page.fill('input[name="location"]', 'Pastry Section');
      await page.fill('input[name="budget"]', '25000');
      
      // Set parent to Kitchen Operations (if available)
      if (await parentSelect.isVisible()) {
        await parentSelect.selectOption({ label: /Kitchen Operations/ });
      }
      
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(2000);
      
      console.log('✅ Created Pastry Team (level 2 department)');
    }
    
    // Now test the search functionality
    console.log('🔍 Testing search functionality...');
    
    await page.screenshot({ path: 'before-search.png', fullPage: true });
    console.log('📸 Screenshot taken: before-search.png');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 })) {
      // Test 1: Search for "Reception" - should find level 1 department
      console.log('🧪 Test 1: Searching for "Reception"...');
      await searchInput.fill('Reception');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: 'search-reception.png', fullPage: true });
      console.log('📸 Screenshot taken: search-reception.png');
      
      const receptionResults = await page.locator('.card').count();
      console.log(`📊 Found ${receptionResults} results for "Reception"`);
      
      // Test 2: Search for "Kitchen" - should find level 1 department
      console.log('🧪 Test 2: Searching for "Kitchen"...');
      await searchInput.fill('Kitchen');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: 'search-kitchen.png', fullPage: true });
      console.log('📸 Screenshot taken: search-kitchen.png');
      
      const kitchenResults = await page.locator('.card').count();
      console.log(`📊 Found ${kitchenResults} results for "Kitchen"`);
      
      // Test 3: Search for "Pastry" - should find level 2 department
      console.log('🧪 Test 3: Searching for "Pastry"...');
      await searchInput.fill('Pastry');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: 'search-pastry.png', fullPage: true });
      console.log('📸 Screenshot taken: search-pastry.png');
      
      const pastryResults = await page.locator('.card').count();
      console.log(`📊 Found ${pastryResults} results for "Pastry"`);
      
      // Test 4: Check for level indicators in search results
      const levelIndicators = await page.locator('text=/Level \\d+/').count();
      console.log(`📊 Found ${levelIndicators} level indicators in search results`);
      
      // Test 5: Clear search and verify all departments show
      console.log('🧪 Test 4: Clearing search...');
      await searchInput.fill('');
      await page.waitForTimeout(1500);
      
      await page.screenshot({ path: 'search-cleared-hierarchy.png', fullPage: true });
      console.log('📸 Screenshot taken: search-cleared-hierarchy.png');
      
      const allResults = await page.locator('.card').count();
      console.log(`📊 Found ${allResults} total departments when search is cleared`);
      
      // Test 6: Try hierarchy view
      console.log('🧪 Test 5: Testing hierarchy view...');
      const hierarchyButton = page.locator('button:has-text("Hierarchy")');
      if (await hierarchyButton.isVisible()) {
        await hierarchyButton.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'hierarchy-view.png', fullPage: true });
        console.log('📸 Screenshot taken: hierarchy-view.png');
        
        // Search in hierarchy view
        await searchInput.fill('Reception');
        await page.waitForTimeout(1500);
        
        await page.screenshot({ path: 'hierarchy-search-reception.png', fullPage: true });
        console.log('📸 Screenshot taken: hierarchy-search-reception.png');
      }
      
    } else {
      console.log('⚠️ Search input not found on page');
    }
    
    console.log('✅ Department hierarchy search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'hierarchy-error.png', fullPage: true });
    console.log('📸 Error screenshot taken: hierarchy-error.png');
  } finally {
    await browser.close();
  }
}

testWithHierarchyCreation();