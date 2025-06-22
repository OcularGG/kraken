// Test script to verify Discord webhook
const testWebhook = async () => {
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1386130290640162857/1WB7lqwj3RVAcib7H08ygsfBozw7u5PHDSgAgOLCn1SpKy1Fkjlrc0byPmN2Wl8vgpzG';
  
  const testPayload = {
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

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (response.ok) {
      console.log('✅ Discord webhook test successful');
    } else {
      const errorText = await response.text();
      console.error('❌ Discord webhook test failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

testWebhook();
