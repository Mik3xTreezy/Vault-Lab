-- Database Migration: Update IP Tracking for All Analytics Events
-- Run these commands in your Supabase SQL editor to update the existing schema

-- Step 1: Add new event_type column
ALTER TABLE ip_task_tracking ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'task_complete';

-- Step 2: Update any existing records to have proper event_type and ensure locker_id is set
UPDATE ip_task_tracking SET event_type = 'task_complete' WHERE event_type IS NULL;

-- Step 3: Handle existing records that might have NULL locker_id
-- Set a default locker_id for any records that don't have one (shouldn't happen but just in case)
UPDATE ip_task_tracking SET locker_id = 'unknown' WHERE locker_id IS NULL;

-- Step 4: Now make locker_id NOT NULL
ALTER TABLE ip_task_tracking ALTER COLUMN locker_id SET NOT NULL;

-- Step 5: Drop old constraints and indexes
ALTER TABLE ip_task_tracking DROP CONSTRAINT IF EXISTS unique_ip_task;
DROP INDEX IF EXISTS unique_ip_task;

-- Step 6: Create new unique index that handles both task-level and locker-level events
CREATE UNIQUE INDEX unique_ip_task_locker ON ip_task_tracking (ip_address, COALESCE(task_id::text, ''), locker_id, event_type);

-- Step 7: Update comments
COMMENT ON TABLE ip_task_tracking IS 'Tracks IP addresses to prevent duplicate analytics counting within 24 hours for all events';
COMMENT ON COLUMN ip_task_tracking.task_id IS 'Task ID for task-specific events (NULL for locker-level events)';
COMMENT ON COLUMN ip_task_tracking.locker_id IS 'Locker ID (always present for all events)';
COMMENT ON COLUMN ip_task_tracking.event_type IS 'Type of event: visit, unlock, task_complete';
COMMENT ON COLUMN ip_task_tracking.revenue_counted IS 'Whether this event counted for analytics (first time in 24h)';
COMMENT ON COLUMN ip_task_tracking.completion_count IS 'Total number of this event type from this IP for this resource';

-- Step 8: Add country column to locker_analytics table for geographic analytics
ALTER TABLE locker_analytics ADD COLUMN IF NOT EXISTS country VARCHAR(10);

-- Step 9: Update existing records to extract country from extra field
UPDATE locker_analytics 
SET country = extra->>'country' 
WHERE extra IS NOT NULL 
  AND extra->>'country' IS NOT NULL 
  AND country IS NULL;

-- Step 10: Create index for better performance on country queries
CREATE INDEX IF NOT EXISTS idx_locker_analytics_country ON locker_analytics(country);

-- Step 11: Add comment for the new column
COMMENT ON COLUMN locker_analytics.country IS 'Country code (US, GB, etc.) extracted from visitor geolocation'; 