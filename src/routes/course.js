import express from "express"
import { fetchLecture,fetchLectures, getAllCourse, getSingleCourse } from "../Controller/course.js";
import { isAuth } from "../Middleware/isAuth.js";

const router = express.Router()

router.get("/course/all", getAllCourse)
router.get("/course/:id", getSingleCourse)
router.get("/lecture/:id", isAuth , fetchLecture)
router.get("/lectures/:id", isAuth , fetchLectures)

export default router;