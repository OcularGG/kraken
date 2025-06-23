-- Temporary initialization script for setting up user permissions
-- Connect to the database as postgres user and run these commands

-- Grant connect privilege to kraken_user
GRANT CONNECT ON DATABASE kraken_production TO kraken_user;

-- Switch to the kraken_production database
\c kraken_production;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO kraken_user;

-- Grant create privilege on public schema
GRANT CREATE ON SCHEMA public TO kraken_user;

-- Grant all privileges on all tables in public schema (current and future)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kraken_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO kraken_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO kraken_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO kraken_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO kraken_user;
