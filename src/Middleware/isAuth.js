import jwt from "jsonwebtoken";
import { User } from "../Model/user.js";

export const isAuth = async (req, res, next) => {
  try {
    // Check for token in custom header OR Authorization header
    let token;
    
    if (req.headers.token) {
      // Custom token header (client-side format)
      token = req.headers.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      // Standard Authorization header format
      token = req.headers.authorization.split(" ")[1];
    } else {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SEC);

    req.user = await User.findById(decodedData._id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not admin",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
