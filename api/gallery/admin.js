// Gallery admin API endpoint
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
            // Get all gallery items for admin view
            const { data, error } = await supabase
                .from('gallery_items')
                .select(`
                    *,
                    author_name:captains(username)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching gallery items:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch gallery items'
                });
            }

            // Format the response
            const formattedItems = data.map(item => ({
                ...item,
                author_name: item.author_name?.username || 'Unknown'
            }));

            return res.status(200).json({
                success: true,
                items: formattedItems
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('Gallery admin API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
