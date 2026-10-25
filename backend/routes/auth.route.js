import express, { Router } from "express"
import {logout, signup,login, getMe} from "../controllers/auth.controller.js"
const router=Router();

router.get("/me",protectRoute,getMe);
router.post("/signup",signup);

router.post("/login",login);

router.post("/logout",logout);


export default router;