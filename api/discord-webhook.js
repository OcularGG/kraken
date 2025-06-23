// Import required modules for Node.js compatibility
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
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if this is a multipart/form-data request (with file upload)
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with file upload
      console.log('Processing multipart form data with file upload...');
      
      // For Vercel, we need to handle the raw body
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return res.status(400).json({ error: 'Missing boundary in multipart data' });
      }
      
      // Get raw body as buffer
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        
        // Forward the multipart data directly to Discord
        await forwardMultipartToDiscord(buffer, contentType, res);
      });
      
    } else {
      // Handle JSON payload (existing functionality)
      console.log('Processing JSON payload...');
      const payload = req.body;
      
      // Validate that we have the required Discord webhook structure
      if (!payload.embeds || !Array.isArray(payload.embeds) || payload.embeds.length === 0) {
        console.error('Invalid payload structure:', payload);
        return res.status(400).json({ error: 'Invalid payload structure' });
      }
      
      await sendJsonToDiscord(payload, res);
    }

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

async function forwardMultipartToDiscord(buffer, contentType, res) {
  return new Promise((resolve, reject) => {
    const url = new URL(DISCORD_WEBHOOK_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length
      }
    };

    const discordRequest = https.request(options, (discordRes) => {
      let data = '';
      
      discordRes.on('data', (chunk) => {
        data += chunk;
      });
      
      discordRes.on('end', () => {
        if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
          console.log('Successfully sent multipart data to Discord');
          res.status(200).json({ success: true });
          resolve();
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
          reject(new Error('Discord webhook error'));
        }
      });
    });

    discordRequest.on('error', (err) => {
      console.error('Discord request error:', err);
      res.status(500).json({ error: 'Network error', details: err.message });
      reject(err);
    });

    discordRequest.write(buffer);
    discordRequest.end();
  });
}

async function sendJsonToDiscord(payload, res) {
  return new Promise((resolve, reject) => {
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
          console.log('Successfully sent JSON to Discord');
          res.status(200).json({ success: true });
          resolve();
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
          reject(new Error('Discord webhook error'));
        }
      });
    });

    discordRequest.on('error', (err) => {
      console.error('Discord request error:', err);
      res.status(500).json({ error: 'Network error', details: err.message });
      reject(err);
    });

    discordRequest.write(postData);
    discordRequest.end();
  });
}
