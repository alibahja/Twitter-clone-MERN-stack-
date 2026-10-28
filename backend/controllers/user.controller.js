import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import Notification from "../models/notification.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getUserProfile=async (req,res)=>{
    const {username}=req.params;

    try {
        const user=await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({error:"User not found"});
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile: ",error.message);
        res.status(500).json({error:error.message});
        
    }
};

export const followUnfollowUser=async (req,res)=>{
    try {
        const {id}=req.params;
        const userToModify=await User.findById(id);
        const currentUser=await User.findById(req.user._id);
        if(id=== req.user._id.toString()){
            return res.status(400).json({error:"You can't follow/unfollow yourself"});
        }
        if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

        const isFollowing=currentUser.following.includes(id);

        if(isFollowing){
            await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}});
            res.status(200).json({message:"User unfollowed successfully"});
        }
        else{
           await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}});
           await User.findByIdAndUpdate(req.user._id,{$push:{following:id}});
           const newNotification= new Notification({
             type: "follow",
             from: req.user._id,
             to: userToModify._id,
           });
           await newNotification.save();
           res.status(200).json({message:"User followed successfully"});
        }
    } catch (error) {
        console.log("Error in followUnfollowUser: ",error.message);
        res.status(500).json({error:error.message});
    }
}


export const getSuggestedUsers=async (req,res)=>{
    try {
        const userId=req.user._id;
        const usersFollowedByMe=await User.findById(userId).select("following");

        const users=await User.aggregate([
            {
                $match:{
                    _id:{$ne:userId}
                }
            },
            {$sample:{size:10}}
        ]);

        const filteredUsers=users.filter(user=>!usersFollowedByMe.following.includes(user._id))
        const suggestedUsers= filteredUsers.slice(0,4)

        suggestedUsers.forEach((user) =>(user.password=null));
        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers: ",error.message);
        res.status(500).json({error:error.message});
    }
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both the current password and the new Password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		// --- PROFILE IMAGE LOGIC ---
		if (profileImg) {
			// 1. Delete old profile image from local storage
			if (user.profileImg) {
				const oldFileName = user.profileImg.split("/").pop();
				const oldFilePath = path.join(__dirname, "../uploads", oldFileName);
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			}

			// 2. Save new profile image to local storage
			if (profileImg.startsWith("data:image")) {
				const base64Data = profileImg.split(",")[1];
				const extension = profileImg.split(";")[0].split("/")[1];
				const fileName = `profile_${Date.now()}.${extension}`;
				const filePath = path.join(__dirname, "../uploads", fileName);

				fs.writeFileSync(filePath, base64Data, 'base64');
				profileImg = `/uploads/${fileName}`;
			}
		}

		// --- COVER IMAGE LOGIC ---
		if (coverImg) {
			// 1. Delete old cover image from local storage
			if (user.coverImg) {
				const oldFileName = user.coverImg.split("/").pop();
				const oldFilePath = path.join(__dirname, "../uploads", oldFileName);
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			}

			// 2. Save new cover image to local storage
			if (coverImg.startsWith("data:image")) {
				const base64Data = coverImg.split(",")[1];
				const extension = coverImg.split(";")[0].split("/")[1];
				const fileName = `cover_${Date.now()}.${extension}`;
				const filePath = path.join(__dirname, "../uploads", fileName);

				fs.writeFileSync(filePath, base64Data, 'base64');
				coverImg = `/uploads/${fileName}`;
			}
		}

		// Update the user fields
		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = undefined;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};