-- Create postback system tables
-- Run this in your Supabase SQL Editor

-- 1. Add postback_secret column to tasks table for signature verification
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS postback_secret VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS postback_url VARCHAR(500);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS external_offer_id VARCHAR(100);

-- 2. Create postback_events table to store all postback notifications
CREATE TABLE IF NOT EXISTS postback_events (
  id SERIAL PRIMARY KEY,
  click_id VARCHAR(255) NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- User who completed the task (visitor)
  locker_id VARCHAR(255), -- Locker where task was completed
  status VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'pending'
  payout DECIMAL(10,4) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  conversion_id VARCHAR(255), -- External network's conversion ID
  ip INET,
  country VARCHAR(10),
  device VARCHAR(50),
  offer_id VARCHAR(100), -- External offer ID
  event_type VARCHAR(50) DEFAULT 'conversion',
  raw_data JSONB, -- Store complete postback data
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add postback_id column to revenue_events to link verified conversions
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS postback_id INTEGER REFERENCES postback_events(id) ON DELETE SET NULL;

-- 4. Create click_tracking table to track outbound clicks with unique IDs
CREATE TABLE IF NOT EXISTS click_tracking (
  id SERIAL PRIMARY KEY,
  click_id VARCHAR(255) UNIQUE NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- User who clicked (visitor)
  locker_id VARCHAR(255) NOT NULL,
  publisher_id VARCHAR(255), -- Locker owner (who gets revenue)
  ip INET,
  user_agent TEXT,
  country VARCHAR(10),
  device VARCHAR(50),
  referrer TEXT,
  destination_url TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  conversion_time TIMESTAMP WITH TIME ZONE,
  payout DECIMAL(10,4) DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_postback_events_click_id ON postback_events(click_id);
CREATE INDEX IF NOT EXISTS idx_postback_events_task_id ON postback_events(task_id);
CREATE INDEX IF NOT EXISTS idx_postback_events_status ON postback_events(status);
CREATE INDEX IF NOT EXISTS idx_postback_events_timestamp ON postback_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_postback_events_processed ON postback_events(processed);

CREATE INDEX IF NOT EXISTS idx_click_tracking_click_id ON click_tracking(click_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_task_id ON click_tracking(task_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_publisher_id ON click_tracking(publisher_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_converted ON click_tracking(converted);

CREATE INDEX IF NOT EXISTS idx_revenue_events_postback_id ON revenue_events(postback_id);

-- Add comments
COMMENT ON TABLE postback_events IS 'Stores postback notifications from external advertisers/networks';
COMMENT ON TABLE click_tracking IS 'Tracks outbound clicks with unique IDs for postback matching';
COMMENT ON COLUMN tasks.postback_secret IS 'Secret key for verifying postback signatures';
COMMENT ON COLUMN tasks.postback_url IS 'URL where advertisers should send postbacks';
COMMENT ON COLUMN tasks.external_offer_id IS 'External network/advertiser offer ID';
COMMENT ON COLUMN revenue_events.postback_id IS 'Links to postback event that verified this revenue';

-- Sample data to show the structure
-- INSERT INTO tasks (title, description, ad_url, postback_secret, external_offer_id) VALUES
-- ('Install Game App', 'Install and open the game app', 'https://ads.example.com/game-app', 'your-secret-key-123', 'GAME001'); 