import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        title:{
            type: String,
            required:true,
            trim:true,
        },
        category:{
            type: String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required : true,
            trim:true
        },
        image:{
             type:String,
            required : true,
            trim:true
        },
        price:{
             type:String,
            required : true,
            min:0
        },
        instructorName:{
             type:String,
            required: true,
            trim:true
        },
        createdBy:{
             type:String,
            required: true,
            trim:true
        },
        
        
    },
      {
    timestamps: true, // adds createdAt & updatedAt
  }
)
export const Courses = mongoose.model("Courses",schema)

