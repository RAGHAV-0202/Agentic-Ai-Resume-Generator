import asyncHandler from "../utils/asyncHandler.js";
import Admin from "../models/admin.model.js";
import ApiError from "../utils/ApiError.js";
import dotenv from "dotenv"
dotenv.config()
import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessToken = async (userId) => {
    try {
        const admin = await Admin.findById(userId)
        const accessToken = admin.generateAccessToken();
        return { accessToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating token")
    }
}


const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new ApiError(400, "enter email and passoword")
    }
    const admin = await Admin.findOne({ email: email })

    if (!admin) {
        throw new ApiError(400, "Invalid Login or Password , admin not found")
    }

    // FIX: Use isPasswordCorrect method from model (bcrypt)
    const isPassValid = await admin.isPasswordCorrect(password);

    if (!isPassValid) {
        throw new ApiError(400, "Invalid Login or Password")
    }

    const { accessToken } = await generateAccessToken(admin._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
    };

    return res.status(200)
        .cookie("AdminAccessToken", accessToken, options)
        .json(
            new ApiResponse(200, { AdminAccessToken: accessToken }, "Welcome Admin")
        )

})

const adminLogout = asyncHandler(async (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/'
    };

    // Clear both accessToken and refreshToken cookies
    res.clearCookie('AdminAccessToken', cookieOptions);
    return res.status(200).json(new ApiResponse(200, "user logged out"));
});

const AdminIsLoggedIn = asyncHandler(async (req, res) => {
    let token;

    // 1) Try cookie first
    if (req.cookies?.AdminAccessToken) {
        token = req.cookies.AdminAccessToken;
    }

    // 2) If no cookie, try Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // 3) If still no token → error
    if (!token) {
        throw new ApiError(400, "NO TOKEN PRESENT");
    }

    // 4) Verify token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(400, "INVALID TOKEN");
    }

    // 5) Success
    res.status(200).json(new ApiResponse(200, decoded, "user is logged in"));
});



const AdminGetAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("_id firstName lastName email phoneNumber orders isEmailVerified fullName")
    res.status(200).json(new ApiResponse(200, users, "All users fetched"))
})





export {
    adminLogin,
    adminLogout,
    AdminIsLoggedIn,
    AdminGetAllUsers
}