import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Template from "../models/Template.model.js";


// src/controllers/resume.controller.js

export const createResume = asyncHandler(async (req, res) => {
  const { templateId } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ MOCK DATA - Pre-filled resume
  const mockData = {
    personal: {
      name: "John Doe",
      location: "San Francisco, CA",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe",
      website: "johndoe.dev",
    },
    education: [
      {
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science in Computer Science",
        startDate: "2018",
        endDate: "2022",
        gpa: "3.8/4.0",
        coursework: ["Data Structures", "Algorithms", "Machine Learning", "Web Development"],
      },
    ],
    experience: [
      {
        company: "Tech Innovations Inc.",
        position: "Software Engineer",
        location: "San Francisco, CA",
        startDate: "June 2022",
        endDate: "Present",
        highlights: [
          "Developed full-stack web applications using React and Node.js",
          "Improved application performance by 40% through optimization",
          "Led a team of 3 junior developers on key projects",
        ],
      },
    ],
    projects: [
      {
        name: "E-Commerce Platform",
        link: "github.com/johndoe/ecommerce",
        date: "2022",
        highlights: [
          "Built a scalable e-commerce platform with payment integration",
          "Implemented real-time inventory management",
        ],
        technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      },
      {
        name: "Task Management App",
        link: "github.com/johndoe/taskmanager",
        date: "2021",
        highlights: [
          "Created a collaborative task management tool with real-time updates",
        ],
        technologies: ["Vue.js", "Firebase", "Tailwind CSS"],
      },
    ],
    skills: {
      languages: ["JavaScript", "Python", "Java", "TypeScript"],
      technologies: ["React", "Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS"],
    },
    publications: [],
  };

  // Create new resume session with MOCK DATA
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
    data: mockData, // ✅ Pre-filled with mock data
  });

  // ✅ AUTO-GENERATE PDF WITH MOCK DATA
  if (templateId) {
    try {
      const template = await Template.findById(templateId);
      if (template) {
        const latexString = generateLatex(template.latexTemplate, mockData);
        const pdfBuffer = await compilePDF(latexString, newResume._id);
        const pdfPath = savePDF(pdfBuffer, newResume._id);
        newResume.pdfUrl = `/pdfs/${newResume._id}.pdf`;
        newResume.generatedLatex = latexString;
        await newResume.save();
      }
    } catch (error) {
      console.error("Initial PDF generation failed:", error);
      // Don't throw error - resume is still created
    }
  }

  user.totalResumesCreated += 1;
  await user.save();

  res.status(201).json(
    new ApiResponse(
      201,
      { resumeId: newResume._id, resume: newResume },
      "Resume session created successfully with preview"
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

