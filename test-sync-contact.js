// Direct test script to sync a contact from Manychat
// Usage: node test-sync-contact.js <subscriber_id>

const fetch = require('node-fetch');

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testManychatAPI(apiToken, subscriberId) {
  console.log('\n=== Testing Manychat API ===\n');

  // Test 1: Get page info
  console.log('1. Testing API connection - Getting page info...');
  try {
    const pageRes = await fetch(`${MANYCHAT_API_BASE}/fb/page/getInfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!pageRes.ok) {
      const error = await pageRes.text();
      console.error('❌ Page info failed:', error);
      return;
    }

    const pageData = await pageRes.json();
    console.log('✅ Page info:', pageData.data);
  } catch (err) {
    console.error('❌ Error getting page info:', err.message);
    return;
  }

  // Test 2: Get subscriber info
  console.log(`\n2. Getting subscriber info for ID: ${subscriberId}...`);
  try {
    const url = `${MANYCHAT_API_BASE}/fb/subscriber/getInfo?subscriber_id=${subscriberId}`;
    console.log('Request URL:', url);

    const subRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!subRes.ok) {
      const error = await subRes.text();
      console.error('❌ Subscriber info failed:', subRes.status, error);
      return;
    }

    const subData = await subRes.json();
    console.log('✅ Subscriber data:');
    console.log(JSON.stringify(subData.data, null, 2));

    // Show key fields
    console.log('\n📋 Key Fields:');
    console.log('  - Name:', subData.data.first_name, subData.data.last_name);
    console.log('  - Email:', subData.data.email || 'N/A');
    console.log('  - Phone:', subData.data.phone || 'N/A');
    console.log('  - Profile Pic:', subData.data.profile_pic || 'N/A');
    console.log('  - Tags:', subData.data.tags?.length || 0);
    console.log('  - Custom Fields:', subData.data.custom_fields?.length || 0);

  } catch (err) {
    console.error('❌ Error getting subscriber info:', err.message);
  }
}

// Get API token and subscriber ID from environment or command line
const apiToken = process.env.MANYCHAT_API_TOKEN || process.argv[2];
const subscriberId = process.env.SUBSCRIBER_ID || process.argv[3];

if (!apiToken) {
  console.error('❌ Error: MANYCHAT_API_TOKEN not provided');
  console.log('\nUsage:');
  console.log('  node test-sync-contact.js <API_TOKEN> <SUBSCRIBER_ID>');
  console.log('  or set MANYCHAT_API_TOKEN and SUBSCRIBER_ID environment variables');
  process.exit(1);
}

if (!subscriberId) {
  console.error('❌ Error: SUBSCRIBER_ID not provided');
  console.log('\nUsage:');
  console.log('  node test-sync-contact.js <API_TOKEN> <SUBSCRIBER_ID>');
  process.exit(1);
}

testManychatAPI(apiToken, subscriberId);
