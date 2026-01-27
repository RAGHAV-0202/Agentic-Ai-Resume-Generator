// src/controllers/agent.controller.js

import Resume from "../models/Resume.model.js";
import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAgent } from "../utils/agentSystem.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../utils/pdfCompiler.js";
import { cleanMockData } from "../utils/groqService.js";
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// AGENTIC CHAT CONTROLLER
// ============================================================================

/**
 * Start a new conversation with the AI agent
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

  // If conversation already started, return last AI message
  if (resume.chatHistory.length > 0) {
    const lastMessage = resume.chatHistory[resume.chatHistory.length - 1];

    // Clean mock data before sending
    const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: lastMessage.content,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        chatHistory: resume.chatHistory,
      })
    );
  }

  // Initialize agent
  const agent = createAgent(process.env.GROQ_API_KEY);

  // Clean mock data before passing to agent
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  // Generate first question
  const result = await agent.generateNextQuestion(cleanedData, []);

  // Save AI message
  await resume.addMessage("assistant", result.message);

  // Update conversation state
  resume.conversationState.currentSection = result.nextSection;
  resume.conversationState.currentField = result.nextField;
  resume.conversationState.isComplete = result.isComplete;
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: result.message,
      conversationState: resume.conversationState,
      resumeData: cleanedData,
      chatHistory: resume.chatHistory,
    })
  );
});

/**
 * Send message to the AI agent
 * Agent intelligently extracts data, updates database, and generates next question
 */
export const sendAgenticMessage = asyncHandler(async (req, res) => {
  const { resumeId, message } = req.body;
  const userId = req.user._id;

  if (!resumeId || !message) {
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

  // Clean mock data before processing
  const cleanedData = cleanMockData(resume.data);

  // Build conversation history for context
  const conversationHistory = resume.chatHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    nextSection: resume.conversationState.currentSection,
    nextField: resume.conversationState.currentField,
  }));

  // Process message with agent (extracts data, updates, generates next question)
  const result = await agent.processMessage(
    message,
    cleanedData,
    conversationHistory
  );

  // Merge the updated data back (preserving structure)
  // The agent returns cleaned data, so we need to merge it properly
  Object.keys(result.updatedData).forEach(key => {
    if (key === 'personal' || key === 'skills') {
      resume.data[key] = { ...resume.data[key], ...result.updatedData[key] };
    } else if (Array.isArray(result.updatedData[key])) {
      // For arrays, if agent added new items, append them
      if (result.updatedData[key].length > resume.data[key].length) {
        resume.data[key] = result.updatedData[key];
      }
    } else {
      resume.data[key] = result.updatedData[key];
    }
  });

  // Save AI response
  await resume.addMessage("assistant", result.nextQuestion);

  // Update conversation state
  resume.conversationState.currentSection = result.nextSection;
  resume.conversationState.currentField = result.nextField;
  resume.conversationState.isComplete = result.isComplete;

  // Mark conversation complete if done
  if (result.isComplete) {
    resume.conversationState.isComplete = true;
  }

  await resume.save();

  // Auto-recompile PDF if significant data was added and template exists
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
    } catch (error) {
      console.error("Auto-recompile failed:", error);
      // Don't fail the chat if PDF compilation fails
    }
  }

  const cleanedResponseData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: result.nextQuestion,
      conversationState: resume.conversationState,
      resumeData: cleanedResponseData,
      extractedFields: result.extractedFields,
      isComplete: result.isComplete,
      wasUpdate: result.wasUpdate,
      pdfRecompiled,
      chatHistory: resume.chatHistory,
    })
  );
});

/**
 * Allow user to request specific updates
 * Example: "Update my email to new@email.com"
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

  // Initialize agent
  const agent = createAgent(process.env.GROQ_API_KEY);

  // Clean mock data before processing
  const cleanedData = cleanMockData(resume.data);

  // Process update request
  const result = await agent.processMessage(
    updateRequest,
    cleanedData,
    resume.chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  );

  // Update resume data
  Object.keys(result.updatedData).forEach(key => {
    if (key === 'personal' || key === 'skills') {
      resume.data[key] = { ...resume.data[key], ...result.updatedData[key] };
    } else if (Array.isArray(result.updatedData[key])) {
      resume.data[key] = result.updatedData[key];
    } else {
      resume.data[key] = result.updatedData[key];
    }
  });

  await resume.addMessage("user", updateRequest);
  await resume.addMessage("assistant", `✅ Updated successfully! ${result.nextQuestion}`);

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
      console.error("Auto-recompile failed:", error);
    }
  }

  const cleanedResponseData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  res.status(200).json(
    new ApiResponse(200, {
      message: "Data updated successfully",
      resumeData: cleanedResponseData,
      extractedFields: result.extractedFields,
      pdfRecompiled,
    })
  );
});


export const getConversationStatus = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  const agent = createAgent(process.env.GROQ_API_KEY);

  // Clean mock data before analysis
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  const missingFields = agent.analyzeMissingFields(cleanedData);

  // Calculate completion based on real data only
  const totalFields = 50; // Approximate total important fields
  const missingCount = missingFields.filter(f => f.required).length;
  const completionPercentage = Math.max(0, Math.round(
    ((totalFields - missingCount) / totalFields) * 100
  ));

  res.status(200).json(
    new ApiResponse(200, {
      isComplete: resume.conversationState.isComplete,
      currentSection: resume.conversationState.currentSection,
      currentField: resume.conversationState.currentField,
      missingFields: missingFields.map(f => ({
        section: f.section,
        field: f.field,
        description: f.description,
        required: f.required,
      })),
      completionPercentage,
      resumeData: cleanedData,
    })
  );
});


export const resetAgenticConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Reset data (keep template)
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

  await resume.save();

  res.status(200).json(
    new ApiResponse(200, { resume }, "Conversation reset successfully")
  );
});


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

  // Initialize agent to get next question
  const agent = createAgent(process.env.GROQ_API_KEY);

  // Clean mock data
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  // Get next question without updating current field
  const result = await agent.generateNextQuestion(cleanedData, resume.chatHistory);

  // Update conversation state to next field
  resume.conversationState.currentSection = result.nextSection;
  resume.conversationState.currentField = result.nextField;
  resume.conversationState.isComplete = result.isComplete;

  await resume.addMessage("assistant", result.message);
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: result.message,
      conversationState: resume.conversationState,
      resumeData: cleanedData,
    })
  );
});