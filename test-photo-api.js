const { chromium } = require('playwright');

async function testPhotoAPI() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable request logging
    page.on('request', request => console.log(`>> ${request.method()} ${request.url()}`));
    page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));
    
    try {
        const apiUrl = 'https://backend-copy-production-328d.up.railway.app';
        
        console.log('🏥 Testing backend health...');
        
        // Test backend health endpoint first
        const healthResponse = await page.request.get(`${apiUrl}/health`);
        console.log(`Health endpoint status: ${healthResponse.status()}`);
        
        if (healthResponse.ok()) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend is healthy:', JSON.stringify(healthData, null, 2));
        } else {
            console.error('❌ Backend health check failed');
        }
        
        // Test if routes are properly registered (should return 401, not 404)
        console.log('\n📸 Testing photo endpoints without auth (expecting 401)...');
        
        const photosResponse = await page.request.get(`${apiUrl}/api/profile/photos`);
        console.log(`Photos endpoint status: ${photosResponse.status()}`);
        
        if (photosResponse.status() === 401) {
            console.log('✅ Photos endpoint is registered (returns 401 as expected)');
        } else if (photosResponse.status() === 404) {
            console.error('❌ Photos endpoint not found - route registration issue');
        } else {
            console.log(`📋 Photos endpoint returned: ${photosResponse.status()}`);
        }
        
        const photoTypesResponse = await page.request.get(`${apiUrl}/api/profile/photo-types`);
        console.log(`Photo types endpoint status: ${photoTypesResponse.status()}`);
        
        if (photoTypesResponse.status() === 401) {
            console.log('✅ Photo types endpoint is registered (returns 401 as expected)');
        } else if (photoTypesResponse.status() === 404) {
            console.error('❌ Photo types endpoint not found - route registration issue');
        } else {
            console.log(`📋 Photo types endpoint returned: ${photoTypesResponse.status()}`);
        }
        
        console.log('\n🔐 Testing authentication (if fails, database might not be seeded)...');
        
        // Test login
        const loginResponse = await page.request.post(`${apiUrl}/api/auth/login`, {
            data: {
                email: 'admin@nayara.com',
                password: 'password123'
            }
        });
        
        if (!loginResponse.ok()) {
            console.warn('⚠️  Login failed (database might not be seeded):', loginResponse.status(), await loginResponse.text());
            console.log('\n📝 To fix authentication, run: npm run db:seed on Railway');
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.data.access_token;
        console.log('✅ Login successful');
        
        // Test authenticated endpoints
        console.log('\n📸 Testing authenticated GET /api/profile/photos...');
        const authPhotosResponse = await page.request.get(`${apiUrl}/api/profile/photos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Authenticated photos endpoint status: ${authPhotosResponse.status()}`);
        
        if (authPhotosResponse.ok()) {
            const photosData = await authPhotosResponse.json();
            console.log('✅ Photos endpoint working with auth:', JSON.stringify(photosData, null, 2));
        } else {
            const errorText = await authPhotosResponse.text();
            console.error('❌ Photos endpoint failed with auth:', authPhotosResponse.status(), errorText);
        }
        
        // Test GET /api/profile/photo-types with auth
        console.log('\n🎭 Testing authenticated GET /api/profile/photo-types...');
        const authPhotoTypesResponse = await page.request.get(`${apiUrl}/api/profile/photo-types`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Authenticated photo types endpoint status: ${authPhotoTypesResponse.status()}`);
        
        if (authPhotoTypesResponse.ok()) {
            const photoTypesData = await authPhotoTypesResponse.json();
            console.log('✅ Photo types endpoint working with auth:', JSON.stringify(photoTypesData, null, 2));
        } else {
            const errorText = await authPhotoTypesResponse.text();
            console.error('❌ Photo types endpoint failed with auth:', authPhotoTypesResponse.status(), errorText);
        }
        
        // Test current user profile access
        console.log('\n👤 Testing GET /api/profile...');
        const profileResponse = await page.request.get(`${apiUrl}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Profile endpoint status: ${profileResponse.status()}`);
        
        if (profileResponse.ok()) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile endpoint working, user ID:', profileData.data.id);
        } else {
            const errorText = await profileResponse.text();
            console.error('❌ Profile endpoint failed:', profileResponse.status(), errorText);
        }
        
        console.log('\n✅ API endpoint testing complete!');
        
        // Take a screenshot showing the results
        await page.goto('data:text/html,<h1>Photo API Testing Complete</h1><p>Check console for results</p>');
        await page.screenshot({ path: '.playwright-mcp/photo-api-test-results.png', fullPage: true });
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

testPhotoAPI();