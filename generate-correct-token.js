// Generate the correct webhook token for testing
const taskId = "9c5a61ae-9a3c-436c-95a6-374e62f8f4b9"; // Complete the Survey
const publisherId = "user_2yeRbGE0DHmmPEvaiXjqesf3yP0"; // Your user ID

// Generate token with pipe separator
const data = `${taskId}|${publisherId}|${process.env.WEBHOOK_SECRET || 'default-secret'}`;
const token = Buffer.from(data).toString('base64url');

console.log("=== Correct Webhook URL for Testing ===\n");
console.log("For localhost:3002:");
console.log(`http://localhost:3002/api/tasks/webhooks/${token}?sub1=test_conversion_123&payout=4.50&geo=US`);

console.log("\nFor production (what Zeydoo should use):");
console.log(`https://vaultlab.co/api/tasks/webhooks/${token}?sub1={ymid}&payout={amount}&geo={geo}`);

console.log("\nTest with curl:");
console.log(`curl "http://localhost:3002/api/tasks/webhooks/${token}?sub1=test_conversion_123&payout=4.50&geo=US"`);

console.log("\nToken:", token); 