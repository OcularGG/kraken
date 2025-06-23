// Gallery admin API endpoint using PostgreSQL
const { Database } = require('../../lib/database');

async function verifyGalleryAdmin(code) {
    if (!code) return false;
    
    try {
        const query = `
            SELECT * FROM captains 
            WHERE code = $1 AND is_active = true AND gallery_admin = true
        `;
        const result = await Database.query(query, [code.toUpperCase()]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error verifying gallery admin:', error);
        return false;
    }
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Extract admin code from Authorization header
        const authHeader = req.headers.authorization;
        const adminCode = authHeader?.replace('Bearer ', '');
        
        // Verify admin access
        const isAdmin = await verifyGalleryAdmin(adminCode);
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Gallery admin permission required.'
            });
        }

        if (req.method === 'GET') {
            // Get all gallery items for admin review
            const query = `
                SELECT g.*, c.username as author_name
                FROM gallery_items g
                LEFT JOIN captains c ON g.author_id = c.id
                ORDER BY 
                    CASE WHEN g.status = 'pending' THEN 0 ELSE 1 END,
                    g.created_at DESC
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
        console.error('Gallery admin API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
