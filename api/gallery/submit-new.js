// Gallery submission API endpoint using PostgreSQL
const { Database } = require('../../lib/database');

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
                error: 'Missing required fields: captainCode, contentType, contentUrl, and caption are required'
            });
        }

        // Validate content type
        if (!['image', 'video'].includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type. Must be either "image" or "video"'
            });
        }

        // Validate URLs
        try {
            new URL(contentUrl);
            if (thumbnailUrl) {
                new URL(thumbnailUrl);
            }
        } catch (urlError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        console.log('Processing gallery submission from captain:', captainCode);

        // Verify captain exists and is active
        const captainQuery = `
            SELECT * FROM captains 
            WHERE code = $1 AND is_active = true
        `;
        const captainResult = await Database.query(captainQuery, [captainCode.toUpperCase()]);

        if (captainResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or inactive captain code'
            });
        }

        const captain = captainResult.rows[0];

        // Check rate limiting (max 5 submissions per hour per captain)
        const rateLimitQuery = `
            SELECT COUNT(*) as submission_count
            FROM gallery_items
            WHERE author_id = $1 
            AND created_at > NOW() - INTERVAL '1 hour'
        `;
        const rateLimitResult = await Database.query(rateLimitQuery, [captain.id]);

        if (parseInt(rateLimitResult.rows[0].submission_count) >= 5) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Maximum 5 submissions per hour.'
            });
        }

        // Insert gallery item
        const insertQuery = `
            INSERT INTO gallery_items (
                author_id, type, url, caption, thumbnail, status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [
            captain.id,
            contentType,
            contentUrl,
            caption,
            thumbnailUrl || null,
            'pending'
        ];

        const result = await Database.query(insertQuery, values);

        console.log('Gallery item submitted successfully:', result.rows[0].id);

        res.status(200).json({
            success: true,
            galleryItem: result.rows[0],
            message: 'Gallery item submitted successfully and is pending approval'
        });

    } catch (error) {
        console.error('Gallery submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
