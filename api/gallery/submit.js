// Gallery submission API endpoint
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { captainCode, contentType, contentUrl, caption, thumbnailUrl } = req.body;

        // Validate required fields
        if (!captainCode || !contentType || !contentUrl || !caption) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate Captain's Code format
        if (!/^\d{8}$/.test(captainCode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Captain\'s Code format'
            });
        }

        // Verify Captain's Code exists
        const { data: captain, error: captainError } = await supabase
            .from('captains')
            .select('id, username')
            .eq('code', captainCode)
            .single();

        if (captainError || !captain) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Captain\'s Code'
            });
        }

        // Validate content type
        if (!['image', 'video'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type'
            });
        }

        // Validate URL format
        try {
            new URL(contentUrl);
            if (thumbnailUrl && thumbnailUrl.trim()) {
                new URL(thumbnailUrl);
            }
        } catch (urlError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        // Insert gallery item
        const { data: galleryItem, error: insertError } = await supabase
            .from('gallery_items')
            .insert([
                {
                    author_id: captain.id,
                    type: contentType,
                    url: contentUrl.trim(),
                    caption: caption.trim(),
                    thumbnail: thumbnailUrl?.trim() || null,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting gallery item:', insertError);
            return res.status(500).json({
                success: false,
                error: 'Failed to submit gallery item'
            });
        }

        // Send Discord notification (optional)
        try {
            const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordWebhookUrl) {
                const embed = {
                    title: "🎨 New Gallery Submission",
                    description: `**${captain.username}** submitted new content for review`,
                    fields: [
                        {
                            name: "Type",
                            value: contentType,
                            inline: true
                        },
                        {
                            name: "Caption",
                            value: caption.substring(0, 100) + (caption.length > 100 ? '...' : ''),
                            inline: false
                        }
                    ],
                    color: 0xBFA140,
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: "KRAKEN Gallery System"
                    }
                };

                if (contentType === 'image') {
                    embed.image = { url: contentUrl };
                } else if (thumbnailUrl) {
                    embed.thumbnail = { url: thumbnailUrl };
                }

                await fetch(discordWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        embeds: [embed]
                    })
                });
            }
        } catch (discordError) {
            console.error('Discord notification error:', discordError);
            // Don't fail the submission if Discord fails
        }

        return res.status(200).json({
            success: true,
            message: 'Gallery item submitted successfully',
            item: galleryItem
        });

    } catch (error) {
        console.error('Gallery submission error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
