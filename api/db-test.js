// Database test API endpoint
const { Database } = require('../lib/database');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Test basic connection
        const healthCheck = await Database.healthCheck();
        
        // Try to list tables in current database
        const tablesQuery = `
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;
        
        const tablesResult = await Database.query(tablesQuery);
        
        // Get current database name
        const dbQuery = 'SELECT current_database() as db_name';
        const dbResult = await Database.query(dbQuery);
        
        res.status(200).json({
            health: healthCheck,
            current_database: dbResult.rows[0].db_name,
            tables: tablesResult.rows,
            table_count: tablesResult.rows.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            error: 'Database test failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
