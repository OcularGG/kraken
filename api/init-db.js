// Database initialization API using PostgreSQL
const { Database } = require('../lib/database');

// SQL statements for creating tables
const CREATE_TABLES_SQL = `
-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captain_name VARCHAR(255) NOT NULL,
    preferred_name VARCHAR(255) NOT NULL,
    age VARCHAR(10) NOT NULL,
    discord VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    nation VARCHAR(100) NOT NULL,
    hours_played VARCHAR(100) NOT NULL,
    current_rank VARCHAR(100) NOT NULL,
    previous_clans TEXT,
    pb_role VARCHAR(100) NOT NULL,
    pb_commander VARCHAR(10) NOT NULL,
    pb_experience TEXT,
    crafter VARCHAR(10) NOT NULL,
    play_time VARCHAR(100) NOT NULL,
    port_battles VARCHAR(100) NOT NULL,
    schedule TEXT,
    why_join TEXT NOT NULL,
    contribution TEXT NOT NULL,
    additional_info TEXT,
    signature VARCHAR(255) NOT NULL,
    application_date VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Port Battles table
CREATE TABLE IF NOT EXISTS port_battles (
    id VARCHAR(255) PRIMARY KEY,
    port VARCHAR(255) NOT NULL,
    battle_type VARCHAR(50) NOT NULL,
    br_limit INTEGER NOT NULL,
    meeting_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pb_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_location VARCHAR(255) NOT NULL,
    max_signups INTEGER DEFAULT 70,
    access_code VARCHAR(50) NOT NULL,
    admin_code VARCHAR(50) NOT NULL,
    allowed_rates TEXT[], -- Array of allowed ship rates
    allowed_ships TEXT[], -- Array of allowed ship names
    screening_fleets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Port Battle Signups table
CREATE TABLE IF NOT EXISTS pb_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pb_id VARCHAR(255) NOT NULL REFERENCES port_battles(id) ON DELETE CASCADE,
    captain_name VARCHAR(255) NOT NULL,
    ship_name VARCHAR(255) NOT NULL,
    ship_rate VARCHAR(10) NOT NULL,
    fleet_assignment VARCHAR(100),
    signup_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, declined
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Captains table (Captain Code system)
CREATE TABLE IF NOT EXISTS captains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    discord_username VARCHAR(255),
    application_id UUID REFERENCES applications(id),
    pb_admin BOOLEAN DEFAULT FALSE,
    gallery_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gallery items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id SERIAL PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    caption TEXT NOT NULL,
    thumbnail TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES captains(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (for future admin features)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'member', -- member, officer, admin
    discord_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_applications_captain_name ON applications(captain_name);
CREATE INDEX IF NOT EXISTS idx_port_battles_pb_time ON port_battles(pb_time);
CREATE INDEX IF NOT EXISTS idx_port_battles_access_code ON port_battles(access_code);
CREATE INDEX IF NOT EXISTS idx_pb_signups_pb_id ON pb_signups(pb_id);
CREATE INDEX IF NOT EXISTS idx_pb_signups_captain_name ON pb_signups(captain_name);
CREATE INDEX IF NOT EXISTS idx_captains_code ON captains(code);
CREATE INDEX IF NOT EXISTS idx_captains_username ON captains(username);
CREATE INDEX IF NOT EXISTS idx_captains_application_id ON captains(application_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_status ON gallery_items(status);
CREATE INDEX IF NOT EXISTS idx_gallery_items_author_id ON gallery_items(author_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_type ON gallery_items(type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at);
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

    try {
        console.log('Initializing database tables...');
        
        // Execute the SQL to create tables
        await Database.query(CREATE_TABLES_SQL);

        // Test the connection by trying to select from one of the tables
        const testResult = await Database.query('SELECT COUNT(*) as count FROM applications LIMIT 1');

        console.log('Database initialization completed successfully');
        
        res.status(200).json({ 
            success: true, 
            message: 'Database tables initialized successfully',
            timestamp: new Date().toISOString(),
            testQuery: testResult.rows[0]
        });

    } catch (err) {
        console.error('Database initialization error:', err);
        res.status(500).json({ 
            error: 'Failed to initialize database', 
            details: err.message 
        });
    }
};
