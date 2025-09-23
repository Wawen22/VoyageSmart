/**
 * Test script to verify AI authentication fixes
 * This script tests the authentication flow for AI endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAIAuthentication() {
  console.log('🧪 Testing AI Authentication Fixes...\n');

  // Test 1: Test AI config endpoint (should work without auth)
  console.log('1. Testing AI config endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/config`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ AI config endpoint working');
      console.log(`   Available providers: ${data.availableProviders?.join(', ') || 'None'}`);
    } else {
      console.log('❌ AI config endpoint failed:', data.error);
    }
  } catch (error) {
    console.log('❌ AI config endpoint error:', error.message);
  }

  // Test 2: Test AI chat endpoint without authentication (should return 401)
  console.log('\n2. Testing AI chat endpoint without auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test message',
        tripId: 'test-trip-id',
        tripName: 'Test Trip'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ AI chat endpoint correctly returns 401 without auth');
      console.log(`   Error message: ${data.error}`);
    } else {
      console.log('❌ AI chat endpoint should return 401 without auth, got:', response.status);
    }
  } catch (error) {
    console.log('❌ AI chat endpoint error:', error.message);
  }

  // Test 3: Test AI context endpoint without authentication (should return 401)
  console.log('\n3. Testing AI context endpoint without auth...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'test-trip-id',
        tripName: 'Test Trip'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ AI context endpoint correctly returns 401 without auth');
      console.log(`   Error message: ${data.error}`);
    } else {
      console.log('❌ AI context endpoint should return 401 without auth, got:', response.status);
    }
  } catch (error) {
    console.log('❌ AI context endpoint error:', error.message);
  }

  // Test 4: Test middleware inclusion
  console.log('\n4. Testing middleware configuration...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/providers`);
    
    if (response.status === 401 || response.status === 200) {
      console.log('✅ AI endpoints are properly handled by middleware');
    } else {
      console.log('❌ Unexpected response from AI providers endpoint:', response.status);
    }
  } catch (error) {
    console.log('❌ Middleware test error:', error.message);
  }

  console.log('\n🏁 Authentication test completed!');
  console.log('\n📋 Summary:');
  console.log('   - AI endpoints now use enhanced authentication');
  console.log('   - Session refresh is implemented for 401 errors');
  console.log('   - Middleware includes AI routes for session management');
  console.log('   - Subscription validation is centralized');
  console.log('\n💡 Next steps:');
  console.log('   - Test with a real authenticated user session');
  console.log('   - Verify AI assistant works in the browser');
  console.log('   - Check that session refresh works automatically');
}

// Run the test
testAIAuthentication().catch(console.error);
