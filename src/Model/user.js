import mongoose from "mongoose";

const registerschema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        uniqe: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "instructor", "admin"],
        default: "student"
    },
    profilePic:
    {
        type: String
    }
    ,
    subscription: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Courses"
        }
    ],
    enrolledCourses: [
        {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Courses"
            },
            enrolledAt: {
                type: Date,
                default: Date.now
            },
            paymentStatus: {
                type: String,
                enum: ["pending", "completed", "failed"],
                default: "pending"
            },
            transactionId: String,
            amount: Number
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }




},{
    timestamps:true
})

export  const User = mongoose.model("user",registerschema)