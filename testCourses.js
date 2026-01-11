import dotenv from 'dotenv';
import { ConectDb } from "./src/config/db.config.js";
import { Courses } from "./src/Model/Course.js";

dotenv.config();
ConectDb();

async function testCourses() {
  try {
    console.log("📚 Fetching all courses...\n");
    const courses = await Courses.find();
    
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Price: ${course.price}`);
      console.log(`   Price Type: ${typeof course.price}`);
      console.log(`   Image: ${course.image}`);
      console.log("");
    });
    
    if (courses.length === 0) {
      console.log("❌ No courses found!");
    } else {
      console.log(`✅ Total courses: ${courses.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testCourses();
