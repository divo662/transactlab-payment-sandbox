const fetch = require('node-fetch');

async function testSandboxAPI() {
  try {
    const response = await fetch('https://transactlab-backend.onrender.com/api/v1/sandbox/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sandbox-secret': 'sk_test_secret_mfdyeivx_6a8462bd27c4bc1ec7fb328646ec6649'
      },
      body: JSON.stringify({
        amount_minor: 30000000,
        currency: 'NGN',
        description: 'Test payment',
        customerEmail: 'test@example.com'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testSandboxAPI();
