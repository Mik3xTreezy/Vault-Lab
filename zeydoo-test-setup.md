# Zeydoo Webhook Test Setup

## 1. Fix Your Postback URL in Zeydoo

Replace your current postback URL with this properly formatted one:

```
https://vaultlab.co/api/tasks/webhooks/OWM1YTYxYWUtOWEzYy00MzZjLTk1YTYtMzc0ZTYyZjhmNGI5LXVzZXJfMnllUmJHRTBESG1tUEV2YWlYanFlc2YzeVAw?sub1={ymid}&payout={amount}&geo={geo}
```

## 2. For the Test Conversion

**Step 2 - Paste this tracking URL:**
```
https://mcdm6.com/link?z=9479230&var=test&ymid=test&sub1=test_conversion_123
```

## 3. Understanding the Flow

1. **Advertiser URL**: `https://mcdm6.com/link?z=9479230&var={SOURCE_ID}&ymid={CLICK_ID}`
2. **Your site adds sub1**: `...&sub1=unique_tracking_id`
3. **Advertiser postback**: Calls your webhook with `sub1={ymid}` (where {ymid} contains your tracking ID)

## 4. Available Macros from Zeydoo

- `{ymid}` - Your tracking ID (passed as sub1)
- `{amount}` - Payout amount
- `{amount50%}` - Half of payout amount
- `{geo}` - Country code
- `{var}` - Source/campaign variable

## 5. Webhook URL Components

Your webhook token decodes to:
- Task ID: `9c5a61ae-9a3c-436c-95a6-374e62f8f4b9` (Complete the Survey)
- Publisher ID: `user_2yeRbGE0DHmmPEvaiXjqesf3yP0` 