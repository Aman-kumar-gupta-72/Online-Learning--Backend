import jwt from "jsonwebtoken";
import { User } from "../Model/user.js";

export const isAuth = async( req , res , next)=>{
    try {
        const token = req.headers.token;
        if(!token)
            return res.status(500).json({
            message:"Plese login"
        })

        const decodedData = jwt.verify(token , process.env.JWT_SEC)

        req.user = await User.findById(decodedData._id)
        next()
    } catch (error) {
        res.status(500).json({
            message:" Login first"
        })
        
    }
}

export const isAdmin= (req , res , next)=>{
    try {
        if(req.user.role !== "admin")
        return res.status(403).json({
    message:"you are not admin"
        })
        next()
    } catch (error) {
        res.status(500).json({
            message:error.message
        })
    }
}