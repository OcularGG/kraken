// Test the actual Vercel API endpoint
const testVercelEndpoint = async () => {
  // Test payload that matches what the form sends
  const testPayload = {
    embeds: [{
      title: 'New KRAKEN Application',
      color: 0xbfa140,
      fields: [
        { name: "Captain's Name", value: 'Test Captain', inline: true },
        { name: 'Previous Clans', value: 'None', inline: true },
        { name: 'Has Discord', value: 'Yes', inline: true },
        { name: 'Discord Username', value: 'testuser#1234', inline: true },
        { name: 'In KRAKEN Discord', value: 'Yes', inline: true },
        { name: 'In Admiralty Discord', value: 'No', inline: true },
        { name: 'Player Type', value: 'Casual', inline: true },
        { name: 'Current Rank', value: 'Captain', inline: true },
        { name: 'Familiar with RvR', value: 'Yes', inline: true },
        { name: 'RvR Experience', value: 'Some experience with port battles', inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Naval Action KRAKEN Clan' }
    }],
    username: 'KRAKEN Application'
  };
  // Replace with your actual Vercel URL
  const VERCEL_API_URL = 'https://kraken-cx1d.vercel.app/api/discord-webhook';
  
  console.log('Testing Vercel API endpoint...');
  console.log('URL:', VERCEL_API_URL);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Vercel API test successful:', result);
    } else {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      console.error('❌ Vercel API test failed:', response.status, response.statusText);
      console.error('Error body:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testVercelEndpoint();
