// System Check Script - Verify all components are working
// Usage: node systemCheck.js (from Server directory)

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

console.log("\n🔍 E-Learning Platform - System Health Check\n");
console.log("=" .repeat(50));

// Check 1: Environment Variables
console.log("\n✓ Environment Variables:");
const requiredEnvVars = [
  "MONGO_URL",
  "JWT_SEC",
  "Activation_Secret",
  "GMAIL",
  "PASSWORD",
  "STRIPE_SECRET_KEY"
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const display = varName === "MONGO_URL" || varName === "PASSWORD" 
      ? `${value.substring(0, 20)}...` 
      : value.substring(0, 15) + (value.length > 15 ? "..." : "");
    console.log(`  ✅ ${varName}: ${display}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

// Check 2: Bcrypt Hashing
console.log("\n✓ Bcrypt Testing:");
try {
  const testPassword = "testPassword123";
  const hash = await bcrypt.hash(testPassword, 10);
  const match = await bcrypt.compare(testPassword, hash);
  
  if (match) {
    console.log("  ✅ Bcrypt: Hashing & comparison working");
  } else {
    console.log("  ❌ Bcrypt: Comparison failed");
  }
} catch (error) {
  console.log(`  ❌ Bcrypt Error: ${error.message}`);
}

// Check 3: JWT Signing
console.log("\n✓ JWT Testing:");
try {
  const testToken = jwt.sign({ test: "data" }, process.env.JWT_SEC);
  const decoded = jwt.verify(testToken, process.env.JWT_SEC);
  console.log("  ✅ JWT: Signing & verification working");
} catch (error) {
  console.log(`  ❌ JWT Error: ${error.message}`);
}

// Check 4: MongoDB Connection
console.log("\n✓ MongoDB Connection:");
try {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("  ✅ MongoDB: Connected successfully");
  
  // Check 5: User Collection
  const userCount = await mongoose.connection.collection("users").countDocuments();
  console.log(`  ℹ️  Users in database: ${userCount}`);
  
  // List first 5 users (emails only)
  const users = await mongoose.connection
    .collection("users")
    .find({}, { projection: { email: 1 } })
    .limit(5)
    .toArray();
  
  if (users.length > 0) {
    console.log("  📧 Sample users:");
    users.forEach(u => console.log(`     - ${u.email}`));
  } else {
    console.log("  ⚠️  No users found in database");
  }
  
  await mongoose.disconnect();
} catch (error) {
  console.log(`  ❌ MongoDB Error: ${error.message}`);
  console.log("     Check your MONGO_URL in .env");
}

console.log("\n" + "=".repeat(50));
console.log("✅ System check complete!\n");

process.exit(0);
