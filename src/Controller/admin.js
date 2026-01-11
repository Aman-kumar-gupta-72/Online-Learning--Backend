import TryCatch from "../Middleware/TryCatch.js";
import { Courses } from "../Model/Course.js";
import { Lecture } from "../Model/lecture.js";
import mongoose from "mongoose";
import fs from "fs"
import { promisify } from "util";
import { User } from "../Model/user.js";
import ffmpeg from "fluent-ffmpeg";

const unlink = promisify(fs.unlink);


export const createCourse = TryCatch(async (req, res) => {
  // Clean up array fields
  ["title", "category", "description", "price", "createdBy", "instructorName"].forEach((field) => {
    if (Array.isArray(req.body[field])) {
      req.body[field] = req.body[field][0];
    }
  });

  const { title, category, description, price, createdBy, instructorName } = req.body;
  const image = req.file;

  // Store the full Cloudinary URL
  const imageUrl = image ? image.path : null;

  console.log("📤 File upload details:", {
    originalName: image?.originalname,
    cloudinaryPath: image?.path,
    cloudinarySecureUrl: image?.secure_url,
  });

  const course = await Courses.create({
    title,
    description,
    category,
    createdBy,
    instructorName,
    price,
    image: imageUrl, // Store Cloudinary URL
  });

  console.log("✅ COURSE CREATED:", {
    courseId: course._id,
    title: course.title,
    imageUrl: imageUrl,
  });

  res.status(201).json({
    message: "Course created successfully",
    course,
  });
});




export const addLecture = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id.trim())

  if (!course)
    return res.status(404).json({
      message: "no course with this id"
    })

  const { title, description } = req.body;
  const file = req.file;

  // Extract video duration
  let duration = 0;
  if (file?.path) {
    try {
      duration = await new Promise((resolve, reject) => {
        ffmpeg(file.path).ffprobe((err, metadata) => {
          if (err) {
            console.log("Duration detection error:", err);
            resolve(0); // Default to 0 if error
          } else {
            const seconds = Math.round(metadata.format.duration);
            const minutes = Math.round(seconds / 60);
            resolve(minutes);
          }
        });
      });
    } catch (err) {
      console.log("Error extracting duration:", err);
      duration = 0;
    }
  }

  const lecture = await Lecture.create({
    title,
    description,
    video: file?.path,
    duration, // Now includes auto-detected duration
    course: course._id,
    createdBy: req.user._id
  })

  res.status(201).json({
    message: "lecture added",
    lecture
  })
})

export const deletLecture = TryCatch(async(req , res)=>{
  const lecture= await Lecture.findById(req.params.id)

  if(!lecture){
    return res.status(404).json({
      message: "Lecture not found"
    })
  }

  if(lecture.video){
    try {
      await unlink(lecture.video)
      console.log("video deleted");
    } catch (err) {
      console.log("Error deleting video:", err);
    }
  }

  await lecture.deleteOne()

  res.json({
    message :"Lecture deleted successfully"
  })
})

export const deleteCourse = TryCatch(async(req , res)=>{
  const course = await Courses.findById(req.params.id)

  if(!course){
    return res.status(404).json({
      message: "Course not found"
    })
  }

  // Delete course image
  if(course.image){
    try {
      const imagePath = course.image.split('/uploads/')[1]
      if(imagePath) await unlink(`uploads/${imagePath}`)
      console.log("image deleted");
    } catch (err) {
      console.log("Error deleting image:", err);
    }
  }

  // Delete all lectures associated with course
  const lectures = await Lecture.find({course: course._id})
  for(let lecture of lectures){
    if(lecture.video){
      try {
        await unlink(lecture.video)
        console.log("lecture video deleted");
      } catch (err) {
        console.log("Error deleting lecture video:", err);
      }
    }
  }

  await Lecture.deleteMany({course: course._id})

  // Remove course from user subscriptions
  await User.updateMany({},{$pull:{subscription:course._id}})

  await course.deleteOne()

  res.json({
    message: "Course deleted successfully"
  })
})
