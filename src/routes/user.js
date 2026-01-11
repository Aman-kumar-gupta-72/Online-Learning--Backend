import express from "express";
import register, {
  Login,
  myProfile,
  verifyUser,
  enrollCourse,
  getMyEnrolledCourses,
  promoteToAdmin,
  demoteFromAdmin,
  getAllUsers,
  createFirstAdmin,
  updatePassword,
  deleteAccount,
  deleteUserByAdmin,
  updateProfile,
  resendOtp
} from "../Controller/user.js";

import { isAuth, isAdmin } from "../Middleware/isAuth.js";
import { uploadFiles } from "../Middleware/multer.js";

const router = express.Router();

// AUTH
router.post("/register", uploadFiles, register);
router.post("/verify", verifyUser);
router.post("/resend-otp", resendOtp);
router.post("/login", Login);

// USER
router.get("/me", isAuth, myProfile);
router.put("/update-profile", isAuth, uploadFiles, updateProfile);
router.post("/update-password", isAuth, updatePassword);
router.delete("/delete-account", isAuth, deleteAccount);

// COURSE
router.post("/course/:id/enroll", isAuth, enrollCourse);
router.get("/mycourse", isAuth, getMyEnrolledCourses);

// ADMIN
router.post("/create-admin", createFirstAdmin);
router.post("/promote", isAuth, isAdmin, promoteToAdmin);
router.post("/demote", isAuth, isAdmin, demoteFromAdmin);
router.get("/users", isAuth, isAdmin, getAllUsers);
router.delete("/delete-user", isAuth, isAdmin, deleteUserByAdmin);

export default router;
