import Resume from "../models/Resume.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getPublicResumeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const resume = await Resume.findById(id).populate("userId", "fullName email");

    if (!resume) {
        throw new ApiError(404, "Resume not found");
    }

    if (!resume.isPublic) {
        throw new ApiError(403, "This resume is private");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { resume },
            "Public resume fetched successfully"
        )
    );
});
