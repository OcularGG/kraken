-- KRAKEN Naval Clan Database Schema
-- PostgreSQL 15 compatible schema for Google Cloud SQL

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Applications table for clan membership applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Port battles table for RvR battle coordination
CREATE TABLE IF NOT EXISTS port_battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Port battle signups table for tracking who signed up for battles
CREATE TABLE IF NOT EXISTS port_battle_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_battle_id UUID NOT NULL REFERENCES port_battles(id) ON DELETE CASCADE,
    captain_name VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) NOT NULL,
    ship_preference VARCHAR(255) NOT NULL,
    backup_ship VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Captains table for clan member directory
CREATE TABLE IF NOT EXISTS captains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Gallery submissions table for community screenshots/videos
CREATE TABLE IF NOT EXISTS gallery_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_applications_discord_id ON applications(discord_id);

CREATE INDEX IF NOT EXISTS idx_port_battles_scheduled_time ON port_battles(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_port_battles_status ON port_battles(status);
CREATE INDEX IF NOT EXISTS idx_port_battles_server ON port_battles(server_name);

CREATE INDEX IF NOT EXISTS idx_port_battle_signups_battle_id ON port_battle_signups(port_battle_id);
CREATE INDEX IF NOT EXISTS idx_port_battle_signups_discord_id ON port_battle_signups(discord_id);

CREATE INDEX IF NOT EXISTS idx_captains_name ON captains(name);
CREATE INDEX IF NOT EXISTS idx_captains_discord_id ON captains(discord_id);
CREATE INDEX IF NOT EXISTS idx_captains_status ON captains(status);

CREATE INDEX IF NOT EXISTS idx_gallery_status ON gallery_submissions(status);
CREATE INDEX IF NOT EXISTS idx_gallery_submitted_at ON gallery_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_submissions(category);
CREATE INDEX IF NOT EXISTS idx_gallery_published_at ON gallery_submissions(published_at);

-- Grant all privileges to kraken_user
GRANT USAGE ON SCHEMA public TO kraken_user;
GRANT CREATE ON SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO kraken_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO kraken_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO kraken_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO kraken_user;

-- Insert sample data for testing
INSERT INTO captains (name, discord_id, rank, specialization) VALUES
('Admiral Kraken', 'admin#1234', 'Admiral', 'Fleet Command'),
('Captain Storm', 'storm#5678', 'Captain', 'Frigate Specialist'),
('Lieutenant Wave', 'wave#9012', 'Lieutenant', 'Scouting')
ON CONFLICT (name) DO NOTHING;

-- Create a test port battle
INSERT INTO port_battles (port_name, scheduled_time, server_name, battle_type, description, created_by) VALUES
('La Tortue', CURRENT_TIMESTAMP + INTERVAL '1 day', 'PvP Global', 'Regional Capital', 'Important strategic port battle', 'Admiral Kraken')
ON CONFLICT DO NOTHING;

-- Schema creation completed
SELECT 'KRAKEN Database Schema Created Successfully!' as status;
