// Import https module for Node.js compatibility
const https = require('https');
const { URL } = require('url');

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
    console.log('Webhook request received at:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const payload = req.body;
    
    // Validate that we have the required Discord webhook structure
    if (!payload.embeds || !Array.isArray(payload.embeds) || payload.embeds.length === 0) {
      console.error('Invalid payload structure:', payload);
      return res.status(400).json({ error: 'Invalid payload structure' });
    }
    
    console.log('Sending to Discord webhook...');
    
    // Use https module instead of fetch for better Node.js compatibility
    const url = new URL(DISCORD_WEBHOOK_URL);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const discordRequest = https.request(options, (discordRes) => {
      let data = '';
      
      discordRes.on('data', (chunk) => {
        data += chunk;
      });
      
      discordRes.on('end', () => {
        if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
          console.log('Successfully sent to Discord');
          res.status(200).json({ success: true });
        } else {
          console.error('Discord webhook error:', {
            status: discordRes.statusCode,
            statusMessage: discordRes.statusMessage,
            data: data
          });
          res.status(500).json({ 
            error: 'Discord webhook error', 
            details: data || `HTTP ${discordRes.statusCode}: ${discordRes.statusMessage}` 
          });
        }
      });
    });

    discordRequest.on('error', (err) => {
      console.error('Discord request error:', err);
      res.status(500).json({ error: 'Network error', details: err.message });
    });

    discordRequest.write(postData);
    discordRequest.end();

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
