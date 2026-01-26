import Resume from "../models/Resume.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
// Make sure to export generateAIResponse from groqService
import { processUserMessage, generateAIResponse } from "../utils/groqService.js";


const mergeData = (target, source) => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
      Object.assign(source[key], mergeData(target[key], source[key]));
    } else {
      // For arrays or primitives, strictly replace or push? 
      // For this agent, replacing or appending based on logic is better.
      // Simple override for now:
      target[key] = source[key];
    }
  }
  return target;
};

export const sendMessage = asyncHandler(async (req, res) => {
  const { resumeId, message } = req.body; // <--- FIX: Extract message
  const userId = req.user._id;

  if (!resumeId || !message) throw new ApiError(400, "Missing parameters");

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) throw new ApiError(404, "Resume not found");

  // 1. PROCESS: Ask the "Brain" what the user meant
  // FIX: Use 'resume' (instance), not 'Resume' (model)
  const aiAnalysis = await processUserMessage(
    message,
    resume.conversationState,
    resume.data
  );

  // 2. UPDATE DATA: Apply the extracted JSON to the database
  if (aiAnalysis.extractedData && Object.keys(aiAnalysis.extractedData).length > 0) {
    // Merge data safely
    resume.data = mergeData(resume.data, aiAnalysis.extractedData);
    
    // FIX: Mongoose Mixed types require explicit marking to save
    resume.markModified('data'); 
  }

  // 3. UPDATE STATE (Optional but recommended)
  // If the AI suggests we are now talking about "Experience", update state
  // so the NEXT prompt uses the correct context.
  if (aiAnalysis.extractedData.experience) resume.conversationState.currentSection = "experience";
  if (aiAnalysis.extractedData.education) resume.conversationState.currentSection = "education";
  if (aiAnalysis.extractedData.projects) resume.conversationState.currentSection = "projects";

  // 4. GENERATE REPLY: Ask the "Voice" what to say next
  const aiReply = await generateAIResponse(
    aiAnalysis,
    resume.conversationState,
    resume.data
  );

  // 5. SAVE & RESPOND
  await resume.addMessage("user", message);
  await resume.addMessage("assistant", aiReply);
  await resume.save(); // <--- FIX: Save the instance

  res.status(200).json(new ApiResponse(200, {
    aiMessage: aiReply,
    updatedData: aiAnalysis.extractedData,
    conversationState: resume.conversationState
  }));
});


export const startConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) throw new ApiError(404, "Resume not found");

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

  // --- FIX: Logic for the VERY FIRST message ---
  // We mock an "empty" analysis to trigger the AI's greeting
  const initialContext = { 
    intent: "GREETING", 
    extractedData: {}, 
    refinedContent: null 
  };

  // We ask the AI to generate the first question
  const aiResponse = await generateAIResponse(
    initialContext, 
    resume.conversationState, 
    resume.data
  );

  await resume.addMessage("assistant", aiResponse);
  await resume.save();

  res.status(200).json(
    new ApiResponse(200, {
      aiMessage: aiResponse,
      conversationState: resume.conversationState,
      resumeData: resume.data,
    })
  );
});

// Reset logic remains the same...
export const resetConversation = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user._id;
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) throw new ApiError(404, "Resume not found");

  await resume.resetConversation();
  res.status(200).json(new ApiResponse(200, { resume }, "Reset successful"));
});