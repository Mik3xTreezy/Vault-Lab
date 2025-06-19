-- Create device_targeting table for admin panel device-specific configurations
CREATE TABLE device_targeting (
  id SERIAL PRIMARY KEY,
  device VARCHAR(50) NOT NULL,
  country VARCHAR(10) NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  ad_url TEXT,
  cpm DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate device/country combinations
ALTER TABLE device_targeting 
ADD CONSTRAINT unique_device_country UNIQUE (device, country);

-- Create indexes for better performance
CREATE INDEX idx_device_targeting_device ON device_targeting(device);
CREATE INDEX idx_device_targeting_country ON device_targeting(country);
CREATE INDEX idx_device_targeting_task_id ON device_targeting(task_id);

-- Add comments for documentation
COMMENT ON TABLE device_targeting IS 'Device and country-specific task targeting configurations';
COMMENT ON COLUMN device_targeting.device IS 'Target device: Windows, MacOS, Android, iOS';
COMMENT ON COLUMN device_targeting.country IS 'Country code (US, GB, etc.)';
COMMENT ON COLUMN device_targeting.task_id IS 'Specific task to show for this device/country combination';
COMMENT ON COLUMN device_targeting.ad_url IS 'Device/country-specific ad URL override';
COMMENT ON COLUMN device_targeting.cpm IS 'Device/country-specific CPM rate override';

-- Create IP tracking table for preventing duplicate analytics within 24 hours
-- Supports both task-level events (task_complete) and locker-level events (visit, unlock)
CREATE TABLE ip_task_tracking (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- NULL for locker-level events
  locker_id VARCHAR(255) NOT NULL, -- Always present for both task and locker events
  user_id VARCHAR(255),
  country VARCHAR(10),
  device VARCHAR(50),
  event_type VARCHAR(50) DEFAULT 'task_complete', -- 'visit', 'unlock', 'task_complete'
  revenue_counted BOOLEAN DEFAULT TRUE,
  first_completion_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_completion_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create composite unique constraint for IP + task_id + locker_id combination
-- This handles both task-level (with task_id) and locker-level (task_id = NULL) events
CREATE UNIQUE INDEX unique_ip_task_locker ON ip_task_tracking (ip_address, COALESCE(task_id::text, ''), locker_id, event_type);

-- Create indexes for performance
CREATE INDEX idx_ip_task_tracking_ip ON ip_task_tracking(ip_address);
CREATE INDEX idx_ip_task_tracking_task_id ON ip_task_tracking(task_id);
CREATE INDEX idx_ip_task_tracking_first_completion ON ip_task_tracking(first_completion_at);
CREATE INDEX idx_ip_task_tracking_revenue_counted ON ip_task_tracking(revenue_counted);

-- Add comments
COMMENT ON TABLE ip_task_tracking IS 'Tracks IP addresses to prevent duplicate analytics counting within 24 hours for all events';
COMMENT ON COLUMN ip_task_tracking.ip_address IS 'User IP address (hashed for privacy)';
COMMENT ON COLUMN ip_task_tracking.task_id IS 'Task ID for task-specific events (NULL for locker-level events)';
COMMENT ON COLUMN ip_task_tracking.locker_id IS 'Locker ID (always present for all events)';
COMMENT ON COLUMN ip_task_tracking.event_type IS 'Type of event: visit, unlock, task_complete';
COMMENT ON COLUMN ip_task_tracking.revenue_counted IS 'Whether this event counted for analytics (first time in 24h)';
COMMENT ON COLUMN ip_task_tracking.completion_count IS 'Total number of this event type from this IP for this resource';

-- Example data (optional - replace UUIDs with actual task IDs from your tasks table)
-- INSERT INTO device_targeting (device, country, task_id, ad_url, cpm) VALUES
-- ('Windows', 'US', 'your-task-uuid-here', 'https://ads.example.com/windows-us', 4.50),
-- ('iOS', 'US', 'your-task-uuid-here', 'https://ads.example.com/ios-us', 3.80),
-- ('Android', 'IN', 'your-task-uuid-here', 'https://ads.example.com/android-in', 1.20); 