const PAGE_ID = '3590441';
const API_TOKEN = '3590441:4a27cc102bdc75ac2a9dc39cf112cf81';

async function testManychatAPI() {
  console.log('Testing Manychat API connection...\n');

  // Test 1: Get page info
  console.log('1. Testing GET /fb/page/getInfo');
  try {
    const response = await fetch('https://api.manychat.com/fb/page/getInfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n---\n');
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Get subscriber by ID (using page ID as a test)
  console.log('2. Testing GET /fb/subscriber/getInfo');
  try {
    const response = await fetch(`https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${PAGE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n---\n');
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Find subscriber by custom field (if you have any)
  console.log('3. Testing POST /fb/subscriber/findByCustomField');
  try {
    const response = await fetch('https://api.manychat.com/fb/subscriber/findByCustomField', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        field_id: 0,
        field_value: 'test'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testManychatAPI();
