/**
 * Test script per verificare il funzionamento dell'assistente AI
 * Questo script testa gli endpoint AI e le funzionalità principali
 */

const BASE_URL = 'http://localhost:3000';

// Test dell'endpoint di configurazione AI
async function testAIConfig() {
  console.log('🧪 Testing AI Config endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/config`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ AI Config endpoint working');
      console.log('📋 Available providers:', Object.keys(data.providers).filter(p => data.providers[p].available));
      return true;
    } else {
      console.log('❌ AI Config endpoint failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Config endpoint error:', error.message);
    return false;
  }
}

// Test dell'endpoint providers
async function testAIProviders() {
  console.log('🧪 Testing AI Providers endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/providers`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ AI Providers endpoint working');
      console.log('📋 Available providers:', data.providers?.length || 0);
      return true;
    } else {
      console.log('❌ AI Providers endpoint failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Providers endpoint error:', error.message);
    return false;
  }
}

// Test dell'endpoint context (richiede autenticazione)
async function testAIContext() {
  console.log('🧪 Testing AI Context endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tripId: 'test-trip-id',
        tripName: 'Test Trip'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ AI Context endpoint working (authentication required as expected)');
      return true;
    } else if (response.ok) {
      console.log('✅ AI Context endpoint working');
      return true;
    } else {
      console.log('❌ AI Context endpoint failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Context endpoint error:', error.message);
    return false;
  }
}

// Test principale
async function runTests() {
  console.log('🚀 Starting AI Assistant Tests...\n');
  
  const results = [];
  
  results.push(await testAIConfig());
  results.push(await testAIProviders());
  results.push(await testAIContext());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! AI Assistant is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Esegui i test se questo script viene eseguito direttamente
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
} else {
  // Browser environment
  window.runAITests = runTests;
  console.log('AI Tests loaded. Run window.runAITests() to execute.');
}
