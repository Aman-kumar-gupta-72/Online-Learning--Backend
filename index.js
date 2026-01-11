import express from "express"
import dotenv from 'dotenv'
import { ConectDb } from "./src/config/db.config.js"
import userRoutes from "./src/routes/user.js"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import coursesRoutes from "./src/routes/course.js"
import adminRoutes from "./src/routes/admin.js"
import paymentRoutes from "./src/routes/payment.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()
ConectDb()

const app = express()
app.use(express.json())

app.use(cors({
  origin: ["https://online-learning-9yim.vercel.app/", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

const Port = process.env.PORT || 2002

app.use("/api/user",userRoutes)

app.use("/api/course",coursesRoutes)
app.use("/api/admin",adminRoutes)
app.use("/api/payment", paymentRoutes)

app.get('/',(req,res)=>{
    res.send("server is running on")
 })
 app.listen(Port,()=>{
    console.log(`Server is running on http://localhost:${Port}`);
 })
