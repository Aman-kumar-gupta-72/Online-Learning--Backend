#!/usr/bin/env node

/**
 * Quick test to verify payment flow
 * Run: node testPayment.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:2000/api';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'Test@123'
};

async function runTests() {
  try {
    console.log('🧪 PAYMENT FLOW TEST\n');

    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const loginRes = await axios.post(`${API_URL}/user/login`, testUser);
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 20) + '...\n');

    // Step 2: Get all courses
    console.log('2️⃣  Fetching courses...');
    const coursesRes = await axios.get(`${API_URL}/course/all`);
    const courses = coursesRes.data.courses;
    console.log(`✅ Found ${courses.length} courses`);
    
    if (courses.length === 0) {
      console.log('❌ No courses found. Please create a course first.');
      return;
    }

    const testCourse = courses[0];
    console.log(`   Test course: ${testCourse.title} ($${testCourse.price})\n`);

    // Step 3: Create payment intent
    console.log('3️⃣  Creating payment intent...');
    const paymentRes = await axios.post(
      `${API_URL}/payment/create-intent`,
      {
        amount: testCourse.price,
        currency: 'usd',
        courseId: testCourse._id
      },
      {
        headers: { token }
      }
    );
    console.log('✅ Payment intent created');
    console.log(`   Client Secret: ${paymentRes.data.clientSecret.substring(0, 20)}...\n`);

    // Step 4: Check user's courses before payment
    console.log('4️⃣  Checking enrolled courses before payment...');
    const myCoursesRes = await axios.get(`${API_URL}/mycourse`, {
      headers: { token }
    });
    console.log(`✅ User has ${myCoursesRes.data.courses.length} courses\n`);

    // Step 5: Simulate payment confirmation
    console.log('5️⃣  Simulating payment confirmation...');
    console.log('   ⚠️  Note: For real testing, you need actual Stripe payment intent ID');
    console.log('   In production, Stripe would provide the real intent ID\n');

    console.log('🎉 TEST FLOW COMPLETE\n');
    console.log('Next steps:');
    console.log('1. Visit http://localhost:5173/course');
    console.log('2. Click "Enroll Now" on a course');
    console.log('3. Fill payment form with test card: 4242 4242 4242 4242');
    console.log('4. Check /mycourse page for enrolled course\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

runTests();
