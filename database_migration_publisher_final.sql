-- Database Migration: Add Publisher-Level IP Tracking (FINAL VERSION)
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

-- Step 3: Set a default publisher_id for any records that couldn't be matched
UPDATE ip_task_tracking SET publisher_id = 'unknown' WHERE publisher_id IS NULL;

-- Step 4: CLEAN UP DUPLICATES FIRST (before making NOT NULL and creating unique index)
-- Keep only the earliest record for each IP + publisher combination
WITH ranked_records AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY ip_address, publisher_id ORDER BY first_completion_at ASC) as rn
  FROM ip_task_tracking
  WHERE publisher_id IS NOT NULL
)
DELETE FROM ip_task_tracking 
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Step 5: Make publisher_id NOT NULL after cleaning duplicates
ALTER TABLE ip_task_tracking ALTER COLUMN publisher_id SET NOT NULL;

-- Step 6: Drop ALL existing unique indexes and constraints (handle all variations)
DO $$ 
BEGIN
    -- Drop constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ip_task') THEN
        ALTER TABLE ip_task_tracking DROP CONSTRAINT unique_ip_task;
    END IF;
    
    -- Drop indexes
    DROP INDEX IF EXISTS unique_ip_task;
    DROP INDEX IF EXISTS unique_ip_task_locker;
    DROP INDEX IF EXISTS unique_ip_publisher;
END $$;

-- Step 7: Now create the unique index (should work since duplicates are cleaned)
CREATE UNIQUE INDEX unique_ip_publisher ON ip_task_tracking (ip_address, publisher_id);

-- Step 8: Add index for performance
CREATE INDEX IF NOT EXISTS idx_ip_task_tracking_publisher_id ON ip_task_tracking(publisher_id);

-- Step 9: Update comments
COMMENT ON COLUMN ip_task_tracking.publisher_id IS 'Publisher ID - prevents revenue farming across multiple links from same publisher';
COMMENT ON TABLE ip_task_tracking IS 'Tracks IP addresses to prevent duplicate analytics counting within 24 hours PER PUBLISHER (not per link)';

-- Step 10: Verify the cleanup worked
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT (ip_address, publisher_id)) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT (ip_address, publisher_id)) as duplicates_remaining
FROM ip_task_tracking; 