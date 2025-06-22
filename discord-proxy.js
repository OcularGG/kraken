const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1386130290640162857/1WB7lqwj3RVAcib7H08ygsfBozw7u5PHDSgAgOLCn1SpKy1Fkjlrc0byPmN2Wl8vgpzG';

app.use(cors({
  origin: ['http://localhost:3000', 'https://kraken-oculargg.vercel.app', 'https://*.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Vercel serverless function export
module.exports = app;

app.post('/api/discord-webhook', async (req, res) => {
  try {
    console.log('Received application:', req.body);
    const payload = req.body;
    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (discordRes.ok) {
      console.log('Successfully sent to Discord');
      res.status(200).json({ success: true });
    } else {
      console.error('Discord webhook error:', discordRes.status, discordRes.statusText);
      res.status(500).json({ error: 'Discord webhook error' });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Discord proxy server running on http://localhost:${PORT}`);
  });
}
