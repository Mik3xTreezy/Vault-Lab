# Webhook Setup Guide

This guide explains how to set up and use webhooks for conversion tracking in your link locker application.

## Overview

Webhooks allow advertisers (like Opera GX offer providers) to notify your system when a conversion happens. This ensures accurate revenue tracking and prevents fraud.

## 1. Database Setup

First, run the following SQL in your Supabase SQL editor to create the necessary tables:

```sql
-- Create conversions table to store webhook postback data
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  publisher_id TEXT NOT NULL,
  sub_id TEXT NOT NULL, -- The unique identifier from the advertiser
  payout DECIMAL(10, 4) DEFAULT 0,
  conversion_ip TEXT,
  status TEXT DEFAULT 'approved', -- approved, rejected, pending
  offer_id TEXT,
  transaction_id TEXT,
  raw_params JSONB, -- Store all parameters sent by advertiser
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate conversions
  UNIQUE(task_id, sub_id)
);

-- Add indexes for performance
CREATE INDEX idx_conversions_task_id ON conversions(task_id);
CREATE INDEX idx_conversions_publisher_id ON conversions(publisher_id);
CREATE INDEX idx_conversions_sub_id ON conversions(sub_id);
CREATE INDEX idx_conversions_created_at ON conversions(created_at);

-- Add source column to revenue_events to track webhook vs regular revenue
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'task_complete';
ALTER TABLE revenue_events ADD COLUMN IF NOT EXISTS conversion_id UUID REFERENCES conversions(id);

-- Add webhook_token column to tasks for easy URL generation
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;

COMMENT ON TABLE conversions IS 'Stores conversion data from advertiser webhooks/postbacks';
COMMENT ON COLUMN conversions.sub_id IS 'Unique identifier from advertiser (click ID, transaction ID, etc)';
COMMENT ON COLUMN conversions.raw_params IS 'All parameters sent by the advertiser in the webhook call';
```

## 2. Environment Setup

Add these variables to your `.env.local` file:

```env
WEBHOOK_SECRET=your_secure_random_string_here
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 3. How It Works

### When a visitor clicks a task:

1. The system generates a unique `sub_id` for each click
2. This `sub_id` is appended to the advertiser's URL as a parameter
3. The advertiser tracks this `sub_id` with the conversion

### When a conversion happens:

1. The advertiser calls your webhook URL with the `sub_id` and other data
2. Your system verifies the conversion and credits the publisher
3. Duplicate conversions are automatically prevented

## 4. Webhook URL Format

Each task has a unique webhook URL in this format:

```
https://your-domain.com/api/tasks/webhooks/{token}
```

The token encodes the task ID and publisher ID for security.

## 5. Required Parameters

Advertisers must send these parameters in their postback:

- `sub1` - The unique identifier sent when the user clicked the task
- `payout` (optional) - The payout amount for this conversion
- `conversion_ip` (optional) - The IP address of the user who converted

Example postback URL from advertiser:
```
https://your-domain.com/api/tasks/webhooks/{token}?sub1={sub1}&payout={payout_amount}&conversion_ip={session_ip}
```

## 6. Testing Webhooks

You can test your webhook endpoint using curl:

```bash
curl "http://localhost:3000/api/tasks/webhooks/YOUR_TOKEN?sub1=test_12345&payout=4.50&conversion_ip=192.168.1.1"
```

## 7. Common Advertiser Postback Macros

Different advertising networks use different macro names. Here are common ones:

- **Sub ID**: `{sub1}`, `{subid}`, `{click_id}`, `{clickid}`
- **Payout**: `{payout}`, `{payout_amount}`, `{revenue}`, `{commission}`
- **IP Address**: `{ip}`, `{session_ip}`, `{user_ip}`, `{conversion_ip}`
- **Status**: `{status}`, `{conversion_status}`
- **Transaction ID**: `{transaction_id}`, `{txid}`, `{trans_id}`

## 8. Security Considerations

1. **Token Security**: Webhook tokens are encoded and should be kept secure
2. **Duplicate Prevention**: The system automatically prevents duplicate conversions
3. **IP Verification**: You can optionally verify conversion IPs match click IPs
4. **HTTPS Only**: Always use HTTPS in production for webhook URLs

## 9. Monitoring Conversions

In the admin panel, you can:
- View webhook URLs for each task
- Copy webhook URLs with one click
- Monitor conversion rates and revenue
- Track which conversions came from webhooks vs regular tracking

## 10. Troubleshooting

### Conversions not tracking:
- Verify the `sub1` parameter is being passed correctly
- Check if the webhook URL is accessible from the internet
- Look for errors in your server logs
- Ensure the conversion table exists in your database

### Duplicate conversions:
- The system automatically prevents duplicates using the `sub_id`
- Check if the advertiser is sending unique `sub_id` values

### Missing revenue:
- Verify the `payout` parameter is being sent
- Check if the task has default CPM rates configured
- Ensure the publisher exists in the users table 