import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js"
import { ApiResponse } from "../utills/ApiResponse.js"
import { User } from "../models/user.model.js"
import { deleteMediaFromCloudinary, uploadMedia } from "../utills/cloudinary.js";




const generateAccessAndRereshTokens = async (userId) => {
    try {

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


export const register = asyncHandler(async (req, res) => {
    const { fullName, email, role, password } = req.body


    if (!fullName || !email || !role || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User is alrady exists")
    }

    await User.create({
        fullName, email, role, password
    })

    return res.status(201).json(new ApiResponse(201, {}, "User Register Successfully"))
})


export const login = asyncHandler(async (req, res) => {
    const { password, email } = req.body;

    if (!password || !email) {
        throw new ApiError(400, "Email or Password are required")
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRereshTokens(user._id);

    const loggedInuser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // false for local
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    }

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, loggedInuser, `Welcome back ${loggedInuser.fullName}`));
})



export const logout = asyncHandler(async (_, res) => {
    return res.status(200).cookie("accessToken", " ", { maxAge: 0 }).json(new ApiResponse(200, {}, "User logged out successfully"))
})


export const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.id;
    const user = await User.findById(userId).select("-password -refreshToken").populate("enrolledCourses");
    if (!user) {
        throw new ApiError(404, "Profile Not found")
    }
    return res.status(200).json(new ApiResponse(200, user, "Current user fetched successfully"))
})

export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.id;
    const { fullName } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // extract publicId from url  if exists 
    if (user.photoUrl) {
        const publicId = user.photoUrl.split("/").pop().split(".")[0];// extract public id 
        deleteMediaFromCloudinary(publicId)
    }
    // upload new  photo
    const cloudResponse = await uploadMedia(profilePhoto.path);
    const photoUrl = cloudResponse.secure_url;

    const updateData = { fullName, photoUrl };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"))

})



