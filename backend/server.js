import express from "express";
import authRoutes from "./routes/auth.route.js"
import dotenv from "dotenv"
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js"
import postRoutes from "./routes/post.route.js"
import multer from "multer";
import path from "path";
import {fileURLToPath} from "url"
import notificationRoutes from "./routes/notification.route.js"

dotenv.config();

const app=express();
const PORT=process.env.PORT || 5000;

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

//Multer
const storage=multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname));
    },
});

const upload=multer({storage:storage});

app.use(express.json({limit:"5mb"})); 
app.use(express.urlencoded({extended:true})); 
app.use(cookieParser());

// API Routes
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/posts",postRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ADD DEPLOYMENT CODE HERE ---
if (process.env.NODE_ENV === "production") {
	// Note: We go up one level from "backend" to find the "frontend" folder
	app.use(express.static(path.join(__dirname, "../frontend/dist")));

	app.get("/{*splat}", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
});
}


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
})