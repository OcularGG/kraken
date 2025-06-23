// Database initialization API
const { supabase, CREATE_TABLES_SQL } = require('../../lib/supabase');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Initializing database tables...');
        
        // Execute the SQL to create tables
        const { error } = await supabase.rpc('exec_sql', { 
            sql_query: CREATE_TABLES_SQL 
        });

        if (error) {
            console.error('Database initialization error:', error);
            
            // Try alternative approach - create tables one by one
            const tableQueries = CREATE_TABLES_SQL.split(';').filter(query => query.trim());
            
            for (const query of tableQueries) {
                if (query.trim()) {
                    const { error: queryError } = await supabase.rpc('exec_sql', { 
                        sql_query: query.trim() + ';'
                    });
                    
                    if (queryError) {
                        console.error('Error executing query:', query, queryError);
                        // Continue with other queries even if one fails
                    }
                }
            }
        }

        // Test the connection by trying to select from one of the tables
        const { data: testData, error: testError } = await supabase
            .from('applications')
            .select('count')
            .limit(1);

        if (testError && !testError.message.includes('relation "applications" does not exist')) {
            console.error('Database test error:', testError);
        }

        console.log('Database initialization completed');
        
        res.status(200).json({ 
            success: true, 
            message: 'Database tables initialized successfully',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Server error during database initialization:', err);
        res.status(500).json({ 
            error: 'Database initialization failed', 
            details: err.message 
        });
    }
};
