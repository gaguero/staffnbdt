#!/bin/bash

echo "🧪 Testing Nayara HR Portal Login System"
echo "========================================"
echo ""

# Test backend health
echo "1. Testing Backend Health..."
curl -s https://backend-production-2251.up.railway.app/health | python -m json.tool
echo ""

# Test login with admin account
echo "2. Testing Admin Login..."
RESPONSE=$(curl -s -X POST https://backend-production-2251.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nayara.com","password":"password123"}')

if echo "$RESPONSE" | grep -q "accessToken"; then
  echo "✅ Admin login successful!"
  TOKEN=$(echo "$RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")
  echo "Token received (first 50 chars): ${TOKEN:0:50}..."
else
  echo "❌ Admin login failed"
fi
echo ""

# Test protected endpoint with token
echo "3. Testing Protected Endpoint with Token..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://backend-production-2251.up.railway.app/api/auth/me | python -m json.tool
echo ""

echo "✅ All tests completed!"