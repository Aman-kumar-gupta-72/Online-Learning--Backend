import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🌥️ Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅" : "❌",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅" : "❌",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅" : "❌",
});

// Configure Cloudinary Storage for Images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "e-learning/courses",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

// Configure Cloudinary Storage for Videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "e-learning/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
  },
});

// Upload middleware for images (course thumbnails)
export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5000000 }, // 5MB
}).single("file");

// Upload middleware for videos (lectures)
export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500000000 }, // 500MB
}).single("file");

// Fallback for any file type
export const uploadFiles = multer({
  storage: imageStorage,
  limits: { fileSize: 5000000 },
}).single("file");