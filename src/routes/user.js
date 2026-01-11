import express from 'express'
import register, { Login, myProfile, verifyUser, enrollCourse, getMyEnrolledCourses, promoteToAdmin, demoteFromAdmin, getAllUsers, createFirstAdmin, updatePassword, deleteAccount, deleteUserByAdmin, updateProfile, resendOtp } from '../Controller/user.js';
import { isAuth, isAdmin } from '../Middleware/isAuth.js';
import { uploadFiles } from '../Middleware/multer.js';



const router = express.Router()
   
  router.post('/user/register', uploadFiles, register)
  router.post('/user/verify', verifyUser)
  router.post('/user/resend-otp', resendOtp)
  router.post('/user/login', Login)
  router.post('/user/create-admin', createFirstAdmin)
  router.post('/user/update-password', isAuth, updatePassword)
  router.put('/user/update-profile', isAuth, uploadFiles, updateProfile)
  router.delete('/user/delete-account', isAuth, deleteAccount)
  router.get("/user/me", isAuth, myProfile)
  router.post("/course/:id/enroll", isAuth, enrollCourse)
  router.get("/mycourse", isAuth, getMyEnrolledCourses)
  router.post("/user/promote", isAuth, isAdmin, promoteToAdmin)
  router.post("/user/demote", isAuth, isAdmin, demoteFromAdmin)
  router.get("/users", isAuth, isAdmin, getAllUsers)
  router.delete("/user/delete-user", isAuth, isAdmin, deleteUserByAdmin)

export default router;