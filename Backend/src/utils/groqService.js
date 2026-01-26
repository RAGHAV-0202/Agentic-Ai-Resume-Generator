import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

/**
 * Generic function to call Groq API
 */
const callGroqAPI = async (messages, jsonMode = false) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.6, // Slightly lower temperature for consistent data extraction
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) throw new Error(`GROQ API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return null;
  }
};

/**
 * THE BRAIN: Analyzes user input, extracts data, and determines intent.
 * This replaces 'extractDataFromMessage' and rigid flow logic.
 */
export const processUserMessage = async (userMessage, currentContext, resumeData) => {
  const systemPrompt = `
    You are an expert Resume Architect and Data Extractor.
    
    CURRENT CONTEXT:
    - User is currently focused on: ${currentContext.section} (Field: ${currentContext.field})
    - Existing Resume Data: ${JSON.stringify(resumeData)}

    YOUR TASK:
    Analyze the user's message ("${userMessage}") and return a JSON object with:
    1. **intent**: What is the user doing? (ANSWERING, SKIPPING, CHANGING_TOPIC, ASKING_HELP)
    2. **extractedData**: Extract relevant information into the correct schema format.
    3. **refinedContent**: If the user provided a bullet point or description, rewrite it to be impactful (Action verbs + Metrics).
    4. **nextSectionSuggestion**: Based on what was filled, what section/field should we discuss next?

    SCHEMA RULES:
    - **Personal**: { "personal": { "name": "...", "email": "..." } }
    - **Experience**: { "experience": [{ "company": "...", "position": "...", "highlights": ["..."] }] } (If updating existing, try to match context)
    - **Education**: { "education": [{ "institution": "...", "degree": "..." }] }
    - **Skills**: { "skills": { "languages": ["..."], "technologies": ["..."] } }

    OUTPUT JSON FORMAT:
    {
      "intent": "ANSWERING" | "SKIPPING" | "CHANGING_TOPIC" | "ASKING_HELP",
      "extractedData": {}, 
      "refinedContent": "Polished version of input if applicable (or null)",
      "confidence": 0-1
    }
  `;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const rawResponse = await callGroqAPI(messages, true);
  
  try {
    return JSON.parse(rawResponse);
  } catch (e) {
    console.error("Failed to parse AI intent", e);
    // Fallback if JSON fails
    return { intent: "ANSWERING", extractedData: {}, refinedContent: null };
  }
};

/**
 * THE VOICE: Generates the conversational response to the user.
 * This replaces 'getNextQuestion' and 'getSystemPrompt'.
 */
export const generateAIResponse = async (processedResult, currentContext, resumeData) => {
  
  // 1. Handle Greeting / Start
  if (processedResult.intent === "GREETING") {
     const systemPrompt = "You are an enthusiastic expert Resume Coach. Introduce yourself briefly and ask the user for their full name to get started.";
     const messages = [{ role: "system", content: systemPrompt }];
     return await callGroqAPI(messages);
  }

  // 2. Handle Help
  if (processedResult.intent === "ASKING_HELP") {
     // ... existing help logic ...
  }

  // 3. Standard Logic
  const systemPrompt = `
    You are a friendly, professional Resume Coach.
    STATUS:
    - User Data Just Extracted: ${JSON.stringify(processedResult.extractedData)}
    - Current Section Focus: ${currentContext.section}
    - Refined Content: ${processedResult.refinedContent || "None"}

    INSTRUCTIONS:
    1. Confirm receipt of data warmly.
    2. If Refined Content exists, ask if they want to use the polished version.
    3. Look at the resumeData and ask for the next logical missing field.
  `;
  
  const messages = [{ role: "system", content: systemPrompt }];
  return await callGroqAPI(messages);
};

/**
 * OPTIMIZER: Specific helper for polishing bullet points (Optional, can be used by buttons)
 */
export const optimizeContent = async (text, type = "experience") => {
  const prompt = `Rewrite this ${type} description to be ATS-friendly, impactful, and use strong action verbs.
  Original: "${text}"
  Return ONLY the rewritten version.`;

  const messages = [
    { role: "system", content: "You are an expert resume copywriter." },
    { role: "user", content: prompt },
  ];

  return await callGroqAPI(messages);
};