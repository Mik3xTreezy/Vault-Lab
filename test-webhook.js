// Test webhook with fixed token format
const taskId = "fc448a57-16da-432b-8d09-5e7ee88af550"; // Opera GX task
const publisherId = "user_2yYMGgrz0dBiYQpzl10cTYJmLdI"; // Replace with ID from http://localhost:3001/api/whoami

// Generate token with pipe separator
const data = `${taskId}|${publisherId}|${process.env.WEBHOOK_SECRET || 'default-secret'}`;
const token = Buffer.from(data).toString('base64url');

console.log("Fixed webhook URL:");
console.log(`http://localhost:3001/api/tasks/webhooks/${token}?sub1=test_${Date.now()}&payout=4.50&conversion_ip=192.168.1.1`);

console.log("\nToken contains:");
console.log("- Task ID:", taskId);
console.log("- Publisher ID:", publisherId);
console.log("- Token:", token); 