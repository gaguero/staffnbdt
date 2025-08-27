const axios = require('axios');

const API_BASE = 'https://backend-copy-production-328d.up.railway.app/api';

async function testBrandingAPI() {
  try {
    // First check if the auth endpoint is available
    console.log('📍 Checking API availability...');
    const healthResponse = await axios.get(`${API_BASE}/auth/me`, {
      validateStatus: (status) => status === 401 // We expect 401 without auth
    });
    console.log('✅ API is responding (got expected 401)');

    console.log('🔐 Testing login with admin@nayara.com...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@nayara.com',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    const { user, accessToken, organization, property } = loginResponse.data.data;
    
    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🏢 Organization: ${organization ? `${organization.name} (${organization.id})` : 'None'}`);
    console.log(`🏨 Property: ${property ? `${property.name} (${property.id})` : 'None'}`);

    if (!organization) {
      console.log('❌ Organization is still null - auth service issue');
      return;
    }

    console.log('\n🎨 Testing branding API...');
    const brandingResponse = await axios.get(
      `${API_BASE}/branding/organizations/${organization.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log('✅ Organization branding retrieved successfully!');
    console.log('📊 Branding data:', JSON.stringify(brandingResponse.data, null, 2));

    console.log('\n🎯 Testing branding update...');
    const updateResponse = await axios.put(
      `${API_BASE}/branding/organizations/${organization.id}`,
      {
        branding: {
          colors: {
            primary: '#FF0000',
            background: '#FFFFFF',
            surface: '#F8F9FA',
            textPrimary: '#212529',
            textSecondary: '#6C757D',
            textMuted: '#ADB5BD',
            primaryShades: {
              50: '#FFF5F5', 100: '#FED7D7', 200: '#FEB2B2', 300: '#FC8181',
              400: '#F56565', 500: '#FF0000', 600: '#E53E3E', 700: '#C53030',
              800: '#9B2C2C', 900: '#742A2A'
            }
          },
          typography: {
            heading: "'Inter', sans-serif",
            subheading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
          },
          assets: {
            logoUrl: '/logo.png',
            logoDarkUrl: '/logo-dark.png',
            faviconUrl: '/favicon.ico'
          },
          borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
          shadows: {
            soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            strong: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          },
          transitions: { fast: '150ms', normal: '300ms', slow: '500ms' }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Branding update successful!');
    console.log('🎉 BRANDING API IS WORKING! The undefined organization issue is fixed.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404 && error.response?.config?.url?.includes('undefined')) {
      console.error('🚨 The organization ID is still undefined in the URL!');
    }
  }
}

testBrandingAPI();