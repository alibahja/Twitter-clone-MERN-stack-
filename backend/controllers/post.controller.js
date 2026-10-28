import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import fs from "fs";
import path from "path";
import {fileURLToPath, pathToFileURL} from "url";


const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

//checks if the upload folder exists. If not, create it
const uploadDir=path.join(__dirname,"../uploads");
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

export const createPost=async (req,res)=>{
    try {
        const {text}=req.body;
        let img= req.body.img;
        const userId=req.user._id.toString();

        const user=await User.findById(userId);

		if (!user) return res.status(404).json({ message: "User not found" });

		if (!text && !img) {
			return res.status(400).json({ error: "Post must have text or image" });
		}
        let imageUrl="";
        if(img && img.startsWith("data:image")){
            
            const base64Data=img.split(",")[1];
            const extension= img.split(";")[0].split("/")[1];
            const fileName=`post_${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, "../uploads", fileName);

            fs.writeFileSync(filePath,base64Data,'base64');

            imageUrl=`/uploads/${fileName}`;
        }
        else if(img){
            imageUrl=img;
        }
         const newPost = new Post({
            user: userId,
            text,
            img: imageUrl, // 存本地路径
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
    }
};


export const deletePost=async (req,res)=>{
    try {
        const post=await Post.findById(req.params.id);
        if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}
        //Check if we are the owner of the post;
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error:"You are unauthorized to delete this post"});
        }
        if(post.img){
             const fileName = post.img.split("/").pop(); 
            const filePath = path.join(__dirname, "../uploads", fileName);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost=async (req,res)=>{
    try {
        const {text}=req.body;
        const postId=req.params.id;
        const userId=req.user._id;

        if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}
        const post=await Post.findById(postId);

        if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

        const comment={user: userId,text};
        post.comments.push(comment);
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
};


export const likeUnlikePost=async (req,res)=>{
    try {
        const postId =req.params.id;
        const userId=req.user._id;
        
        const post=await Post.findById(postId);
        if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

        const userLikedPost=post.likes.includes(userId);

        if(userLikedPost){
            //Unlike post
            await Post.updateOne({_id:postId},{$pull: {likes:userId}});
            await User.updateOne({_id:userId},{$pull: {likedPosts:postId}});

            const updatedLikes=post.likes.filter((id)=>id.toString()!==userId.toString());
            res.status(200).json(updatedLikes);
        }
        else{
            //Like the post
            post.likes.push(userId);
            await User.updateOne({_id:userId},{$push:{likedPosts:postId}});
            await post.save();

            const notification=new Notification({
                from:userId,
                to:post.user,
                type:"like",
            });
            await notification.save();

            const updatedLikes=post.likes;
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPosts=async (req,res)=>{
    try {
        const posts=await Post.find()
        .sort({createdAt:-1}) // gives the latest posts 
        .populate({
            path:"user",
            select:"-password",
        })
        .populate({
            path:"comments.user",
            select:"-password",
        });

       if (posts.length === 0) {
			return res.status(200).json([]);
		}
        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
}

export const getLikedPosts=async (req,res)=>{
    const userId=req.params.id;
    try {
        const user=await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const likedPosts=await Post.find({_id:{$in:user.likedPosts}})
        .populate({
            path:"user",
            select:"-password",
        })
        .populate({
            path:"comments.user",
            select:"-password",
        });
        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
}


export const getFollowingPosts=async (req,res)=>{
    try {
        const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

        const following=user.following;

        const feedPosts= await Post.find({user: {$in:following}})
        .sort({createdAt:-1})
        .populate({
            path:"user",
            select:"-password",
        })
        .populate({
            path:"comments.user",
            select:"-password",
        });

        res.status(200).json(feedPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
}


export const getUserPosts=async (req,res)=>{
    try {
        const {username}=req.params;

        const user = await User.findOne({username});
        if (!user) return res.status(404).json({ error: "User not found" });

        const posts=await Post.find({user:user._id})
        .sort({createdAt:-1})
        .populate({
            path:"user",
            select:"-password",
        })
        .populate({
            path:"comments.user",
            select:"-password",
        });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
    }
};