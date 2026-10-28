import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ to: userId }).populate({
            path: "from",
            select: "username profileImg",
        });

        // 1. Mark as read
        await Notification.updateMany({ to: userId }, { read: true });

        // 2. Filter out notifications where the 'from' user no longer exists
        const validNotifications = notifications.filter((n) => n.from !== null);

        res.status(200).json(validNotifications);
    } catch (error) {
        console.log("Error in getNotifications function", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteNotifications= async (req,res)=>{
    try {
        const userId=req.user._id;

        await Notification.deleteMany({to:userId});

        res.status(200).json({message:"Notifications deleted successfully"});
    } catch (error) {
        console.log("Error in deleteNotifications function", error.message);
		res.status(500).json({ error: "Internal Server Error" });
    }
};