-- Database Migration: Add Publisher-Level IP Tracking
-- This prevents revenue farming across multiple links from the same publisher
-- Run these commands in your Supabase SQL editor

-- Step 1: Add publisher_id column to track by publisher instead of individual locker
ALTER TABLE ip_task_tracking ADD COLUMN IF NOT EXISTS publisher_id VARCHAR(255);

-- Step 2: Populate publisher_id for existing records by joining with lockers table
UPDATE ip_task_tracking 
SET publisher_id = lockers.user_id 
FROM lockers 
WHERE ip_task_tracking.locker_id = lockers.id 
AND ip_task_tracking.publisher_id IS NULL;

-- Step 3: Make publisher_id NOT NULL after populating existing data
ALTER TABLE ip_task_tracking ALTER COLUMN publisher_id SET NOT NULL;

-- Step 4: Drop the old unique indexes
DROP INDEX IF EXISTS unique_ip_task_locker;
DROP INDEX IF EXISTS unique_ip_task;

-- Step 5: Create new unique index based on IP + publisher (not locker)
-- This ensures one IP can only generate revenue for a publisher once per 24h across ALL their links
CREATE UNIQUE INDEX IF NOT EXISTS unique_ip_publisher ON ip_task_tracking (ip_address, publisher_id);

-- Step 6: Add index for performance
CREATE INDEX idx_ip_task_tracking_publisher_id ON ip_task_tracking(publisher_id);

-- Step 7: Update comments
COMMENT ON COLUMN ip_task_tracking.publisher_id IS 'Publisher ID - prevents revenue farming across multiple links from same publisher';
COMMENT ON TABLE ip_task_tracking IS 'Tracks IP addresses to prevent duplicate analytics counting within 24 hours PER PUBLISHER (not per link)';

-- Step 8: Clean up any duplicate records that might exist after the change
-- Keep only the earliest record for each IP + publisher combination
WITH ranked_records AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY ip_address, publisher_id ORDER BY first_completion_at ASC) as rn
  FROM ip_task_tracking
)
DELETE FROM ip_task_tracking 
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
); 