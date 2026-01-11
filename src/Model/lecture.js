import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    video: {
      type: String, 
      required: true,
    },
    duration: {
      type: Number, 
      default: 0,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses", 
      required: true,
    },
    
   
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

export const Lecture = mongoose.model("Lecture",schema);
