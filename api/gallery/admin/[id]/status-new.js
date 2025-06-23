// Gallery item status update API using PostgreSQL
const { Database } = require('../../../../lib/database');

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
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
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

        const { id } = req.query;
        const { status } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Gallery item ID is required'
            });
        }

        // Validate status
        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be pending, approved, or rejected'
            });
        }

        console.log(`Updating gallery item ${id} status to ${status}`);

        // Update gallery item status
        const query = `
            UPDATE gallery_items 
            SET status = $1, updated_at = $2
            WHERE id = $3
            RETURNING *
        `;
        
        const values = [status, new Date().toISOString(), id];
        const result = await Database.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Gallery item not found'
            });
        }

        res.status(200).json({
            success: true,
            item: result.rows[0],
            message: `Gallery item status updated to ${status}`
        });

    } catch (error) {
        console.error('Gallery status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
