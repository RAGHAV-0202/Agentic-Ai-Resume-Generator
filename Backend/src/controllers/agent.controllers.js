/**
 * ====================================================================
 * ROBUST AGENTIC RESUME CONTROLLER - PRODUCTION VERSION 2.0
 * ====================================================================
 * 
 * This controller implements best practices for:
 * - Proper state management
 * - Error handling and recovery
 * - Data consistency
 * - Performance optimization
 */

import Resume from "../models/Resume.model.js";
import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAgent } from "../utils/agentSystem.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../utils/pdfCompiler.js";
import dotenv from "dotenv";

dotenv.config();

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Clean mock data and prepare for frontend
 */
const cleanResumeData = (data) => {
  const cleaned = JSON.parse(JSON.stringify(data));

  const removeMockValues = (obj) => {
    if (typeof obj === "string") {
      if (obj === "__SKIPPED__") return "";
      // Add more mock value detection if needed
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj
        .map(removeMockValues)
        .filter(item => {
          if (typeof item === "string") return item !== "";
          if (typeof item === "object" && item !== null) {
            return Object.values(item).some(v => v !== "" && v !== null);
          }
          return true;
        });
    }

    if (obj && typeof obj === "object") {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = removeMockValues(value);
        if (cleanedValue !== "" && cleanedValue !== null) {
          if (!(Array.isArray(cleanedValue) && cleanedValue.length === 0)) {
            result[key] = cleanedValue;
          }
        }
      }
      return result;
    }

    return obj;
  };

  return removeMockValues(cleaned);
};

/**
 * Safely convert Mongoose document to plain object
 */
const toPlainObject = (data) => {
  if (!data) return {};
  if (typeof data.toObject === "function") {
    return data.toObject();
  }
  return JSON.parse(JSON.stringify(data));
};

// ====================================================================
// CONVERSATION MANAGEMENT
// ====================================================================

/**
 * Start a new agentic conversation
 */
export const startAgenticConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;
  const userId = req.user._id;

  if (!resumeId) {
    throw new ApiError(400, "resumeId is required");
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // If conversation already started, return last state
  if (resume.chatHistory.length > 0) {
    const lastMessage = resume.chatHistory[resume.chatHistory.length - 1];
    const cleanedData = cleanResumeData(toPlainObject(resume.data));

    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: lastMessage.content,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        chatHistory: resume.chatHistory,
      }, "Conversation resumed")
    );
  }

  // Initialize agent
  const agent = createAgent(process.env.GROQ_API_KEY);
  const cleanedData = cleanResumeData(toPlainObject(resume.data));

  try {
    // Generate first question
    const result = await agent.generateNextQuestion(cleanedData, []);

    // Save AI message with metadata
    await resume.addMessage("assistant", result.message);

    // Update conversation state
    resume.conversationState = {
      currentSection: result.nextSection,
      currentField: result.nextField,
      currentArrayIndex: result.arrayIndex || 0,
      pendingArrayAddition: result.pendingArrayAddition || false,
      isComplete: result.isComplete || false
    };

    await resume.save();

    res.status(200).json(
      new ApiResponse(200, {
        aiMessage: result.message,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        chatHistory: resume.chatHistory,
      }, "Conversation started successfully")
    );
  } catch (error) {
    console.error("❌ Failed to start conversation:", error);
    throw new ApiError(500, "Failed to start conversation. Please try again.");
  }
});

/**
 * Send message to the agentic system
 */
export const sendAgenticMessage = asyncHandler(async (req, res) => {
  const { resumeId, message } = req.body;
  const userId = req.user._id;

  if (!resumeId || !message?.trim()) {
    throw new ApiError(400, "resumeId and message are required");
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Save user message
  await resume.addMessage("user", message);

  // Initialize agent
  const agent = createAgent(process.env.GROQ_API_KEY);

  // Track previous section for PDF recompilation logic
  const previousSection = resume.conversationState.currentSection;

  // Get clean data
  const plainData = toPlainObject(resume.data);
  const cleanedData = cleanResumeData(plainData);

  // Build conversation context
  const conversationHistory = resume.chatHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    nextSection: resume.conversationState.currentSection,
    nextField: resume.conversationState.currentField,
  }));

  try {
    // Process message with agent
    const result = await agent.processMessage(
      message,
      cleanedData,
      conversationHistory,
      resume.conversationState
    );

    // Merge updated data back into resume
    // We need to be careful here to preserve the Mongoose document structure
    Object.keys(result.updatedData).forEach(key => {
      if (key === "personal" || key === "skills") {
        resume.data[key] = {
          ...(resume.data[key] || {}),
          ...result.updatedData[key]
        };
      } else {
        resume.data[key] = result.updatedData[key];
      }
    });

    // Mark data as modified (important for Mongoose)
    resume.markModified('data');

    // Save AI response
    await resume.addMessage("assistant", result.nextQuestion);

    // Update conversation state
    resume.conversationState = {
      currentSection: result.nextSection,
      currentField: result.nextField,
      currentArrayIndex: result.arrayIndex || 0,
      pendingArrayAddition: result.pendingArrayAddition || false,
      isComplete: result.isComplete || false
    };

    await resume.save();

    // Auto-recompile PDF if section completed or conversation finished
    let pdfRecompiled = false;
    const sectionChanged = previousSection !== result.nextSection;
    const conversationComplete = result.isComplete;

    if ((sectionChanged || conversationComplete) && resume.templateId) {
      try {
        const template = await Template.findById(resume.templateId);
        if (template) {
          const latexString = generateLatex(template.latexTemplate, resume.data);
          const pdfBuffer = await compilePDF(latexString, resumeId);
          savePDF(pdfBuffer, resumeId);

          resume.pdfUrl = `/pdfs/${resumeId}.pdf`;
          resume.generatedLatex = latexString;
          await resume.save();
          pdfRecompiled = true;
        }
      } catch (pdfError) {
        console.error("⚠️  PDF auto-recompile failed:", pdfError);
        // Don't fail the request if PDF compilation fails
      }
    }

    // Prepare response data
    const responseData = cleanResumeData(toPlainObject(resume.data));

    res.status(200).json(
      new ApiResponse(200, {
        aiMessage: result.nextQuestion,
        conversationState: resume.conversationState,
        resumeData: responseData,
        extractedFields: result.extractedFields,
        isComplete: result.isComplete,
        pdfRecompiled,
        chatHistory: resume.chatHistory,
      }, "Message processed successfully")
    );
  } catch (error) {
    console.error("❌ Failed to process message:", error);
    throw new ApiError(500, "Failed to process message. Please try again.");
  }
});

/**
 * Skip current field
 */
export const skipCurrentField = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;
  const userId = req.user._id;

  if (!resumeId) {
    throw new ApiError(400, "resumeId is required");
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Save skip message
  await resume.addMessage("user", "skip");

  const agent = createAgent(process.env.GROQ_API_KEY);
  const plainData = toPlainObject(resume.data);

  // Mark current field as skipped
  const { currentSection, currentField, currentArrayIndex } = resume.conversationState;

  if (currentSection && currentField) {
    if (["education", "experience", "projects"].includes(currentSection)) {
      if (!plainData[currentSection]) plainData[currentSection] = [];
      while (plainData[currentSection].length <= currentArrayIndex) {
        plainData[currentSection].push({});
      }
      plainData[currentSection][currentArrayIndex][currentField] = "__SKIPPED__";
    } else if (currentSection === "personal") {
      if (!plainData.personal) plainData.personal = {};
      plainData.personal[currentField] = "__SKIPPED__";
    } else if (currentSection === "skills") {
      if (!plainData.skills) plainData.skills = {};
      plainData.skills[currentField] = "__SKIPPED__";
    }
  }

  // Update resume data
  resume.data = plainData;
  resume.markModified('data');

  try {
    // Generate next question
    const result = await agent.generateNextQuestion(
      plainData,
      resume.chatHistory,
      true,
      resume.conversationState
    );

    // Save AI response
    await resume.addMessage("assistant", `No problem! Let's move on. ${result.message}`);

    // Update conversation state
    resume.conversationState = {
      currentSection: result.nextSection,
      currentField: result.nextField,
      currentArrayIndex: result.arrayIndex || 0,
      pendingArrayAddition: result.pendingArrayAddition || false,
      isComplete: result.isComplete || false
    };

    await resume.save();

    const responseData = cleanResumeData(toPlainObject(resume.data));

    res.status(200).json(
      new ApiResponse(200, {
        aiMessage: `No problem! Let's move on. ${result.message}`,
        conversationState: resume.conversationState,
        resumeData: responseData,
        wasSkipped: true,
        isComplete: result.isComplete,
      }, "Field skipped successfully")
    );
  } catch (error) {
    console.error("❌ Failed to skip field:", error);
    throw new ApiError(500, "Failed to skip field. Please try again.");
  }
});

/**
 * Update specific resume data
 */
export const updateResumeData = asyncHandler(async (req, res) => {
  const { resumeId, updateRequest } = req.body;
  const userId = req.user._id;

  if (!resumeId || !updateRequest) {
    throw new ApiError(400, "resumeId and updateRequest are required");
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  const agent = createAgent(process.env.GROQ_API_KEY);
  const plainData = toPlainObject(resume.data);
  const cleanedData = cleanResumeData(plainData);

  try {
    const result = await agent.updateSpecificData(updateRequest, cleanedData);

    // Merge updates
    Object.keys(result.updatedData).forEach(key => {
      resume.data[key] = result.updatedData[key];
    });

    resume.markModified('data');

    await resume.addMessage("user", updateRequest);
    await resume.addMessage("assistant", `✅ ${result.message}`);

    await resume.save();

    // Auto-recompile PDF
    let pdfRecompiled = false;
    if (resume.templateId && result.extractedFields.length > 0) {
      try {
        const template = await Template.findById(resume.templateId);
        if (template) {
          const latexString = generateLatex(template.latexTemplate, resume.data);
          const pdfBuffer = await compilePDF(latexString, resumeId);
          savePDF(pdfBuffer, resumeId);

          resume.pdfUrl = `/pdfs/${resumeId}.pdf`;
          resume.generatedLatex = latexString;
          await resume.save();
          pdfRecompiled = true;
        }
      } catch (pdfError) {
        console.error("⚠️  PDF recompile failed:", pdfError);
      }
    }

    const responseData = cleanResumeData(toPlainObject(resume.data));

    res.status(200).json(
      new ApiResponse(200, {
        message: result.message,
        resumeData: responseData,
        extractedFields: result.extractedFields,
        pdfRecompiled,
      }, "Data updated successfully")
    );
  } catch (error) {
    console.error("❌ Failed to update data:", error);
    throw new ApiError(500, "Failed to update data. Please try again.");
  }
});

/**
 * Get conversation status and analytics
 */
export const getConversationStatus = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  const agent = createAgent(process.env.GROQ_API_KEY);
  const plainData = toPlainObject(resume.data);
  const cleanedData = cleanResumeData(plainData);

  try {
    const missingFields = agent.analyzeMissingFields(cleanedData, resume.conversationState);

    // Calculate completion percentage
    const sections = ["personal", "education", "experience", "projects", "skills"];
    let completedSections = 0;

    // Personal
    if (cleanedData.personal?.name && cleanedData.personal?.email && cleanedData.personal?.phone) {
      completedSections++;
    }

    // Arrays
    if (cleanedData.education?.length > 0) completedSections++;
    if (cleanedData.experience?.length > 0) completedSections++;
    if (cleanedData.projects?.length > 0) completedSections++;

    // Skills
    if (cleanedData.skills?.languages?.length > 0 || cleanedData.skills?.technologies?.length > 0) {
      completedSections++;
    }

    const completionPercentage = Math.round((completedSections / sections.length) * 100);

    res.status(200).json(
      new ApiResponse(200, {
        isComplete: resume.conversationState.isComplete,
        currentSection: resume.conversationState.currentSection,
        currentField: resume.conversationState.currentField,
        completionPercentage,
        missingFields: missingFields.map(f => ({
          section: f.section,
          field: f.field,
          description: f.description,
          priority: f.priority
        })),
        resumeData: cleanedData,
        totalMessages: resume.chatHistory.length,
      }, "Conversation status retrieved")
    );
  } catch (error) {
    console.error("❌ Failed to get status:", error);
    throw new ApiError(500, "Failed to get conversation status");
  }
});

/**
 * Reset conversation
 */
export const resetAgenticConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Reset data
  resume.data = {
    personal: {},
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], technologies: [] },
    achievements: [],
    publications: [],
  };

  // Reset conversation
  resume.chatHistory = [];
  resume.conversationState = {
    currentSection: "personal",
    currentField: "name",
    currentArrayIndex: 0,
    pendingArrayAddition: false,
    isComplete: false,
  };

  resume.markModified('data');
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, { resume }, "Conversation reset successfully")
  );
});

// ====================================================================
// EXPORT
// ====================================================================

