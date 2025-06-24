# Admin User Impersonation System

## Overview

The Admin User Impersonation system allows authorized administrators to securely log in as any user for support and debugging purposes. This feature is essential for providing customer support and diagnosing user-specific issues.

## Features

### 🔐 Security Features
- **Admin-only access**: Only emails in the `ADMIN_EMAILS` list can use impersonation
- **Secure tokens**: Each session uses a unique, time-limited token
- **24-hour expiry**: Sessions automatically expire after 24 hours
- **Full audit trail**: All impersonation activities are logged
- **Easy termination**: Sessions can be ended at any time

### 🎯 User Interface
- **One-click impersonation**: Start impersonating with a single button click
- **Status banner**: Always visible banner when impersonating someone
- **User details**: Clear display of who you're impersonating
- **Quick exit**: Easy "End Session" button to return to admin view

## Setup Instructions

### 1. Run Database Migration

Execute the migration to create necessary tables:

```sql
-- Run this in your Supabase SQL editor
\i admin_impersonation_migration.sql
```

### 2. Configure Admin Emails

Edit `app/api/admin/impersonate/route.ts` to add your admin email:

```typescript
// Admin emails allowed to impersonate users
const ADMIN_EMAILS = [
  'ananthu9539@gmail.com',
  'your-admin-email@example.com'  // Add your email here
]
```

### 3. Environment Variables

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## How to Use

### Starting Impersonation

1. **Access Admin Panel**: Go to `/admin` (requires admin authentication)
2. **Navigate to Users Tab**: Click on "Users" in the admin navigation
3. **Find Target User**: Search for or locate the user you want to impersonate
4. **Click Impersonate Button**: Click the green eye (👁️) icon in the user's row
5. **Review User Details**: Confirm you're impersonating the correct user
6. **Start Session**: Click "Login as User" to begin impersonation

### During Impersonation

- **Status Banner**: An orange banner at the top shows you're impersonating someone
- **User Experience**: You'll see the application exactly as the user sees it
- **Full Functionality**: All features work as if you were the actual user
- **Session Timer**: The banner shows when the session expires

### Ending Impersonation

1. **Click "End Session"**: Use the button in the orange status banner
2. **Automatic Redirect**: You'll be redirected back to the admin panel
3. **Session Cleanup**: The impersonation session is properly terminated

## API Endpoints

### Start Impersonation

```http
POST /api/admin/impersonate
Content-Type: application/json

{
  "targetUserId": "clerk_user_id_here"
}
```

**Response:**
```json
{
  "impersonationToken": "imp_1234567890_abcdef123",
  "targetUser": {
    "id": "user_id",
    "email": "user@example.com", 
    "name": "User Name"
  },
  "expiresAt": "2024-06-25T10:00:00.000Z"
}
```

### End Impersonation

```http
DELETE /api/admin/impersonate
Content-Type: application/json

{
  "impersonationToken": "imp_1234567890_abcdef123"
}
```

## Database Schema

### admin_impersonation_sessions

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `admin_user_id` | VARCHAR(255) | Clerk ID of the admin |
| `target_user_id` | VARCHAR(255) | Clerk ID of the target user |
| `impersonation_token` | VARCHAR(255) | Unique session token |
| `started_at` | TIMESTAMP | When session started |
| `ended_at` | TIMESTAMP | When session ended (nullable) |
| `expires_at` | TIMESTAMP | When session expires |
| `status` | VARCHAR(50) | 'active', 'ended', or 'expired' |

### admin_logs

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `admin_user_id` | VARCHAR(255) | Clerk ID of the admin |
| `action` | VARCHAR(255) | Action performed |
| `target_user_id` | VARCHAR(255) | Affected user (optional) |
| `details` | JSONB | Additional action details |
| `timestamp` | TIMESTAMP | When action occurred |

## Security Considerations

### Access Control
- Only emails in `ADMIN_EMAILS` can impersonate users
- All impersonation attempts are logged
- Sessions have a maximum 24-hour duration

### Audit Trail
- Every impersonation start/end is logged in `admin_logs`
- Logs include admin ID, target user, and timestamps
- Failed attempts are also logged

### Session Management
- Each session has a unique token
- Tokens are stored securely in localStorage
- Sessions auto-expire after 24 hours
- Manual session termination is always available

## Troubleshooting

### Common Issues

#### 1. "Access denied - Admin only"
**Cause**: Your email is not in the `ADMIN_EMAILS` list
**Solution**: Add your email to the array in `app/api/admin/impersonate/route.ts`

#### 2. "Target user not found"
**Cause**: The user doesn't exist in your database
**Solution**: Ensure the user has logged in at least once to create their database record

#### 3. Session not ending properly
**Cause**: Network issues or browser storage problems
**Solution**: Clear localStorage and refresh the page, then try again

#### 4. Banner not showing
**Cause**: Component not imported or localStorage issues
**Solution**: Check browser console for errors and verify localStorage has the session

### Debugging

1. **Check Browser Console**: Look for `[CSV UPLOAD]` or impersonation-related logs
2. **Verify Database**: Check `admin_impersonation_sessions` table for active sessions
3. **Review Logs**: Check `admin_logs` table for impersonation activities
4. **Test API**: Use browser dev tools to test the `/api/admin/impersonate` endpoints

## Best Practices

### For Admins
1. **Always log out**: End impersonation sessions when done
2. **Document actions**: Keep notes on what you did while impersonating
3. **Respect privacy**: Only impersonate when necessary for support
4. **Verify user consent**: When possible, get user permission before impersonating

### For Developers
1. **Regular cleanup**: Periodically clean up expired sessions
2. **Monitor logs**: Review impersonation logs for unusual activity
3. **Update admin list**: Keep `ADMIN_EMAILS` current
4. **Test thoroughly**: Verify impersonation works across all features

## Maintenance

### Cleanup Expired Sessions

Run this SQL query periodically:

```sql
-- Clean up expired sessions
SELECT expire_old_impersonation_sessions();

-- Optional: Delete old ended sessions (older than 30 days)
DELETE FROM admin_impersonation_sessions 
WHERE status IN ('ended', 'expired') 
AND updated_at < NOW() - INTERVAL '30 days';
```

### Monitor Usage

```sql
-- View recent impersonation activity
SELECT 
  al.timestamp,
  al.admin_user_id,
  al.action,
  al.target_user_id,
  al.details->>'target_user_email' as target_email
FROM admin_logs al
WHERE action IN ('user_impersonation_started', 'user_impersonation_ended')
ORDER BY timestamp DESC
LIMIT 50;
```

## Components Reference

### ImpersonationComponent
Main component for starting/managing impersonation sessions.

**Props:**
- `targetUser`: User object with clerk_user_id, email, full_name
- `onImpersonationStart`: Callback when impersonation starts
- `onImpersonationEnd`: Callback when impersonation ends

### ImpersonationStatusBanner
Global banner component that shows during active impersonation.

**Features:**
- Auto-checks localStorage for active sessions
- Shows target user info and expiry time
- Provides quick "End Session" button
- Auto-hides when no active session

## Legal & Compliance

### Data Protection
- Impersonation activities are logged for compliance
- Only authorized administrators can access this feature
- User privacy is maintained through secure session management

### Terms of Use
Ensure your terms of service include clauses about:
- Admin access for support purposes
- Data access during support sessions
- User consent for impersonation when required by law 