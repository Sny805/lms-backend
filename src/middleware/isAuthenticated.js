import jwt from "jsonwebtoken"
import { asyncHandler } from "../utills/asyncHandler.js"
import { ApiError } from "../utills/ApiError.js";


export const isAuthenticated = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw new ApiError(401, "Unauthorized request - No token provided");
    }
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if (!decode) {
        throw new ApiError(401, "Invalid Token")
    }

    req.id = decode?._id;
    next();
})