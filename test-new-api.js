// Test the new simplified form endpoint
const testNewAPI = async () => {
  const testPayload = {
    embeds: [{
      title: '🦑 New KRAKEN Application',
      color: 0xbfa140,
      fields: [
        { name: "Captain's Name", value: 'Test Captain', inline: true },
        { name: 'Discord Username', value: 'testuser#1234', inline: true },
        { name: 'Player Type', value: 'Casual', inline: true },
        { name: 'Current Rank', value: 'Captain', inline: true },
        { name: 'RvR Experience', value: 'Beginner', inline: true },
        { name: 'Previous Clans', value: 'None', inline: true },
        { name: 'Why join KRAKEN?', value: 'Looking for active RvR clan', inline: false }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Naval Action KRAKEN Clan Application' }
    }],
    username: 'KRAKEN Recruitment'
  };

  const VERCEL_API_URL = 'https://kraken-cx1d.vercel.app/api/discord-webhook';
  
  console.log('Testing new form API endpoint...');
  console.log('URL:', VERCEL_API_URL);
  
  try {
    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API test successful:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ API test failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testNewAPI();
