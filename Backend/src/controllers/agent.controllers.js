/**
 * ====================================================================
 * AGENTIC RESUME CONTROLLER — True LLM-Driven Agent
 * ====================================================================
 *
 * This controller connects the Express routes to the AgenticResumeAgent.
 * The agent uses LLM tool-calling to:
 * - Extract multiple fields from a single message
 * - Handle out-of-order input
 * - Update existing data via natural language
 * - Generate contextual next questions
 */

import Resume from "../models/Resume.model.js";
import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAgent, scoreResume } from "../utils/agentSystem.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../utils/pdfCompiler.js";
import dotenv from "dotenv";

dotenv.config();

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

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

/**
 * Clean internal/empty values from resume data for frontend
 */
const cleanForFrontend = (data) => {
  if (!data) return {};
  const cleaned = JSON.parse(JSON.stringify(data));

  const removeEmpty = (obj) => {
    if (typeof obj === "string") {
      return (obj.trim() === "" || obj === "_skipped") ? null : obj;
    }
    if (Array.isArray(obj)) {
      return obj
        .map(removeEmpty)
        .filter(item => {
          if (item === null) return false;
          if (typeof item === "string" && item === "") return false;
          if (typeof item === "object" && item !== null && Object.keys(item).length === 0) return false;
          return true;
        });
    }
    if (obj && typeof obj === "object") {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith("_") || key.startsWith("$")) continue;
        const cleanedValue = removeEmpty(value);
        if (cleanedValue !== null && !(Array.isArray(cleanedValue) && cleanedValue.length === 0)) {
          result[key] = cleanedValue;
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    return obj;
  };

  return removeEmpty(cleaned) || {};
};

// ====================================================================
// START CONVERSATION
// ====================================================================

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
    const cleanedData = cleanForFrontend(toPlainObject(resume.data));

    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: lastMessage.content,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        chatHistory: resume.chatHistory,
      }, "Conversation resumed")
    );
  }

  // Clear data and start fresh
  const emptyData = {
    personal: {},
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], developerTools: [], libraries: [], technologies: [] },
    achievements: [],
    publications: [],
  };

  resume.data = emptyData;

  // Initialize agent and get opening message
  const agent = createAgent(process.env.GROQ_API_KEY);
  const result = agent.startConversation();

  // Save AI message
  await resume.addMessage("assistant", result.message);

  // Update conversation state
  resume.conversationState = {
    currentSection: result.nextSection,
    currentField: result.nextField,
    currentArrayIndex: 0,
    pendingArrayAddition: false,
    isComplete: false
  };

  await resume.save();

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: result.message,
      conversationState: resume.conversationState,
      resumeData: emptyData,
      chatHistory: resume.chatHistory,
    }, "Conversation started successfully")
  );
});

// ====================================================================
// SEND MESSAGE (Core agentic endpoint)
// ====================================================================

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

  // Get current data as plain object
  const currentData = toPlainObject(resume.data);

  // Build conversation history for context
  const conversationHistory = resume.chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    // Process message with the agentic system
    const result = await agent.processMessage(
      message,
      currentData,
      conversationHistory,
      resume.conversationState?.currentSection || "personal"
    );

    // Merge updated data back into resume
    if (result.updatedData) {
      for (const key of Object.keys(result.updatedData)) {
        if (key === "personal" || key === "skills") {
          // Merge objects
          resume.data[key] = { ...toPlainObject(resume.data[key]), ...result.updatedData[key] };
        } else if (Array.isArray(result.updatedData[key])) {
          // For arrays, take the updated version if it has more/different content
          resume.data[key] = result.updatedData[key];
        } else {
          resume.data[key] = result.updatedData[key];
        }
      }
      resume.markModified("data");
    }

    // Update conversation state
    resume.conversationState = {
      currentSection: result.nextSection || "personal",
      currentField: result.nextField || "name",
      currentArrayIndex: 0,
      pendingArrayAddition: false,
      isComplete: result.isComplete || false
    };

    // Save AI response
    await resume.addMessage("assistant", result.nextQuestion);
    await resume.save();

    // Auto-recompile PDF if data was updated and template exists
    let pdfRecompiled = false;
    if (result.extractedFields.length > 0 && resume.templateId) {
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
        console.error("⚠️  PDF auto-recompile failed:", pdfError.message);
      }
    }

    // Prepare clean response
    const cleanedData = cleanForFrontend(toPlainObject(resume.data));

    res.status(200).json(
      new ApiResponse(200, {
        aiMessage: result.nextQuestion,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        extractedFields: result.extractedFields || [],
        isComplete: result.isComplete,
        wasUpdate: result.wasUpdate,
        pdfRecompiled,
        chatHistory: resume.chatHistory,
        qualityScore: scoreResume(toPlainObject(resume.data)),
      }, "Message processed successfully")
    );
  } catch (error) {
    console.error("❌ Failed to process message:", error);
    throw new ApiError(500, "Failed to process message. Please try again.");
  }
});

// ====================================================================
// UPDATE RESUME DATA (Natural language updates)
// ====================================================================

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
  const currentData = toPlainObject(resume.data);

  const result = await agent.processMessage(
    updateRequest,
    currentData,
    resume.chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
    resume.conversationState?.currentSection || "personal"
  );

  // Apply updates
  if (result.updatedData) {
    for (const key of Object.keys(result.updatedData)) {
      if (key === "personal" || key === "skills") {
        resume.data[key] = { ...toPlainObject(resume.data[key]), ...result.updatedData[key] };
      } else if (Array.isArray(result.updatedData[key])) {
        resume.data[key] = result.updatedData[key];
      } else {
        resume.data[key] = result.updatedData[key];
      }
    }
    resume.markModified("data");
  }

  await resume.addMessage("user", updateRequest);
  await resume.addMessage("assistant", `✅ ${result.nextQuestion}`);
  await resume.save();

  // Auto-recompile PDF
  let pdfRecompiled = false;
  if (resume.templateId) {
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
    } catch (error) {
      console.error("Auto-recompile failed:", error.message);
    }
  }

  const cleanedData = cleanForFrontend(toPlainObject(resume.data));

  res.status(200).json(
    new ApiResponse(200, {
      message: "Data updated successfully",
      resumeData: cleanedData,
      extractedFields: result.extractedFields || [],
      pdfRecompiled,
    })
  );
});

// ====================================================================
// SKIP CURRENT FIELD
// ====================================================================

export const skipCurrentField = asyncHandler(async (req, res) => {
  // Treat "skip" as a regular message — the agent handles it naturally
  req.body.message = "skip";
  return sendAgenticMessage(req, res);
});

// ====================================================================
// CONVERSATION STATUS
// ====================================================================

export const getConversationStatus = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  const agent = createAgent(process.env.GROQ_API_KEY);
  const currentData = toPlainObject(resume.data);
  const missingFields = agent.analyzeMissingFields(currentData);

  // Calculate completion
  const totalExpectedFields = 15; // Rough count of key fields
  const missingRequired = missingFields.filter(f => f.required).length;
  const completionPercentage = Math.max(0, Math.round(
    ((totalExpectedFields - missingRequired) / totalExpectedFields) * 100
  ));

  const cleanedData = cleanForFrontend(currentData);

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
        required: f.required,
      })),
      resumeData: cleanedData,
      totalMessages: resume.chatHistory.length,
      qualityScore: scoreResume(currentData),
    }, "Conversation status retrieved")
  );
});

// ====================================================================
// RESET CONVERSATION
// ====================================================================

export const resetAgenticConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Reset everything
  resume.data = {
    personal: {},
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], technologies: [] },
    achievements: [],
    publications: [],
  };

  resume.chatHistory = [];
  resume.conversationState = {
    currentSection: "personal",
    currentField: "name",
    currentArrayIndex: 0,
    pendingArrayAddition: false,
    isComplete: false,
  };

  await resume.save();

  res.status(200).json(
    new ApiResponse(200, { resume }, "Conversation reset successfully")
  );
});
