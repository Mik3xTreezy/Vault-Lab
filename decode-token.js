// Decode the webhook token from Zeydoo
const token = "OWM1YTYxYWUtOWEzYy00MzZjLTk1YTYtMzc0ZTYyZjhmNGI5LXVzZXJfMnllUmJHRTBESG1tUEV2YWlYanFlc2YzeVAw";

// Decode from base64
const decoded = Buffer.from(token, 'base64').toString();
console.log("Decoded token:", decoded);

// Split by pipe separator
const parts = decoded.split('|');
console.log("\nToken parts:");
console.log("- Task ID:", parts[0]);
console.log("- Publisher ID:", parts[1]);

// Task info
console.log("\nThis webhook is for:");
console.log("- Task: 9c5a61ae-9a3c-436c-95a6-374e62f8f4b9 (Complete the Survey)");
console.log("- Publisher: user_2yeRbGE0DHmmPEvaiXjqesf3yP0"); 