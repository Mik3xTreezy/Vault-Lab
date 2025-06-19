-- Clear IP Tracking Records for Testing
-- Run this in your Supabase SQL editor to reset IP tracking data

-- Option 1: Clear ALL IP tracking records (complete reset)
DELETE FROM ip_task_tracking;

-- Option 2: Clear only records older than 1 hour (if you want to keep very recent ones)
-- DELETE FROM ip_task_tracking WHERE first_completion_at < NOW() - INTERVAL '1 hour';

-- Option 3: Clear records for a specific IP (replace with your IP)
-- DELETE FROM ip_task_tracking WHERE ip_address = 'YOUR_IP_HERE';

-- Option 4: Clear records for a specific publisher (replace with publisher ID)
-- DELETE FROM ip_task_tracking WHERE publisher_id = 'YOUR_PUBLISHER_ID_HERE';

-- Verify the cleanup
SELECT COUNT(*) as remaining_records FROM ip_task_tracking;

-- Optional: Also clear analytics data if you want a complete reset
-- DELETE FROM locker_analytics;
-- DELETE FROM revenue_events; 