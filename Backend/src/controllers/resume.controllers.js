import Resume from "../models/Resume.model.js";
import User from "../models/User.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Template from "../models/Template.model.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../utils/pdfCompiler.js";
import { getMockPreviewData } from "../utils/agentSystem.js";


export const createResumeWithPreview = asyncHandler(async (req, res) => {
  const { templateId } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ GET MOCK DATA FOR PREVIEW
  const mockData = getMockPreviewData();

  // Create new resume with MOCK DATA
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
    data: mockData, // ✅ START WITH MOCK DATA
  });

  // ✅ GENERATE INITIAL BLANK/TEMPLATE PDF (without mock data)
  // This provides a preview of the template structure
  if (templateId) {
    try {
      const template = await Template.findById(templateId);
      if (template) {
        // Generate PDF with empty data (shows template structure)
        const latexString = generateLatex(template.latexTemplate, newResume.data);
        const pdfBuffer = await compilePDF(latexString, newResume._id);
        savePDF(pdfBuffer, newResume._id);
        newResume.pdfUrl = `/pdfs/${newResume._id}.pdf`;
        newResume.generatedLatex = latexString;
        await newResume.save();
      }
    } catch (error) {
      console.error("Initial PDF generation failed:", error);
      // Don't throw error - resume is still created, just without PDF
    }
  }

  user.totalResumesCreated += 1;
  await user.save();

  res.status(201).json(
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

  if (!resume) {
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

  // Verify template exists
  const template = await Template.findById(templateId);
  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  resume.templateId = templateId;

  // Auto-generate PDF with new template
  try {
    const latexString = generateLatex(template.latexTemplate, resume.data);
    const pdfBuffer = await compilePDF(latexString, resume._id);
    savePDF(pdfBuffer, resume._id);
    resume.pdfUrl = `/pdfs/${resume._id}.pdf`;
    resume.generatedLatex = latexString;
  } catch (error) {
    console.error("PDF generation with new template failed:", error);
    // Don't throw - template is still set
  }

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


export const generateResumePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId }).populate("templateId");

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  if (!resume.templateId) {
    throw new ApiError(400, "Please select a template first");
  }

  try {
    const template = resume.templateId;
    const latexString = generateLatex(template.latexTemplate, resume.data);
    const pdfBuffer = await compilePDF(latexString, resume._id);
    savePDF(pdfBuffer, resume._id);

    resume.pdfUrl = `/pdfs/${resume._id}.pdf`;
    resume.generatedLatex = latexString;
    await resume.save();

    res.status(200).json(
      new ApiResponse(200, {
        pdfUrl: resume.pdfUrl,
        resume
      }, "PDF generated successfully")
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new ApiError(500, "Failed to generate PDF: " + error.message);
  }
});


export const updateResumeName = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resumeName } = req.body;
  const userId = req.user._id;

  if (!resumeName || resumeName.trim() === "") {
    throw new ApiError(400, "Resume name is required");
  }

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  resume.resumeName = resumeName.trim();
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, { resume }, "Resume name updated successfully")
  );
});


export const getResumeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Calculate completion based on sections
  const sections = {
    personal: ['name', 'email', 'phone'],
    education: 1,
    experience: 1,
    projects: 1,
    skills: ['languages', 'technologies'],
  };

  let completed = 0;
  let total = 0;

  // Check personal section
  total += sections.personal.length;
  sections.personal.forEach(field => {
    if (resume.data.personal?.[field] && resume.data.personal[field].trim() !== "") {
      completed++;
    }
  });

  // Check array sections
  ['education', 'experience', 'projects'].forEach(section => {
    total += sections[section];
    if (resume.data[section]?.length > 0) {
      completed += sections[section];
    }
  });

  // Check skills
  total += sections.skills.length;
  if (resume.data.skills?.languages?.length > 0) completed++;
  if (resume.data.skills?.technologies?.length > 0) completed++;

  const completionPercentage = Math.round((completed / total) * 100);

  res.status(200).json(
    new ApiResponse(200, {
      completionPercentage,
      isComplete: resume.conversationState.isComplete,
      sectionsStatus: {
        personal: sections.personal.every(f =>
          resume.data.personal?.[f] && resume.data.personal[f].trim() !== ""
        ),
        education: resume.data.education?.length > 0,
        experience: resume.data.experience?.length > 0,
        projects: resume.data.projects?.length > 0,
        skills: (resume.data.skills?.languages?.length > 0 ||
          resume.data.skills?.technologies?.length > 0),
      },
    }, "Resume status fetched successfully")
  );
});