// Test webhook endpoint locally
const fetch = require('node-fetch');

const testWebhook = async () => {
  const url = 'https://flowkick.kua.cl/api/manychat/sync/contact';

  const body = {
    admin_id: 'cmgotjcv50000ji042w5f95z6',
    subscriber_id: 1134149962
  };

  console.log('Testing webhook with:');
  console.log(JSON.stringify(body, null, 2));
  console.log('\nSending POST request to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ManyChat'
      },
      body: JSON.stringify(body)
    });

    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('\nResponse Body:');

    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(text);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
};

testWebhook();
