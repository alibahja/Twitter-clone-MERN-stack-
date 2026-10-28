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
const  PORT=process.env.PORT || 5000;

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

//Mutler
const storage=multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname));
    },
});

const upload=multer({storage:storage});


app.use(express.json({limit:"5mb"}));  // to parse req.body
app.use(express.urlencoded({extended:true})); //to parse from data(urlencoded)

app.use(cookieParser());


app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/posts",postRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.listen(PORT,()=>{
    console.log(  `Server is running on port ${PORT}`);
    connectMongoDB();
})