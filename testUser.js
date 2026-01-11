// Test user creation script - Run once to create test user
// Usage: node testUser.js (from Server directory)

import mongoose from "mongoose";
import { User } from "./src/Model/user.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const testUser = {
  name: "Test Student",
  email: "test@example.com",
  password: "test123456", // Simple password for testing
  role: "student",
  subscription: [],
  enrolledCourses: []
};

async function createTestUser() {
  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Check if user exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log("⚠️  User already exists:", testUser.email);
      console.log("   Delete it first if you want to recreate:");
      console.log(`   db.users.deleteOne({ email: "${testUser.email}" })`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    // Create user
    const newUser = await User.create({
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      role: testUser.role,
      subscription: testUser.subscription,
      enrolledCourses: testUser.enrolledCourses
    });

    console.log("✅ Test user created successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("   Email:", testUser.email);
    console.log("   Password:", testUser.password);
    console.log("\n💾 Saved to MongoDB:", newUser._id);
    console.log("\n🧪 You can now test login with these credentials.");

  } catch (error) {
    console.error("❌ Error creating test user:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestUser();
