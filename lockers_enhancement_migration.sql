-- Migration to enhance lockers table for multiple task types and tiered ad URLs
-- Run this migration to update the database schema

-- Add new columns to lockers table
ALTER TABLE lockers 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS task_types TEXT[] DEFAULT ARRAY['adult'],
ADD COLUMN IF NOT EXISTS ad_url_mode VARCHAR(20) DEFAULT 'common',
ADD COLUMN IF NOT EXISTS common_ad_url TEXT,
ADD COLUMN IF NOT EXISTS tiered_ad_urls JSONB;

-- Update existing records to use new structure
UPDATE lockers 
SET task_types = ARRAY[COALESCE(task_type, 'adult')]
WHERE task_types IS NULL;

-- Create index for task_types array column for better performance
CREATE INDEX IF NOT EXISTS idx_lockers_task_types ON lockers USING GIN (task_types);

-- Create index for ad_url_mode
CREATE INDEX IF NOT EXISTS idx_lockers_ad_url_mode ON lockers (ad_url_mode);

-- Add comments for documentation
COMMENT ON COLUMN lockers.description IS 'Optional description for the locker';
COMMENT ON COLUMN lockers.task_types IS 'Array of task types that can unlock this locker';
COMMENT ON COLUMN lockers.ad_url_mode IS 'Mode for ad URL configuration: common or tiered';
COMMENT ON COLUMN lockers.common_ad_url IS 'Single ad URL for all tiers (when ad_url_mode = common)';
COMMENT ON COLUMN lockers.tiered_ad_urls IS 'JSON object with tier-specific ad URLs (when ad_url_mode = tiered)';

-- Example of tiered_ad_urls JSON structure:
-- {
--   "tier1": "https://example.com/ad-tier1",
--   "tier2": "https://example.com/ad-tier2", 
--   "tier3": "https://example.com/ad-tier3"
-- } 