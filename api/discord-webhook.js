const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1386130290640162857/1WB7lqwj3RVAcib7H08ygsfBozw7u5PHDSgAgOLCn1SpKy1Fkjlrc0byPmN2Wl8vgpzG';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    console.log('Received application:', JSON.stringify(req.body, null, 2));
    const payload = req.body;
    
    // Validate that we have the required Discord webhook structure
    if (!payload.embeds || !Array.isArray(payload.embeds) || payload.embeds.length === 0) {
      console.error('Invalid payload structure:', payload);
      return res.status(400).json({ error: 'Invalid payload structure' });
    }
    
    console.log('Sending to Discord webhook:', DISCORD_WEBHOOK_URL.substring(0, 50) + '...');
    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (discordRes.ok) {
      console.log('Successfully sent to Discord');
      res.status(200).json({ success: true });
    } else {
      let errorText;
      try {
        errorText = await discordRes.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      console.error('Discord webhook error:', {
        status: discordRes.status,
        statusText: discordRes.statusText,
        errorText: errorText,
        headers: Object.fromEntries(discordRes.headers)
      });
      res.status(500).json({ 
        error: 'Discord webhook error', 
        details: errorText || `HTTP ${discordRes.status}: ${discordRes.statusText}` 
      });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
