// Simple authentication test script
const testAuth = async () => {
  const baseURL = 'http://localhost:8000';
  
  console.log('🔐 Testing Impact Compendium Authentication...\n');
  
  // Test 1: Check auth status
  console.log('1. Checking authentication service status...');
  try {
    const statusResponse = await fetch(`${baseURL}/auth/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Auth service status:', statusData.message);
    console.log('   User Pool ID:', statusData.configuration.user_pool_id);
    console.log('   Mock Mode:', statusData.configuration.mock_mode);
  } catch (error) {
    console.log('❌ Auth service status failed:', error.message);
    return;
  }
  
  // Test 2: Test login with mock credentials (since we're in development)
  console.log('\n2. Testing login with mock credentials...');
  try {
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      }),
    });
    
    const loginData = await loginResponse.json();
    if (loginData.success) {
      console.log('✅ Login successful');
      console.log('   Access Token:', loginData.data.access_token.substring(0, 20) + '...');
      console.log('   User Email:', loginData.data.user.email);
      
      // Test 3: Test protected endpoint
      console.log('\n3. Testing protected endpoint with token...');
      const token = loginData.data.access_token;
      
      const protectedResponse = await fetch(`${baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const protectedData = await protectedResponse.json();
      if (protectedData.success) {
        console.log('✅ Protected endpoint access successful');
        console.log('   User ID:', protectedData.data.user_id);
        console.log('   Email:', protectedData.data.email);
      } else {
        console.log('❌ Protected endpoint failed:', protectedData.error);
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
  }
  
  console.log('\n🎉 Authentication test completed!');
};

// Run the test
testAuth();
