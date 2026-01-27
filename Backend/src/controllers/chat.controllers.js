// src/controllers/chat.controller.js

import Resume from "../models/Resume.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getAIResponse,
  extractDataFromMessage,
  isSkipRequest,
  cleanMockData,
} from "../utils/groqService.js";

// Enhanced section flow with achievements and publications
const sectionFlow = {
  personal: ["name", "location", "email", "phone", "linkedin", "github", "website"],
  education: ["institution", "degree", "startDate", "endDate", "gpa", "coursework"],
  experience: ["company", "position", "location", "startDate", "endDate", "highlights"],
  projects: ["name", "link", "date", "highlights", "technologies"],
  skills: ["languages", "technologies"],
  achievements: ["list"], // Single field for achievements
  publications: ["title", "authors", "date", "doi"],
};

/**
 * Get next field in the conversation flow
 */
const getNextField = (currentSection, currentField, isPendingArray, forceNextSection = false) => {
  // Handle pending array addition question
  if (isPendingArray) {
    return {
      section: currentSection,
      field: "addMore",
      isPending: true,
    };
  }

  const fields = sectionFlow[currentSection];
  
  // Handle single-field sections (like achievements)
  if (!Array.isArray(fields) || fields.length === 0) {
    const sections = Object.keys(sectionFlow);
    const sectionIndex = sections.indexOf(currentSection);
    
    if (sectionIndex < sections.length - 1) {
      const nextSection = sections[sectionIndex + 1];
      return {
        section: nextSection,
        field: Array.isArray(sectionFlow[nextSection]) ? sectionFlow[nextSection][0] : "list",
        isPending: false,
      };
    }
    
    return { section: "complete", field: "complete", isPending: false };
  }

  const currentIndex = fields.indexOf(currentField);

  // Move to next field in current section
  if (currentField !== "addMore" && currentIndex < fields.length - 1) {
    return {
      section: currentSection,
      field: fields[currentIndex + 1],
      isPending: false,
    };
  }

  // For array sections, ask if user wants to add more
  if (!forceNextSection && ["education", "experience", "projects", "publications"].includes(currentSection)) {
    return {
      section: currentSection,
      field: "addMore",
      isPending: true,
    };
  }

  // Move to next section
  const sections = Object.keys(sectionFlow);
  const sectionIndex = sections.indexOf(currentSection);

  if (sectionIndex < sections.length - 1) {
    const nextSection = sections[sectionIndex + 1];
    const nextFields = sectionFlow[nextSection];
    return {
      section: nextSection,
      field: Array.isArray(nextFields) ? nextFields[0] : "list",
      isPending: false,
    };
  }

  // Conversation complete
  return {
    section: "complete",
    field: "complete",
    isPending: false,
  };
};

/**
 * Start a new conversation
 */
export const startConversation = asyncHandler(async (req, res) => {
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
    const cleanedData = cleanMockData(resume.data);
    
    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: lastMessage.content,
        conversationState: resume.conversationState,
        resumeData: cleanedData,
        chatHistory: resume.chatHistory,
      })
    );
  }

  // Get first AI message
  const aiResponse = await getAIResponse(
    "start",
    resume.conversationState,
    resume.data,
    []
  );

  await resume.addMessage("assistant", aiResponse);

  // Clean mock data before sending
  const cleanedData = cleanMockData(resume.data);

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: aiResponse,
      conversationState: resume.conversationState,
      resumeData: cleanedData,
      chatHistory: resume.chatHistory,
    })
  );
});

/**
 * Send a message in the conversation
 */
export const sendMessage = asyncHandler(async (req, res) => {
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

  const { currentSection, currentField, pendingArrayAddition } =
    resume.conversationState;

  // Handle "add more" question for array sections
  if (pendingArrayAddition) {
    const isNegative = /^(no|nope|nah|not|stop|done|finish|skip|enough|that'?s all|that'?s it)$/i.test(message.trim()) ||
                      /^(no|nope|nah|not really|i'?m done|i'?m good)[\s,.!]*$/i.test(message.trim());
    const isPositive = /^(yes|yeah|yep|sure|ok|okay|yup|add|more|another)[\s,.!]*$/i.test(message.trim()) ||
                      /^(yes|yeah)[\s,.!]+(please|add|more)*/i.test(message.trim());

    if (isPositive || (!isNegative && /add|more|yes|another/i.test(message))) {
      // User wants to add more - reset to first field of current section
      resume.conversationState.currentField = sectionFlow[currentSection][0];
      resume.conversationState.currentArrayIndex += 1;
      resume.conversationState.pendingArrayAddition = false;
      
      await resume.save();

      // Get AI response for next item
      const aiResponse = await getAIResponse(
        message,
        resume.conversationState,
        resume.data,
        resume.chatHistory
      );

      await resume.addMessage("assistant", aiResponse);

      // Clean mock data before sending
      const cleanedData = cleanMockData(resume.data);

      return res.status(200).json(
        new ApiResponse(200, {
          aiMessage: aiResponse,
          conversationState: resume.conversationState,
          resumeData: cleanedData,
          isComplete: false,
        })
      );
    } else {
      // User doesn't want to add more - move to next section
      const nextState = getNextField(currentSection, currentField, false, true);
      resume.conversationState.currentSection = nextState.section;
      resume.conversationState.currentField = nextState.field;
      resume.conversationState.currentArrayIndex = 0;
      resume.conversationState.pendingArrayAddition = false;

      // Check if complete
      if (nextState.section === "complete") {
        resume.conversationState.isComplete = true;
      }

      await resume.save();

      // Get AI response for next section
      const aiResponse = await getAIResponse(
        message,
        resume.conversationState,
        resume.data,
        resume.chatHistory
      );

      await resume.addMessage("assistant", aiResponse);

      // Clean mock data before sending
      const cleanedData = cleanMockData(resume.data);

      return res.status(200).json(
        new ApiResponse(200, {
          aiMessage: aiResponse,
          conversationState: resume.conversationState,
          resumeData: cleanedData,
          isComplete: resume.conversationState.isComplete,
        })
      );
    }
  }

  // Extract data from user message
  let extractedValue = await extractDataFromMessage(
    message,
    currentField,
    currentSection
  );

  let wasSkipped = false;

  // Save extracted data to resume (only if not SKIP)
  if (extractedValue && extractedValue !== "SKIP") {
    if (currentSection === "personal") {
      // Simple field update
      resume.data.personal[currentField] = extractedValue;
    } 
    else if (currentSection === "skills") {
      // Skills are arrays - split by comma
      const items = extractedValue
        .split(",")
        .map((s) => s.trim())
        .filter(s => s.length > 0);
      resume.data.skills[currentField] = items;
    }
    else if (currentSection === "achievements") {
      // Achievements is a simple array of strings
      const items = extractedValue
        .split(",")
        .map((s) => s.trim())
        .filter(s => s.length > 0);
      
      // Append to existing achievements or create new array
      if (resume.data.achievements && Array.isArray(resume.data.achievements)) {
        resume.data.achievements = [...resume.data.achievements, ...items];
      } else {
        resume.data.achievements = items;
      }
    }
    else if (["education", "experience", "projects", "publications"].includes(currentSection)) {
      // Array sections - ensure array exists at current index
      const arrayIndex = resume.conversationState.currentArrayIndex;

      if (!resume.data[currentSection][arrayIndex]) {
        resume.data[currentSection][arrayIndex] = {};
      }

      // Special handling for array fields within objects (highlights, coursework, etc.)
      if (["highlights", "coursework", "technologies", "authors"].includes(currentField)) {
        const items = extractedValue
          .split(",")
          .map((s) => s.trim())
          .filter(s => s.length > 0);
        resume.data[currentSection][arrayIndex][currentField] = items;
      } else {
        resume.data[currentSection][arrayIndex][currentField] = extractedValue;
      }
    }
  } else if (extractedValue === "SKIP") {
    wasSkipped = true;
  }

  // Get next field
  const nextState = getNextField(currentSection, currentField, false);

  resume.conversationState.currentSection = nextState.section;
  resume.conversationState.currentField = nextState.field;
  resume.conversationState.pendingArrayAddition = nextState.isPending;

  // Check if complete
  if (nextState.section === "complete") {
    resume.conversationState.isComplete = true;
  }

  await resume.save();

  // Get AI response
  const aiResponse = await getAIResponse(
    message,
    resume.conversationState,
    resume.data,
    resume.chatHistory
  );

  await resume.addMessage("assistant", aiResponse);

  // Clean mock data before sending
  const cleanedData = cleanMockData(resume.data);

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: aiResponse,
      conversationState: resume.conversationState,
      resumeData: cleanedData,
      extractedData: wasSkipped ? null : {
        field: currentField,
        value: extractedValue,
      },
      wasSkipped,
      isComplete: resume.conversationState.isComplete,
    })
  );
});

/**
 * Reset conversation and start fresh
 */
export const resetConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Reset conversation state and data
  await resume.resetConversation();

  // Also clear the data (but keep template)
  resume.data = {
    personal: {},
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], technologies: [] },
    achievements: [],
    publications: [],
  };

  await resume.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, { resume }, "Conversation reset successfully")
    );
});

/**
 * Get current conversation summary
 */
export const getConversationSummary = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  // Clean mock data
  const cleanedData = cleanMockData(resume.data);

  // Calculate completion percentage based on filled sections
  const sections = ['personal', 'education', 'experience', 'projects', 'skills'];
  let filledSections = 0;

  sections.forEach(section => {
    if (section === 'personal') {
      const requiredFields = ['name', 'email', 'phone'];
      const filled = requiredFields.every(field => 
        cleanedData.personal?.[field] && cleanedData.personal[field].trim() !== ''
      );
      if (filled) filledSections++;
    } else if (section === 'skills') {
      if (cleanedData.skills?.languages?.length > 0 || cleanedData.skills?.technologies?.length > 0) {
        filledSections++;
      }
    } else {
      if (cleanedData[section]?.length > 0) {
        filledSections++;
      }
    }
  });

  const completionPercentage = Math.round((filledSections / sections.length) * 100);

  res.status(200).json(
    new ApiResponse(200, {
      conversationState: resume.conversationState,
      resumeData: cleanedData,
      completionPercentage,
      chatHistory: resume.chatHistory,
    })
  );
});