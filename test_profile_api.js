const fetch = require('node-fetch');

// Test profile API endpoints
async function testProfileAPI() {
  const API_URL = 'http://localhost:3001';
  
  console.log('🧪 Testing Profile API endpoints...');
  
  // Test 1: Try to get profile without token (should fail)
  console.log('\n1. Testing /api/auth/me without token:');
  try {
    const response = await fetch(`${API_URL}/api/auth/me`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Try to update profile without token (should fail)
  console.log('\n2. Testing /api/auth/profile PUT without token:');
  try {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Test',
        apellido: 'User'
      })
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Check if server is running
  console.log('\n3. Testing server health:');
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n✅ Profile API tests completed!');
}

testProfileAPI().catch(console.error);