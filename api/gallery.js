// Gallery API endpoints for managing gallery submissions using PostgreSQL
const { Database } = require('../lib/database');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all approved gallery items for public view
            const query = `
                SELECT g.*, c.username as author_name
                FROM gallery_items g
                LEFT JOIN captains c ON g.author_id = c.id
                WHERE g.status = 'approved'
                ORDER BY g.created_at DESC
            `;
            
            const result = await Database.query(query);

            res.status(200).json({
                success: true,
                items: result.rows
            });

        } else {
            res.status(405).json({ 
                success: false, 
                error: 'Method not allowed' 
            });
        }

    } catch (error) {
        console.error('Gallery API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
