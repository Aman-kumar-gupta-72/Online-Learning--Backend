import TryCatch from "../Middleware/TryCatch.js";
import { Courses } from "../Model/Course.js";
import { Lecture } from "../Model/lecture.js";
import { User } from "../Model/user.js";


export const getAllCourse = TryCatch(async(req , res) => {

    const courses = await Courses.find()
    
    // Ensure image URLs are absolute for production
    const processedCourses = courses.map(course => ({
      ...course.toObject(),
      image: course.image && !course.image.startsWith('http') 
        ? `${process.env.SERVER_URL || 'http://localhost:2000'}/uploads/${course.image}`
        : course.image
    }));
     
    res.json({
        courses: processedCourses
    })
})

export const getSingleCourse= TryCatch(async ( req , res)=>{
    const course = await Courses.findById(req.params.id)
    
    if(!course) {
      return res.status(404).json({
        message: "Course not found"
      })
    }
    
    const processedCourse = {
      ...course.toObject(),
      image: course.image && !course.image.startsWith('http') 
        ? `${process.env.SERVER_URL || 'http://localhost:2000'}/uploads/${course.image}`
        : course.image
    };

    res.json({
        course: processedCourse
    })
})


export const  fetchLecture = TryCatch(async ( req , res ) =>{
    const lecture = await Lecture.find({course : req.params.id})

    const  user = await User.findById(req.user._id)
     
    if(user.role == "admin"){
        return res.json({
            lecture
        })
    }

    if(!user.subscription.includes(req.params.id)){
        return res.status(400).json({
            message: "you are not subscribir this course"
        })
    }
    res.json({
        lecture
    })
})

export const fetchLectures = TryCatch(async ( req , res)=>{
    const lectures = await Lecture.find({course : req.params.id})
 
    const user  = await User.findById(req.user._id)
    const courseId = req.params.id;
    
    console.log("🎥 FETCH LECTURES REQUEST:", {
      courseId,
      userRole: user.role,
      isAdmin: user.role === "admin",
    });
      
    // Admin can view all lectures without restriction
    if(user.role === "admin"){
        console.log("✅ ADMIN ACCESS - RETURNING ALL LECTURES");
        return res.json({
            lectures
        })
    }

    // Check if user is enrolled (free or paid)
    const isFreeEnrolled = user.subscription?.includes(courseId);
    const isPaidEnrolled = user.enrolledCourses?.some(e => e.courseId?.toString() === courseId);
    
    if (!isFreeEnrolled && !isPaidEnrolled){
        console.log("❌ NOT ENROLLED - BLOCKING ACCESS");
        return res.status(401).json({
            message:"You are not enrolled in this course"
        })
    }
    
    console.log("✅ ENROLLED - RETURNING LECTURES");
    res.json({
        lectures
    })
})