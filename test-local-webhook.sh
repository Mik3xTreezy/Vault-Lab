#!/bin/bash

# Extract the token from your Zeydoo webhook URL
TOKEN="OWM1YTYxYWUtOWEzYy00MzZjLTk1YTYtMzc0ZTYyZjhmNGI5LXVzZXJfMnllUmJHRTBESG1tUEV2YWlYanFlc2YzeVAw"

# Test webhook locally
echo "Testing webhook on localhost:3002..."
echo ""

# Make the webhook call
curl -v "http://localhost:3002/api/tasks/webhooks/${TOKEN}?sub1=test_conversion_123&payout=4.50&geo=US&var=test_source"

echo ""
echo "Check your dev server terminal for logs!" 