import { Router } from "express";
import { getUserProfile, login, logout, register, updateProfile } from "../controllers/user.controller.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../utills/multer.js";

const userRouter = Router();

userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/profile").get(isAuthenticated, getUserProfile);
userRouter.route("/logout").get(logout);
userRouter.route("/profile/update").put(isAuthenticated, upload.single("profilePhoto"), updateProfile);

export default userRouter;