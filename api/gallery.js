// Gallery API endpoints for managing gallery submissions
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

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
            const { data, error } = await supabase
                .from('gallery_items')
                .select(`
                    *,
                    author_name:captains(username)
                `)
                .eq('status', 'approved')
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
        console.error('Gallery API error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};
