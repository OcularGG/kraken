// Alternative database initialization using postgres superuser
const { Pool } = require('pg');

// Database connection configuration for postgres superuser
const dbConfig = {
    host: process.env.DB_HOST || '/cloudsql/kraken-naval-clan:us-central1:kraken-db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kraken_production',
    user: 'postgres', // Use postgres superuser
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// SQL statements for creating tables
const CREATE_TABLES_SQL = `
-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captain_name VARCHAR(255) NOT NULL,
    preferred_name VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) NOT NULL,
    playtime_hours INTEGER NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    experience_level VARCHAR(50) NOT NULL,
    ship_preferences TEXT[],
    availability TEXT,
    additional_notes TEXT,
    referral_source VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255)
);

-- Port battles table
CREATE TABLE IF NOT EXISTS port_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_name VARCHAR(255) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    server_name VARCHAR(100) NOT NULL,
    battle_type VARCHAR(50) NOT NULL,
    description TEXT,
    max_participants INTEGER DEFAULT 25,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Port battle signups table
CREATE TABLE IF NOT EXISTS port_battle_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_battle_id UUID NOT NULL REFERENCES port_battles(id) ON DELETE CASCADE,
    captain_name VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) NOT NULL,
    ship_preference VARCHAR(255) NOT NULL,
    backup_ship VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Captains table
CREATE TABLE IF NOT EXISTS captains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    discord_id VARCHAR(255) UNIQUE,
    rank VARCHAR(100) DEFAULT 'Member',
    specialization VARCHAR(255),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gallery submissions table
CREATE TABLE IF NOT EXISTS gallery_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    submitted_by VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255),
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_port_battles_scheduled_time ON port_battles(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_port_battles_status ON port_battles(status);
CREATE INDEX IF NOT EXISTS idx_port_battle_signups_battle_id ON port_battle_signups(port_battle_id);
CREATE INDEX IF NOT EXISTS idx_captains_name ON captains(name);
CREATE INDEX IF NOT EXISTS idx_captains_discord_id ON captains(discord_id);
CREATE INDEX IF NOT EXISTS idx_gallery_status ON gallery_submissions(status);
CREATE INDEX IF NOT EXISTS idx_gallery_submitted_at ON gallery_submissions(submitted_at);

-- Grant all privileges to kraken_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kraken_user;
GRANT USAGE ON SCHEMA public TO kraken_user;
GRANT CREATE ON SCHEMA public TO kraken_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO kraken_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO kraken_user;
`;

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

    const pool = new Pool(dbConfig);
    
    try {
        console.log('Initializing database tables with postgres superuser...');
        
        // Execute the SQL to create tables
        const client = await pool.connect();
        try {
            await client.query(CREATE_TABLES_SQL);
            
            // Test the connection by trying to select from one of the tables
            const testResult = await client.query('SELECT COUNT(*) as count FROM applications LIMIT 1');
            
            console.log('Database initialization completed successfully');
            
            res.status(200).json({ 
                success: true, 
                message: 'Database tables initialized successfully with postgres superuser',
                timestamp: new Date().toISOString(),
                testQuery: testResult.rows[0],
                user: 'postgres'
            });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Database initialization error:', err);
        res.status(500).json({ 
            error: 'Failed to initialize database', 
            details: err.message,
            user: 'postgres' 
        });
    } finally {
        await pool.end();
    }
};
