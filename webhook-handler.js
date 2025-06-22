// This is a server-side handler for Discord webhooks
// You'll need to implement this on your backend (Node.js example)

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Store your webhook URL securely (use environment variables in production)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'YOUR_WEBHOOK_URL_HERE';

app.post('/api/send-webhook', async (req, res) => {
    try {
        const { sellerDiscord, buyerDiscord, listingId, listingUrl } = req.body;
        
        const webhookData = {
            content: `<@${sellerDiscord}> New buyer interested in your Naval Action listing!`,
            embeds: [{
                title: 'Naval Action Marketplace - Buyer Interest',
                description: 'A buyer has expressed interest in your listing',
                fields: [
                    {
                        name: 'Buyer Discord',
                        value: buyerDiscord,
                        inline: true
                    },
                    {
                        name: 'Listing ID',
                        value: listingId,
                        inline: true
                    },
                    {
                        name: 'View Listing',
                        value: `[Click here](${listingUrl})`
                    }
                ],
                color: 11961339, // Dark gold color
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Naval Action Marketplace'
                }
            }]
        };
        
        await axios.post(DISCORD_WEBHOOK_URL, webhookData);
        
        res.json({ success: true, message: 'Webhook sent successfully' });
    } catch (error) {
        console.error('Error sending webhook:', error);
        res.status(500).json({ success: false, message: 'Failed to send webhook' });
    }
});

// Endpoint to create a new listing
app.post('/api/listings', async (req, res) => {
    try {
        const listing = req.body;
        
        // In production, save to database
        // For now, we'll just return the listing with an ID
        listing.id = 'NA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        res.json({ success: true, listing });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ success: false, message: 'Failed to create listing' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});