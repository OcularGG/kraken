// Simple database table creation test
const { Pool } = require('pg');

const dbConfig = {
    host: process.env.DB_HOST || '/cloudsql/kraken-naval-clan:us-central1:kraken-db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kraken_production',
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

const SIMPLE_TABLE_SQL = `
-- Test basic table creation
CREATE TABLE IF NOT EXISTS test_connection (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_connection (message) VALUES ('Database connection successful!');
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const pool = new Pool(dbConfig);
    
    try {
        console.log('Testing basic database connection...');
        console.log('Config:', { 
            host: dbConfig.host, 
            database: dbConfig.database, 
            user: dbConfig.user,
            hasPassword: !!dbConfig.password 
        });
        
        const client = await pool.connect();
        try {
            await client.query(SIMPLE_TABLE_SQL);
            const testResult = await client.query('SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1');
            
            console.log('Database test completed successfully');
            
            res.status(200).json({ 
                success: true, 
                message: 'Database connection test successful',
                timestamp: new Date().toISOString(),
                testResult: testResult.rows[0],
                user: 'postgres'
            });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Database test error:', err);
        res.status(500).json({ 
            error: 'Database connection failed', 
            details: err.message,
            user: 'postgres',
            config: {
                host: dbConfig.host,
                database: dbConfig.database,
                user: dbConfig.user,
                hasPassword: !!dbConfig.password
            }
        });
    } finally {
        await pool.end();
    }
};
