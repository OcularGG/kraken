// Google Cloud SQL PostgreSQL client configuration
const { Pool } = require('pg');

// Database connection configuration
const dbConfig = {
    host: (process.env.DB_HOST || '/cloudsql/kraken-naval-clan:us-central1:kraken-db').trim(),
    port: process.env.DB_PORT || 5432,
    database: (process.env.DB_NAME || 'postgres').trim(),
    user: (process.env.DB_USER || 'postgres').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),
    ssl: false, // No SSL needed for Cloud SQL Proxy
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Database helper functions
class Database {
    static async query(text, params) {
        const client = await pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database transaction error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async initializeTables() {
        const createTablesSQL = `
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
                allowed_rates TEXT[],
                allowed_ships TEXT[],
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
                status VARCHAR(50) DEFAULT 'pending',
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

        try {
            await this.query(createTablesSQL);
            console.log('✅ Database tables initialized successfully');
            return { success: true, message: 'Database tables initialized successfully' };
        } catch (error) {
            console.error('❌ Error initializing database tables:', error);
            throw error;
        }
    }

    static async healthCheck() {
        try {
            const result = await this.query('SELECT NOW() as current_time');
            return {
                status: 'healthy',
                timestamp: result.rows[0].current_time,
                connection: 'active'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connection: 'failed'
            };
        }
    }

    // Applications methods
    static async insertApplication(applicationData) {
        try {
            const query = `
                INSERT INTO applications (
                    captain_name, preferred_name, discord_id, playtime_hours, 
                    timezone, experience_level, ship_preferences, availability, 
                    additional_notes, referral_source, status, submitted_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;
            const values = [
                applicationData.captain_name,
                applicationData.preferred_name,
                applicationData.discord_id,
                applicationData.playtime_hours,
                applicationData.timezone,
                applicationData.experience_level,
                applicationData.ship_preferences,
                applicationData.availability,
                applicationData.additional_notes,
                applicationData.referral_source,
                'pending',
                new Date()
            ];
            
            const result = await this.query(query, values);
            return { data: result.rows[0], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    static async getAllApplications() {
        try {
            const query = 'SELECT * FROM applications ORDER BY submitted_at DESC';
            const result = await this.query(query);
            return { data: result.rows, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
}

module.exports = { Database, pool };
