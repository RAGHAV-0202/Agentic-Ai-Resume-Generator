import jwt from "jsonwebtoken";
import User from "../models/User.model.js";  
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js"; 

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new ApiError(401, "No access token present, Unauthorized access");  // ✅ 401 not 403
  }

  try {
    // ✅ jwt.verify is synchronous, but wrap in try-catch for errors
    const decodedToken = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET  // ✅ Match your .env variable name
    );

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token, User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    // ✅ Catch JWT verification errors
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});