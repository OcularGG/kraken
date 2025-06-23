// Gallery admin item management API
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function verifyGalleryAdmin(code) {
    if (!code) return false;
    
    const { data, error } = await supabase
        .from('captains')
        .select('gallery_admin')
        .eq('code', code)
        .single();
    
    return !error && data?.gallery_admin === true;
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

        // Extract item ID from URL path
        const urlParts = req.url.split('/');
        const itemId = urlParts[urlParts.length - 1];
        
        if (!itemId || isNaN(parseInt(itemId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid item ID'
            });
        }

        if (req.method === 'PUT') {
            // Update item status
            const { status } = req.body;
            
            if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status'
                });
            }

            const { data, error } = await supabase
                .from('gallery_items')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', itemId)
                .select()
                .single();

            if (error) {
                console.error('Error updating gallery item:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update item status'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Item status updated successfully',
                item: data
            });
        }

        if (req.method === 'DELETE') {
            // Delete item
            const { error } = await supabase
                .from('gallery_items')
                .delete()
                .eq('id', itemId);

            if (error) {
                console.error('Error deleting gallery item:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete item'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Item deleted successfully'
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('Gallery admin item API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
