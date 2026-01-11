import express from "express"
import { isAdmin, isAuth } from "../Middleware/isAuth.js";
import { addLecture, createCourse, deletLecture, deleteCourse } from "../Controller/admin.js";
import { uploadImage, uploadVideo } from "../Middleware/multer.js";


const router = express.Router()
  
router.post("/course/me", isAuth, isAdmin, uploadImage, createCourse)
router.post("/course/:id", isAuth, isAdmin, uploadVideo, addLecture);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse)
router.delete("/lecture/:id", isAuth, isAdmin, deletLecture)
export default router;