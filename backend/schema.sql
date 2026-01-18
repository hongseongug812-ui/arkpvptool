-- ARK PVP Tool Database Schema
-- Run this in RDS PostgreSQL

-- Users table (Cognito handles auth, this stores additional profile data)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'rathole', 'dino', 'build'
    item_id VARCHAR(100) NOT NULL,
    item_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- Hatching timers table
CREATE TABLE IF NOT EXISTS hatching_timers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    dino_type VARCHAR(50) NOT NULL,
    nickname VARCHAR(100),
    start_time BIGINT NOT NULL,
    end_time BIGINT NOT NULL,
    server_rate INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared builds/configs table (for sharing with other users)
CREATE TABLE IF NOT EXISTS shared_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'raid', 'breeding', 'dino_stats'
    config_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_timers_user ON hatching_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_public ON shared_configs(is_public, created_at DESC);
