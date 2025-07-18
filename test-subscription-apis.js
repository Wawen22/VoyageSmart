// Script di test per le API di subscription
// Esegui con: node test-subscription-apis.js

const BASE_URL = 'http://localhost:3000';

// Funzione helper per fare richieste autenticate
async function makeAuthenticatedRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test per l'API di cancellazione
async function testCancelAPI() {
  console.log('\n=== Test API Cancellazione ===');
  
  // Sostituisci con un token valido per i test
  const token = 'YOUR_ACCESS_TOKEN_HERE';
  const subscriptionId = 'sub_test'; // ID di test
  
  const result = await makeAuthenticatedRequest(
    '/api/stripe/cancel',
    'POST',
    { subscriptionId },
    token
  );
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ Cancellazione riuscita');
    if (result.data.stripeUpdated === false) {
      console.log('ℹ️  Subscription di test rilevata - aggiornato solo database');
    }
  } else {
    console.log('❌ Cancellazione fallita');
  }
}

// Test per l'API di downgrade
async function testDowngradeAPI() {
  console.log('\n=== Test API Downgrade ===');
  
  // Sostituisci con un token valido per i test
  const token = 'YOUR_ACCESS_TOKEN_HERE';
  
  const result = await makeAuthenticatedRequest(
    '/api/stripe/downgrade',
    'POST',
    {},
    token
  );
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ Downgrade riuscito');
    if (result.data.stripeUpdated === false) {
      console.log('ℹ️  Subscription di test rilevata - aggiornato solo database');
    }
  } else {
    console.log('❌ Downgrade fallito');
  }
}

// Test per l'API di pulizia admin
async function testCleanupAPI() {
  console.log('\n=== Test API Pulizia Admin ===');
  
  // Sostituisci con un token admin valido per i test
  const adminToken = 'YOUR_ADMIN_ACCESS_TOKEN_HERE';
  
  const result = await makeAuthenticatedRequest(
    '/api/admin/cleanup-test-subscriptions',
    'POST',
    {},
    adminToken
  );
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ Pulizia riuscita');
    console.log(`📊 Subscription pulite: ${result.data.cleaned}`);
  } else {
    console.log('❌ Pulizia fallita');
  }
}

// Funzione principale
async function runTests() {
  console.log('🧪 Avvio test delle API di subscription...');
  console.log('⚠️  NOTA: Aggiorna i token di accesso prima di eseguire i test');
  
  // Decommentare i test che vuoi eseguire
  // await testCancelAPI();
  // await testDowngradeAPI();
  // await testCleanupAPI();
  
  console.log('\n✨ Test completati');
  console.log('\n📝 Per eseguire i test:');
  console.log('1. Avvia il server: npm run dev');
  console.log('2. Ottieni un token di accesso valido dal browser (DevTools > Application > Local Storage)');
  console.log('3. Sostituisci YOUR_ACCESS_TOKEN_HERE con il token reale');
  console.log('4. Decommentare i test che vuoi eseguire');
  console.log('5. Eseguire: node test-subscription-apis.js');
}

// Esegui i test se il file viene eseguito direttamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  makeAuthenticatedRequest,
  testCancelAPI,
  testDowngradeAPI,
  testCleanupAPI
};
