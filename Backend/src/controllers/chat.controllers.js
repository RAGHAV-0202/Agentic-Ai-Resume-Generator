// src/controllers/chat.controller.js

import Resume from "../models/Resume.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getAIResponse,
  extractDataFromMessage,
} from "../utils/groqService.js";
import { createAgent } from "../utils/agentSystem.js";


const sectionFlow = {
  personal: ["name", "location", "email", "phone", "linkedin", "github", "website"],
  education: ["institution", "degree", "startDate", "endDate", "gpa", "coursework"],
  experience: ["company", "position", "location", "startDate", "endDate", "highlights"],
  projects: ["name", "link", "date", "highlights", "technologies"],
  skills: ["languages", "technologies"],
};

const getNextField = (currentSection, currentField, isPendingArray, forceNextSection = false) => {
  if (isPendingArray) {
    return {
      section: currentSection,
      field: "addMore",
      isPending: true,
    };
  }

  const fields = sectionFlow[currentSection];
  const currentIndex = fields.indexOf(currentField);

  // If currentField is "addMore", we shouldn't look for next field in same section
  // unless we are actually adding more (handled by caller logic usually, but here we are moving ON)
  if (currentField !== "addMore" && currentIndex < fields.length - 1) {
    return {
      section: currentSection,
      field: fields[currentIndex + 1],
      isPending: false,
    };
  }

  if (!forceNextSection && ["education", "experience", "projects"].includes(currentSection)) {
    return {
      section: currentSection,
      field: "addMore",
      isPending: true,
    };
  }

  const sections = Object.keys(sectionFlow);
  const sectionIndex = sections.indexOf(currentSection);

  if (sectionIndex < sections.length - 1) {
    const nextSection = sections[sectionIndex + 1];
    return {
      section: nextSection,
      field: sectionFlow[nextSection][0],
      isPending: false,
    };
  }

  return {
    section: "complete",
    field: "complete",
    isPending: false,
  };
};


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

  await resume.addMessage("user", message);

  const { currentSection, currentField, pendingArrayAddition } =
    resume.conversationState;

  if (pendingArrayAddition) {
    const isNegative = /no|nope|nah|not|stop|done|finish|skip/i.test(message);
    const isPositive = /yes|yeah|sure|yep|add|more/i.test(message);

    if (!isNegative && isPositive) {
      resume.conversationState.currentField = sectionFlow[currentSection][0];
      resume.conversationState.currentArrayIndex += 1;
      resume.conversationState.pendingArrayAddition = false;
    } else {
      const nextState = getNextField(currentSection, currentField, false, true);
      resume.conversationState.currentSection = nextState.section;
      resume.conversationState.currentField = nextState.field;
      resume.conversationState.currentArrayIndex = 0;
      resume.conversationState.pendingArrayAddition = false;
    }

    await resume.save();

    // Get AI response for next question
    const aiResponse = await getAIResponse(
      message,
      resume.conversationState,
      resume.data,
      resume.chatHistory
    );

    await resume.addMessage("assistant", aiResponse);



    res.status(200).json(
      new ApiResponse(200, {
        aiMessage: aiResponse,
        conversationState: resume.conversationState,
        resumeData: resume.data,
        extractedData: {
          field: currentField,
          value: extractedValue,
        },
        isComplete: resume.conversationState.isComplete,
      })
    );
  };

  // Extract data from user message
  let extractedValue = await extractDataFromMessage(
    message,
    currentField,
    currentSection
  );

  // Save extracted data to resume
  if (extractedValue && extractedValue !== "SKIP") {
    if (currentSection === "personal") {
      // Simple field update
      resume.data.personal[currentField] = extractedValue;
    } else if (currentSection === "skills") {
      // Skills are arrays - split by comma
      const items = extractedValue.split(",").map((s) => s.trim());
      resume.data.skills[currentField] = items;
    } else if (["education", "experience", "projects"].includes(currentSection)) {
      // Array sections - ensure array exists at current index
      const arrayIndex = resume.conversationState.currentArrayIndex;

      if (!resume.data[currentSection][arrayIndex]) {
        resume.data[currentSection][arrayIndex] = {};
      }

      // Special handling for array fields (highlights, coursework, etc.)
      if (["highlights", "coursework", "technologies"].includes(currentField)) {
        const items = extractedValue.split(",").map((s) => s.trim());
        resume.data[currentSection][arrayIndex][currentField] = items;
      } else {
        resume.data[currentSection][arrayIndex][currentField] = extractedValue;
      }
    }
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

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: aiResponse,
      conversationState: resume.conversationState,
      resumeData: resume.data,
      extractedData: {
        field: currentField,
        value: extractedValue,
      },
      isComplete: resume.conversationState.isComplete,
    })
  );
});

export const resetConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new ApiError(404, "Resume not found or unauthorized");
  }

  await resume.resetConversation();

  res
    .status(200)
    .json(
      new ApiResponse(200, { resume }, "Conversation reset successfully")
    );
});


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
    return res.status(200).json(
      new ApiResponse(200, {
        aiMessage: lastMessage.content,
        conversationState: resume.conversationState,
        resumeData: resume.data,
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

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: aiResponse,
      conversationState: resume.conversationState,
      resumeData: resume.data,
    })
  );
});