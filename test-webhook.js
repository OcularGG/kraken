// Test script to verify Discord webhook
const testWebhook = async () => {
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1386130290640162857/1WB7lqwj3RVAcib7H08ygsfBozw7u5PHDSgAgOLCn1SpKy1Fkjlrc0byPmN2Wl8vgpzG';
  
  // Test 1: Simple payload (this worked)
  const simplePayload = {
    embeds: [{
      title: "Test Application",
      description: "This is a test submission",
      color: 0x00ff00,
      fields: [
        { name: "Test Field", value: "Test Value", inline: true }
      ]
    }],
    username: 'KRAKEN Application Test'
  };
  // Test 2: Payload that matches the application form structure (FIXED)
  const applicationPayload = {
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

  console.log('Testing simple payload...');
  try {
    const response1 = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simplePayload)
    });
    
    if (response1.ok) {
      console.log('✅ Simple payload test successful');
    } else {
      const errorText1 = await response1.text();
      console.error('❌ Simple payload test failed:', response1.status, errorText1);
    }
  } catch (error) {
    console.error('❌ Simple payload network error:', error);
  }

  console.log('\nTesting application form payload...');
  try {
    const response2 = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationPayload)
    });
    
    if (response2.ok) {
      console.log('✅ Application payload test successful');
    } else {
      const errorText2 = await response2.text();
      console.error('❌ Application payload test failed:', response2.status, errorText2);
    }
  } catch (error) {
    console.error('❌ Application payload network error:', error);
  }
};

testWebhook();
