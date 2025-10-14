const API_TOKEN = '3590441:4a27cc102bdc75ac2a9dc39cf112cf81';
const SUBSCRIBER_ID = '1134149962';

async function getSubscriberInfo() {
  console.log(`Getting info for subscriber: ${SUBSCRIBER_ID}\n`);

  try {
    const response = await fetch(`https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSubscriberInfo();
