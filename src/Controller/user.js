
import sendMailer from "../Middleware/sendmailer.js";
import TryCatch from "../Middleware/TryCatch.js";
import { User } from "../Model/user.js";
import { Courses } from "../Model/Course.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // ✅ added this

const register = TryCatch(async (req ,res)=>{
    const { email, name, password } = req.body;
    const profilePic = req.file ? req.file.filename : null;

    let user = await User.findOne({ email });
    if (user)
      return res.status(500).json({
        message: "User already exists",
      });

    const hashPassword = await bcrypt.hash(password, 10);

    user = {
      name,
      email,
      password: hashPassword,
      profilePic,
    };

    const otp = Math.floor(Math.random() * 10000);

    const activationToken = jwt.sign(
      { user, otp },
      process.env.Activation_Secret,
      { expiresIn: "5m" }
    );

    const data = { name, otp };

    await sendMailer(email, "E-learning", data);

    res.status(200).json({
      message: "OTP sent to your registered email",
      activationToken,
    });
})


export default register;


export const verifyUser = TryCatch(async (req, res) => {
  const { otp, activationToken } = req.body;

  if (!activationToken || !otp) {
    return res.status(400).json({ message: "activationToken and otp are required" });
  }

  let payload;
  try {
    payload = jwt.verify(activationToken, process.env.Activation_Secret);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired activation token" });
  }

  if (!payload || !payload.otp || !payload.user) {
    return res.status(400).json({ message: "Malformed activation token" });
  }

  if (String(payload.otp) !== String(otp)) {
    return res.status(400).json({ message: "Wrong OTP" });
  }

  const { name, email, password, profilePic } = payload.user;

  if (!email || !name || !password) {
    return res.status(400).json({ message: "Token missing required user info" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "User already registered" });
  }

  let passwordToSave = String(password);

  if (!passwordToSave.startsWith("$2")) {
    const salt = await bcrypt.genSalt(10);
    passwordToSave = await bcrypt.hash(passwordToSave, salt);
  }

  await User.create({
    name,
    email,
    password: passwordToSave,
    profilePic: profilePic || null,
    role: "student",
    subscription: [],
  });

  return res.json({ message: "User registered successfully" });
});

export const resendOtp = TryCatch(async (req, res) => {
  const { activationToken } = req.body;

  if (!activationToken) {
    return res.status(400).json({ message: "Activation token is required" });
  }

  let payload;
  try {
    payload = jwt.verify(activationToken, process.env.Activation_Secret);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired activation token" });
  }

  if (!payload || !payload.user) {
    return res.status(400).json({ message: "Malformed activation token" });
  }

  const { name, email } = payload.user;

  if (!email || !name) {
    return res.status(400).json({ message: "Token missing required user info" });
  }

  const otp = Math.floor(Math.random() * 10000);

  const newActivationToken = jwt.sign(
    { user: payload.user, otp },
    process.env.Activation_Secret,
    { expiresIn: "5m" }
  );

  const data = { name, otp };
  await sendMailer(email, "E-learning - OTP Verification", data);

  res.status(200).json({
    message: "OTP resent to your email",
    activationToken: newActivationToken,
  });
});





export const Login = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const emailTrim = String(email).trim().toLowerCase();
  const plainPassword = String(password);

  
  const user = await User.findOne({ email: emailTrim }).select("+password");
  if (!user) {
  
    return res.status(401).json({ message: "User not found" });
  }

 
  if (!user.password) {
    console.warn("Login: no password stored for user:", user.email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  let storedPassword = String(user.password);

  
  if (!storedPassword.startsWith("$2")) {
   
    if (plainPassword === storedPassword) {
     
      try {
        console.log("Plaintext match found — migrating stored password to bcrypt for", user.email);
        const newHash = await bcrypt.hash(plainPassword, 10);
      
        await User.findByIdAndUpdate(user._id, { password: newHash }, { new: true });
        storedPassword = newHash;
      } catch (err) {
        console.error("Error migrating password for user:", user.email, err);
       
        return res.status(500).json({ message: "Server error" });
      }
    } else {
      
      return res.status(401).json({ message: "invalid craditial" });
    }
  }


  const matchPassword = await bcrypt.compare(plainPassword, storedPassword);
  console.log(`Login attempt for ${user.email} -> bcrypt match:`, matchPassword);

  // If bcrypt comparison fails:
  // - Could be wrong password (common)
  // - Could be previously double-hashed (bcrypt(bcrypt(password))) or some other corruption.
  if (!matchPassword) {
    // Extra hint for dev logs (do not expose to client)
    if (String(user.password).startsWith("$2")) {
      console.warn("Login failed: stored password is bcrypt but bcrypt.compare returned false for user:", user.email);
      // If you suspect double-hash, you'll need to ask user to reset password.
    }
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Verify JWT_SEC is available
  if (!process.env.JWT_SEC) {
    console.error("CRITICAL: JWT_SEC environment variable not set!");
    return res.status(500).json({ message: "Server configuration error" });
  }

  // create token (adjust payload and options as needed)
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SEC, { expiresIn: "7d" });

  // Do NOT send password back to client
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic ? `http://localhost:2000/uploads/${user.profilePic}` : null,
  };

  return res.status(200).json({
    message: `Welcome back ${user.name}`,
    token,
    user: safeUser,
  });
});


export const myProfile = TryCatch(async(req,res) =>{
  const user = await User.findById(req.user._id)
  const userWithProfilePic = {
    ...user.toObject(),
    profilePic: user.profilePic ? `http://localhost:2000/uploads/${user.profilePic}` : null,
  };
  res.json({user: userWithProfilePic})
})

export const enrollCourse = TryCatch(async(req, res) => {
  const userId = req.user._id;
  const courseId = req.params.id;

  // Get user and course details
  const user = await User.findById(userId);
  const course = await Courses.findById(courseId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  console.log("📝 ENROLLMENT REQUEST:", {
    userId,
    userRole: user.role,
    courseId,
    coursePrice: course.price,
    isFreeCourse: course.price === 0 || course.price === "0" || !course.price,
  });

  // ✅ ADMIN HAS FREE ACCESS TO ALL COURSES
  if (user.role === "admin") {
    console.log("👨‍💼 ADMIN - GRANTING FREE ACCESS");
    return res.status(200).json({ 
      message: "Admin has access to all courses",
      enrolled: true,
      isAdmin: true
    });
  }

  // Check if already enrolled in subscription (free courses)
  if (user.subscription.includes(courseId)) {
    return res.status(400).json({ message: "Already enrolled in this course" });
  }

  // Check if already enrolled in enrolledCourses (paid courses)
  if (user.enrolledCourses?.some(e => e.courseId.toString() === courseId.toString())) {
    return res.status(400).json({ message: "Already enrolled in this course" });
  }

  // For free courses, add to subscription array
  if (course.price === 0 || course.price === "0" || !course.price) {
    console.log("🎁 FREE COURSE ENROLLMENT");
    user.subscription.push(courseId);
    await user.save();
    return res.status(200).json({ message: "Successfully enrolled in free course" });
  }

  // For paid courses, should use payment endpoint instead
  return res.status(400).json({ message: "Use payment endpoint for paid courses" });
});

export const getMyEnrolledCourses = TryCatch(async(req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

 

  // Collect unique course IDs from both arrays
  const courseIds = new Set();
  
  // Add from subscription array
  if (user.subscription && Array.isArray(user.subscription)) {
    user.subscription.forEach(id => courseIds.add(id.toString()));
  }
  
  // Add from enrolledCourses array (get just the courseId)
  if (user.enrolledCourses && Array.isArray(user.enrolledCourses)) {
    user.enrolledCourses.forEach(enrollment => {
      if (enrollment.courseId) {
        courseIds.add(enrollment.courseId.toString());
      }
    });
  }

 

  if (courseIds.size === 0) {
    console.log("✅ GET MY COURSES - NO ENROLLMENTS:", { userId: user._id });
    return res.status(200).json({ courses: [] });
  }

  // Fetch only the enrolled courses
  const courses = await Courses.find({ _id: { $in: Array.from(courseIds) } });



  res.status(200).json({ courses });
});

export const promoteToAdmin = TryCatch(async(req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(400).json({ message: "User is already an admin" });
  }

  user.role = "admin";
  await user.save();

  res.status(200).json({ 
    message: `${user.name} has been promoted to admin!`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const demoteFromAdmin = TryCatch(async(req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role !== "admin") {
    return res.status(400).json({ message: "User is not an admin" });
  }

  user.role = "student";
  await user.save();

  res.status(200).json({ 
    message: `${user.name} has been demoted from admin!`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const getAllUsers = TryCatch(async(req, res) => {
  const users = await User.find().select("-password");
  
  res.status(200).json({ users });
});

export const createFirstAdmin = TryCatch(async(req, res) => {
  const { name, email, password } = req.body;

  // Check if any admin already exists
  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) {
    return res.status(403).json({ 
      message: "An admin already exists. Use the promote endpoint to make more admins." 
    });
  }

  // Validate inputs
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: "Name, email, and password are required" 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      message: "Password must be at least 6 characters" 
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(400).json({ 
      message: "Email already exists" 
    });
  }

  // Hash password
  const hashPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(Math.random() * 10000);

  // Create activation token with OTP
  const activationToken = jwt.sign(
    { 
      user: { 
        name, 
        email: email.toLowerCase().trim(), 
        password: hashPassword,
        role: "admin",
        profilePic: null,
        subscription: []
      }, 
      otp 
    },
    process.env.Activation_Secret,
    { expiresIn: "5m" }
  );

  // Send OTP email
  const mailData = { name, otp };
  await sendMailer(email, "E-learning Admin Account Verification", mailData);

  res.status(200).json({ 
    message: "OTP sent to your email. Please verify to complete admin account creation.",
    activationToken
  });
});

export const updatePassword = TryCatch(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Validate inputs
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required"
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters"
    });
  }

  // Get user with password field
  const user = await User.findById(userId).select("+password");
  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  // Verify current password
  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      message: "Current password is incorrect"
    });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  user.password = hashedNewPassword;
  await user.save();

  res.status(200).json({
    message: "Password updated successfully"
  });
});

export const updateProfile = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const { name, email } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  // Validate inputs
  if (!name && !email && !profilePic) {
    return res.status(400).json({
      message: "Please provide at least one field to update"
    });
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use"
      });
    }
    user.email = email;
  }

  // Update name if provided
  if (name) {
    user.name = name;
  }

  // Update profile picture if provided
  if (profilePic) {
    user.profilePic = profilePic;
  }

  await user.save();

  // Return updated user data
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic ? `http://localhost:2000/uploads/${user.profilePic}` : null,
  };

  res.status(200).json({
    message: "Profile updated successfully",
    user: safeUser,
  });
});

export const deleteAccount = TryCatch(async (req, res) => {
  const userId = req.user._id;

  // Find and delete the user
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.status(200).json({
    message: "Account deleted successfully"
  });
});

export const deleteUserByAdmin = TryCatch(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required"
    });
  }

  // Find and delete the user
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.status(200).json({
    message: `User ${user.name} deleted successfully`
  });
});
