# 🗄️ KRAKEN Database Setup Guide
# Google Cloud SQL Console Database Initialization

## 📊 Database Connection Information

### 🔐 Database Accounts Available:
1. **postgres** (superuser)
   - Username: `postgres`
   - Password: `zCvwplWcuoBZ14y5PtdA2gOESsk3QUVI`
   - Use this for initial setup and admin tasks

2. **kraken_user** (application user)
   - Username: `kraken_user`
   - Password: `BuDNnyleo8ZJ5U0jmGdf6KcQqXEt713x`
   - This is what the application uses

### 📋 Database Information:
- **Instance Name**: `kraken-db`
- **Database Name**: `postgres` (using default PostgreSQL database)
- **Region**: `us-central1`
- **Version**: PostgreSQL 15

## 🚀 Step-by-Step Console Setup

### Step 1: Access Cloud SQL Console
1. Open your browser and go to: https://console.cloud.google.com/sql/instances/kraken-db/overview?project=kraken-naval-clan
2. Make sure you're logged into the correct Google account
3. You should see the "kraken-db" instance

### Step 2: Open Cloud SQL Studio
1. In the instance overview page, click **"Cloud SQL Studio"** button
2. Click **"Open Cloud SQL Studio"** 
3. A new tab will open with the database interface

### Step 3: Login to Database
⚠️ **IMPORTANT**: Make sure to select the correct database!

**Login Credentials:**
- **User**: `postgres`
- **Password**: `zCvwplWcuoBZ14y5PtdA2gOESsk3QUVI`
- **Database**: `postgres` ⚠️ **Use the default postgres database!**

**IMPORTANT**: You should use the default `postgres` database, not `kraken_production`. The application has been configured to connect to the `postgres` database.

### Step 4: Execute Schema
1. Once logged in, you'll see a SQL editor
2. Copy and paste the entire contents of `schema.sql` (shown below)
3. Click **"Run"** or **"Execute"** button
4. Wait for all tables to be created

### Step 5: Verify Setup
Run this query to verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- applications
- marketplace_listings  
- port_battles
- port_battle_signups
- webhooks

## 📄 Complete Schema to Execute

Copy and paste this entire schema into Cloud SQL Studio:

```sql
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
    signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace listings table for buying/selling in-game items
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_name VARCHAR(255) NOT NULL,
    seller_discord_id VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    currency VARCHAR(20) DEFAULT 'reals',
    condition_quality VARCHAR(50),
    location VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    reserved_by VARCHAR(255),
    reserved_until TIMESTAMP WITH TIME ZONE,
    sold_to VARCHAR(255),
    sold_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks table for tracking Discord webhook deliveries
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    payload_hash VARCHAR(255) NOT NULL,
    discord_webhook_url VARCHAR(500) NOT NULL,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_port_battles_scheduled_time ON port_battles(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_port_battles_status ON port_battles(status);
CREATE INDEX IF NOT EXISTS idx_port_battle_signups_battle_id ON port_battle_signups(port_battle_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_item_type ON marketplace_listings(item_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_created_at ON marketplace_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON webhooks(created_at);

-- Grant permissions to kraken_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kraken_user;
GRANT USAGE ON SCHEMA public TO kraken_user;

-- Insert some sample data for testing
INSERT INTO applications (captain_name, preferred_name, discord_id, playtime_hours, timezone, experience_level, ship_preferences, availability, additional_notes, referral_source) VALUES 
('TestCaptain', 'Test', 'test#1234', 500, 'UTC-5', 'experienced', ARRAY['Frigate', 'Ship of the Line'], 'Evenings and weekends', 'This is a test application', 'Discord');

-- Final verification
SELECT 'Schema creation completed successfully!' as status;
```

## 🔍 Troubleshooting

### If you get permission errors:
1. Try using the `postgres` user instead of `kraken_user`
2. Make sure you selected the correct database (`postgres`)

### If Cloud SQL Studio doesn't load:
1. Try refreshing the page
2. Make sure popups are allowed for console.cloud.google.com
3. Try using an incognito/private browsing window

### If login fails:
1. Double-check you copied the password correctly (no extra spaces)
2. Make sure you're in the `postgres` database, not `kraken_production` database

### ⚠️ If You Already Set Up in Wrong Database

**If you accidentally created the schema in the `kraken_production` database instead of `postgres`:**

1. **Go back to Cloud SQL Studio**
2. **This time, select `postgres` database** (not kraken_production)
3. **Re-run the entire schema** (it will create the tables in the correct database)
4. **The application expects tables to be in `postgres`**

**Note**: Having tables in both databases won't hurt anything, but the application only looks in `postgres`.

## ✅ Success Verification

After running the schema, you should see:
1. **5 tables created**: applications, port_battles, port_battle_signups, marketplace_listings, webhooks
2. **Multiple indexes created** for performance
3. **Sample data inserted** (1 test application)
4. **Success message**: "Schema creation completed successfully!"

Once complete, your KRAKEN website will be 100% functional with a fully initialized database!
