// src/controllers/agent.controller.js

import Resume from "../models/Resume.model.js";
import Template from "../models/Template.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createAgent } from "../utils/agentSystem.js";
import { generateLatex } from "../utils/LatexGenerator.js";
import { compilePDF, savePDF } from "../utils/pdfCompiler.js";
import { cleanMockData, isSkipRequest } from "../utils/groqService.js";
import dotenv from "dotenv";

dotenv.config();


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

  // ✅ CHECK FOR SKIP REQUEST FIRST
  if (isSkipRequest(message)) {
    console.log("🔄 Skip detected - moving to next field");
    
    // Initialize agent
    const agent = createAgent(process.env.GROQ_API_KEY);
    const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);
    
    // Force move to next field/section
    const result = await agent.generateNextQuestion(cleanedData, resume.chatHistory, true); // true = skip current
    
    // Update conversation state
    resume.conversationState.currentSection = result.nextSection;
    resume.conversationState.currentField = result.nextField;
    resume.conversationState.isComplete = result.isComplete;
    
    // Save AI response
    await resume.addMessage("assistant", `No problem! Let's move on. ${result.message}`);
    await resume.save();
    
    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: `No problem! Let's move on. ${result.message}`,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        wasSkipped: true,
        isComplete: result.isComplete,
        chatHistory: resume.chatHistory,
      })
    );
  }

  // Initialize agent
  const agent = createAgent(process.env.GROQ_API_KEY);

  // Clean mock data before processing
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

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
  Object.keys(result.updatedData).forEach(key => {
    if (key === 'personal' || key === 'skills') {
      resume.data[key] = { ...resume.data[key], ...result.updatedData[key] };
    } else if (Array.isArray(result.updatedData[key])) {
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

  if (result.isComplete) {
    resume.conversationState.isComplete = true;
  }

  await resume.save();

  // Auto-recompile PDF if significant data was added and template exists
  let pdfRecompiled = false;
  if (result.extractedFields?.length > 0 && resume.templateId) {
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
      aiMessage: result.nextQuestion,
      conversationState: resume.conversationState,
      resumeData: cleanedResponseData,
      extractedFields: result.extractedFields || [],
      isComplete: result.isComplete,
      wasUpdate: result.wasUpdate,
      pdfRecompiled,
      chatHistory: resume.chatHistory,
    })
  );
});


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
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  const result = await agent.processMessage(
    updateRequest,
    cleanedData,
    resume.chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  );

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
      extractedFields: result.extractedFields || [],
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
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  const missingFields = agent.analyzeMissingFields(cleanedData);

  const totalFields = 50;
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

  await resume.addMessage("user", "skip");

  const agent = createAgent(process.env.GROQ_API_KEY);
  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  // Force skip to next field
  const result = await agent.generateNextQuestion(cleanedData, resume.chatHistory, true);

  resume.conversationState.currentSection = result.nextSection;
  resume.conversationState.currentField = result.nextField;
  resume.conversationState.isComplete = result.isComplete;

  await resume.addMessage("assistant", `No problem! ${result.message}`);
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: `No problem! ${result.message}`,
      conversationState: resume.conversationState,
      resumeData: cleanedData,
    })
  );
});


export const addSampleExperience = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;
  const userId = req.user._id;

  if (!resumeId) {
    throw new ApiError(400, "resumeId is required");
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Add sample experience
  const sampleExperience = {
    company: "Tech Solutions Inc.",
    position: "Software Developer Intern",
    location: "Remote",
    startDate: "June 2023",
    endDate: "August 2023",
    highlights: [
      "Developed and maintained web applications using React and Node.js",
      "Collaborated with a team of 5 developers to deliver features on time",
      "Improved application performance by 30% through code optimization",
      "Participated in daily stand-ups and code reviews",
    ],
  };

  resume.data.experience.push(sampleExperience);
  await resume.save();

  // Recompile PDF if template exists
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

  const cleanedData = cleanMockData(resume.data?.toObject ? resume.data.toObject() : resume.data);

  res.status(200).json(
    new ApiResponse(200, {
      message: "Sample experience added successfully",
      resumeData: cleanedData,
      addedExperience: sampleExperience,
      pdfRecompiled,
    })
  );
});