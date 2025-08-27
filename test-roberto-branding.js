/**
 * Test Roberto Martinez Branding Permissions
 * Verifies that Roberto can successfully save branding changes on Railway
 */

const { chromium } = require('playwright');

async function testRobertoBrandingPermissions() {
    console.log('🚀 Testing Roberto Martinez branding permissions on Railway...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Step 1: Navigate to frontend
        console.log('📱 Navigating to frontend...');
        await page.goto('https://frontend-production-55d3.up.railway.app');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/01-frontend-loaded.png' });
        
        // Step 2: Login as Roberto Martinez
        console.log('🔐 Logging in as Roberto Martinez...');
        
        // Fill login form
        await page.fill('input[name="email"]', 'roberto.martinez@nayararesorts.com');
        await page.fill('input[name="password"]', 'password123');
        await page.screenshot({ path: 'screenshots/02-login-form-filled.png' });
        
        // Click login button
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/03-after-login-click.png' });
        
        // Check if login was successful
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            console.log('❌ Login failed - still on login page');
            await page.screenshot({ path: 'screenshots/04-login-failed.png' });
            
            // Check for error messages
            const errorMessage = await page.locator('.error, .alert, [data-testid="error"]').textContent().catch(() => null);
            console.log('Error message:', errorMessage);
            return;
        }
        
        console.log('✅ Login successful! Current URL:', currentUrl);
        
        // Step 3: Navigate to Brand Studio
        console.log('🎨 Navigating to Brand Studio...');
        
        // Try different navigation methods
        const brandStudioSelector = 'a[href*="brand"], a:has-text("Brand"), [data-testid="brand-studio"]';
        await page.click(brandStudioSelector).catch(async () => {
            // Fallback: direct navigation
            await page.goto('https://frontend-production-55d3.up.railway.app/brand-studio');
        });
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/05-brand-studio-loaded.png' });
        
        // Step 4: Test branding API call
        console.log('🔍 Testing branding API permissions...');
        
        // Monitor network requests
        let apiCallResult = null;
        page.on('response', response => {
            if (response.url().includes('/api/branding/')) {
                apiCallResult = {
                    url: response.url(),
                    status: response.status(),
                    method: response.request().method()
                };
                console.log(`📡 API Call: ${response.request().method()} ${response.url()} -> ${response.status()}`);
            }
        });
        
        // Try to make a branding change
        try {
            // Look for save button or update form
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), [data-testid="save-branding"]').first();
            if (await saveButton.isVisible()) {
                console.log('💾 Clicking save button to test permissions...');
                await saveButton.click();
                await page.waitForTimeout(2000);
            }
            
            // Alternative: Look for color picker or brand element to modify
            const colorInput = page.locator('input[type="color"], .color-picker, [data-testid="primary-color"]').first();
            if (await colorInput.isVisible()) {
                console.log('🎨 Testing color change...');
                await colorInput.fill('#ff0000');
                await page.waitForTimeout(1000);
            }
            
        } catch (error) {
            console.log('⚠️  UI interaction error:', error.message);
        }
        
        await page.screenshot({ path: 'screenshots/06-branding-test-complete.png' });
        
        // Step 5: Verify API results
        console.log('📊 API Call Results:');
        if (apiCallResult) {
            if (apiCallResult.status === 200 || apiCallResult.status === 201) {
                console.log('✅ SUCCESS: Roberto has branding permissions!');
                console.log(`   API: ${apiCallResult.method} ${apiCallResult.url} -> ${apiCallResult.status}`);
            } else if (apiCallResult.status === 403) {
                console.log('❌ STILL FORBIDDEN: Roberto lacks branding permissions');
                console.log(`   API: ${apiCallResult.method} ${apiCallResult.url} -> ${apiCallResult.status}`);
            } else {
                console.log(`⚠️  Unexpected status: ${apiCallResult.status}`);
            }
        } else {
            console.log('⚠️  No branding API calls detected');
        }
        
        // Step 6: Check browser console for errors
        console.log('🔍 Browser Console Messages:');
        const logs = await page.evaluate(() => {
            return window.console.logs || [];
        });
        console.log('Console logs:', logs);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'screenshots/error-state.png' });
    } finally {
        await browser.close();
    }
}

// Run the test
testRobertoBrandingPermissions().then(() => {
    console.log('🎯 Roberto Martinez branding permissions test completed!');
}).catch(error => {
    console.error('💥 Test execution failed:', error);
});