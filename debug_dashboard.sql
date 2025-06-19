-- Debug Dashboard Data Issue
-- Run this to see what data is being returned for specific users

-- 1. Check if there are any lockers for your test user
SELECT 'User Lockers:' as debug_section;
SELECT id, user_id, title, created_at 
FROM lockers 
WHERE user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
ORDER BY created_at DESC;

-- 2. Check analytics data for those lockers
SELECT 'Analytics for User Lockers:' as debug_section;
SELECT la.*, l.user_id as locker_owner
FROM locker_analytics la
JOIN lockers l ON la.locker_id = l.id
WHERE l.user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
ORDER BY la.timestamp DESC
LIMIT 10;

-- 3. Check if there's any analytics data without proper locker filtering
SELECT 'All Recent Analytics (should be filtered by user):' as debug_section;
SELECT locker_id, event_type, user_id, timestamp, ip
FROM locker_analytics 
ORDER BY timestamp DESC 
LIMIT 10;

-- 4. Check revenue events for user's lockers
SELECT 'Revenue Events for User Lockers:' as debug_section;
SELECT re.*, l.user_id as locker_owner
FROM revenue_events re
JOIN lockers l ON re.locker_id = l.id
WHERE l.user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
ORDER BY re.timestamp DESC;

-- 5. Check if there are orphaned analytics (analytics without matching lockers)
SELECT 'Orphaned Analytics (no matching locker):' as debug_section;
SELECT la.locker_id, la.event_type, la.timestamp
FROM locker_analytics la
LEFT JOIN lockers l ON la.locker_id = l.id
WHERE l.id IS NULL
LIMIT 5;

-- 6. Get user count and recent users
SELECT 'Recent Users:' as debug_section;
SELECT id, email, joined, status
FROM users 
ORDER BY joined DESC 
LIMIT 5;

-- 7. Check total analytics count
SELECT 'Total Analytics Count:' as debug_section;
SELECT 
  COUNT(*) as total_events,
  COUNT(DISTINCT locker_id) as unique_lockers,
  COUNT(DISTINCT user_id) as unique_users
FROM locker_analytics; 