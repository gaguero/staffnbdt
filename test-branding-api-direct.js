/**
 * Direct API Test for Roberto Martinez Branding Permissions
 * Tests the branding API endpoints directly to verify 403 is resolved
 */

const https = require('https');
const { default: fetch } = require('node-fetch');

// Test credentials
const ROBERTO_EMAIL = 'roberto.martinez@nayararesorts.com';
const ROBERTO_PASSWORD = 'password123';
const FRONTEND_URL = 'https://frontend-production-55d3.up.railway.app';
const API_BASE = 'https://backend-copy-production-328d.up.railway.app/api';

async function testBrandingAPIDirectly() {
    console.log('🚀 Testing Roberto Martinez branding API permissions directly...');
    
    try {
        // Step 1: Login to get JWT token
        console.log('🔐 Logging in to get JWT token...');
        
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: ROBERTO_EMAIL,
                password: ROBERTO_PASSWORD
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response status:', loginResponse.status);
        console.log('Login response data:', loginData);
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginData);
            return;
        }
        
        // Extract token from various possible response formats
        const token = loginData.access_token || loginData.accessToken || loginData.token || loginData.data?.accessToken || loginData.data?.access_token;
        if (!token) {
            console.log('❌ No token found in response:', loginData);
            return;
        }
        console.log('✅ Login successful, token received:', token.substring(0, 20) + '...');
        
        // Step 2: Get current user info to verify permissions
        console.log('👤 Getting current user info...');
        
        const userResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const userData = await userResponse.json();
        console.log('User data:', userData);
        
        // Step 3: Test property lookup (required for branding endpoints)
        console.log('🏨 Testing property access...');
        
        const propertiesResponse = await fetch(`${API_BASE}/properties`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const propertiesData = await propertiesResponse.json();
        console.log('Properties response status:', propertiesResponse.status);
        console.log('Properties data:', propertiesData);
        
        if (!propertiesResponse.ok || !propertiesData || !propertiesData.data || propertiesData.data.data.length === 0) {
            console.log('❌ No properties found - this might be the issue');
            return;
        }
        
        // Use Roberto's associated property from login response
        const robertoPropertyId = 'cmet2zv4w0003wgzkhrsb1v2v'; // Nayara Bocas del Toro
        const testProperty = propertiesData.data.data.find(p => p.id === robertoPropertyId) || propertiesData.data.data[0];
        console.log('✅ Using test property:', testProperty.id, testProperty.name);
        console.log('Roberto\'s assigned property:', robertoPropertyId);
        
        // Step 4: Debug Roberto's user data for permission check
        console.log('🔍 Debugging Roberto\'s user data for permission checks...');
        console.log('Roberto User ID:', userData.data.id);
        console.log('Roberto Organization ID:', userData.data.organizationId);
        console.log('Roberto Property ID:', userData.data.propertyId);
        console.log('Roberto Role:', userData.data.role);
        console.log('Test Property ID:', testProperty.id);
        
        // Step 5: Test branding READ permission
        console.log('\n📖 Testing branding READ permission...');
        
        const readResponse = await fetch(`${API_BASE}/branding/properties/${testProperty.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Branding READ response status:', readResponse.status);
        const readData = await readResponse.json();
        console.log('Branding READ data:', readData);
        
        if (readResponse.status === 403) {
            console.log('❌ STILL GETTING 403 ON READ - Service-level permission check failed');
            console.log('This suggests Roberto\'s user data doesn\'t match the hardcoded permission check in BrandingService');
        } else if (readResponse.ok) {
            console.log('✅ Branding READ successful');
        }
        
        // Step 6: Test branding UPDATE permission
        console.log('\n💾 Testing branding UPDATE permission...');
        
        const updateData = {
            branding: {
                colors: {
                    primary: '#ff0000',
                    secondary: '#00ff00',
                    accent: '#0000ff'
                },
                assets: {
                    logoUrl: null
                },
                typography: {
                    heading: 'Arial, sans-serif',
                    body: 'Arial, sans-serif'
                }
            }
        };
        
        const updateResponse = await fetch(`${API_BASE}/branding/properties/${testProperty.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Branding UPDATE response status:', updateResponse.status);
        const updateResult = await updateResponse.json();
        console.log('Branding UPDATE result:', updateResult);
        
        if (updateResponse.status === 403) {
            console.log('❌ STILL GETTING 403 ON UPDATE - Service-level permission check failed');
            console.log('This is the main issue blocking the Brand Studio save functionality!');
            console.log('\n🔧 SOLUTION: Need to fix the hardcoded permission check in BrandingService.updatePropertyBranding()');
        } else if (updateResponse.ok) {
            console.log('✅ Branding UPDATE successful - Permission issue RESOLVED!');
        } else {
            console.log(`⚠️  Unexpected status: ${updateResponse.status}`);
        }
        
        // Step 6: Summary
        console.log('\n📊 BRANDING PERMISSIONS TEST SUMMARY:');
        console.log('='.repeat(50));
        console.log(`User: ${ROBERTO_EMAIL}`);
        console.log(`Login: ${loginResponse.ok ? '✅ Success' : '❌ Failed'}`);
        console.log(`Properties: ${propertiesResponse.ok ? '✅ Access' : '❌ Denied'}`);
        console.log(`Branding Read: ${readResponse.ok ? '✅ Success' : '❌ Denied'} (Status: ${readResponse.status})`);
        console.log(`Branding Update: ${updateResponse.ok ? '✅ Success' : '❌ Denied'} (Status: ${updateResponse.status})`);
        
        if (readResponse.ok && updateResponse.ok) {
            console.log('\n🎉 SUCCESS: Roberto Martinez has full branding permissions!');
            console.log('The Brand Studio should now work correctly on Railway.');
        } else {
            console.log('\n❌ ISSUE PERSISTS: Roberto Martinez still lacks some branding permissions');
            if (updateResponse.status === 403) {
                console.log('ACTION NEEDED: branding.update.property permission is still missing');
            }
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error);
    }
}

// Run the test
testBrandingAPIDirectly().then(() => {
    console.log('\n🎯 Direct API branding permissions test completed!');
}).catch(error => {
    console.error('💥 Test execution failed:', error);
});