import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Template from "../models/Template.model.js";


export const createResume = asyncHandler(async (req, res) => {
  const { templateId } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Create new resume session
  const newResume = await Resume.create({
    userId,
    templateId: templateId || null, 
    resumeName: `Resume - ${new Date().toLocaleDateString()}`,
    conversationState: {
      currentSection: "personal",
      currentField: "name",
      currentArrayIndex: 0,
      pendingArrayAddition: false,
      isComplete: false,
    },
    chatHistory: [],
    data: {
      personal: {
        name: "",
        location: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        website: "",
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        languages: [],
        technologies: [],
      },
      publications: [],
    },
  });

  user.totalResumesCreated += 1;
  await user.save();

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { resumeId: newResume._id, resume: newResume },
        "Resume session created successfully"
      )
    );
});


export const getUserResumes = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const resumes = await Resume.find({ userId })
    .sort({ updatedAt: -1 })
    .select("-chatHistory -generatedLatex")
    .populate("templateId"); 

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: resumes.length, resumes },
        "Resumes fetched successfully"
      )
    );
});


export const getResumeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId }).populate("templateId"); 

  if (!resume) {ß
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { resume }, "Resume fetched successfully"));
});


export const deleteResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  await Resume.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume deleted successfully"));
});


export const setResumeTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { templateId } = req.body;
  const userId = req.user._id;

  if (!templateId) {
    throw new ApiError(400, "Template ID is required");
  }

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  resume.templateId = templateId;
  await resume.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { resume },
        "Template selected successfully"
      )
    );
});