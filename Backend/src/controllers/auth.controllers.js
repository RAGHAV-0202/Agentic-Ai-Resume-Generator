import User from "../models/User.model.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import dotenv from "dotenv"
dotenv.config()

const generateAccessTokenRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(400, "No user found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = await bcrypt.hash(refreshToken, 10);
        user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};


const UserRegister = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, Email, Password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "User with this email already exists");
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } =
        await generateAccessTokenRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(201, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            }, "Registration successful")
        );
});


const UserLogin = asyncHandler(async (req, res) => {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(400, "Invalid credentials");
    }

    const isPassValid = await user.comparePassword(password);
    if (!isPassValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenRefreshToken(user._id);

    const cookieMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: cookieMaxAge,
        path: "/"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            }, "Login successful")
        );
});



const isLoggedIn = asyncHandler(async (req, res) => {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw new ApiError(401, "Authentication token required");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded._id)
            .select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid token");
        }

        req.user = user;

        return res.status(200).json(
            new ApiResponse(200, {
                isAuthenticated: true,
                user
            })
        );
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token expired");
        }
        throw new ApiError(401, "Invalid token");
    }
});


const UserLogout = asyncHandler(async (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});


export {
    UserLogin, UserRegister, UserLogout, isLoggedIn
}