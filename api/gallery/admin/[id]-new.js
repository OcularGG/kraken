// Gallery admin item management API using PostgreSQL
const { Database } = require('../../../lib/database');

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
    res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
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

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Gallery item ID is required'
            });
        }

        if (req.method === 'PUT') {
            // Update gallery item
            const { status, caption } = req.body;

            // Validate status
            if (status && !['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be pending, approved, or rejected'
                });
            }

            // Build update query
            const updates = {};
            if (status !== undefined) updates.status = status;
            if (caption !== undefined) updates.caption = caption;
            updates.updated_at = new Date().toISOString();

            const setClause = [];
            const values = [];
            let paramCount = 1;

            Object.keys(updates).forEach(key => {
                setClause.push(`${key} = $${paramCount}`);
                values.push(updates[key]);
                paramCount++;
            });

            values.push(id);

            const query = `
                UPDATE gallery_items 
                SET ${setClause.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

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
                message: 'Gallery item updated successfully'
            });

        } else if (req.method === 'DELETE') {
            // Delete gallery item
            const query = 'DELETE FROM gallery_items WHERE id = $1';
            const result = await Database.query(query, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Gallery item not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Gallery item deleted successfully'
            });

        } else {
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Gallery admin item API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};
