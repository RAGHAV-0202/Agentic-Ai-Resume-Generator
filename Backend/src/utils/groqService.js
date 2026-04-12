import fetch from "node-fetch";


const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Validated models that work with Groq (ordered by preference)
const VALIDATED_GROQ_MODELS = [
  "openai/gpt-oss-120b",                          // Primary — strongest, 8K tok/min
  "llama-3.3-70b-versatile",                       // Fallback 1 — 12K tok/min
  "meta-llama/llama-4-scout-17b-16e-instruct",     // Fallback 2 — 30K tok/min
  "qwen/qwen3-32b",                                // Fallback 3 — 60 req/min
  "moonshotai/kimi-k2-instruct",                   // Fallback 4 — 60 req/min, 10K tok/min
  "openai/gpt-oss-20b",                            // Fallback 5 — lighter gpt-oss, 8K tok/min
  "moonshotai/kimi-k2-instruct-0905",              // Fallback 6 — kimi variant, 60 req/min
  "llama-3.1-8b-instant",                          // Fallback 7 — fastest, 14.4K req/min
];

// Mock data patterns to detect and remove
const MOCK_PATTERNS = [
  /john\.?doe/i,
  /jane\.?doe/i,
  /example\.com/i,
  /\+1\s?\(555\)/i,
  /555-?\d{4}/i,
  /university of california/i,
  /tech innovations/i,
  /san francisco,?\s*ca/i,
  /bachelor of science in computer science/i
];

// ====================================================================
// MOCK DATA DETECTION AND CLEANING
// ====================================================================

/**
 * Check if a string value appears to be mock/placeholder data
 */
export const isMockData = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  const lowerValue = value.toLowerCase().trim();

  // Check against known mock patterns
  return MOCK_PATTERNS.some(pattern => pattern.test(lowerValue));
};

/**
 * Recursively clean mock data from resume data
 * @param {Object} data - Resume data to clean
 * @param {WeakSet} seen - Tracks visited objects to prevent infinite loops
 * @param {Boolean} keepSkips - If true, preserve __SKIPPED__ markers
 * @returns {Object} Cleaned data
 */
export const cleanMockData = (data, seen = new WeakSet(), keepSkips = false) => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return keepSkips ? null : "";
  }

  // Handle strings
  if (typeof data === "string") {
    // Preserve skip markers if requested
    if (data === "__SKIPPED__") {
      return keepSkips ? data : "";
    }

    // Remove mock data
    if (isMockData(data)) {
      return "";
    }

    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data
      .map(item => cleanMockData(item, seen, keepSkips))
      .filter(item => {
        // Remove empty strings
        if (typeof item === "string") {
          return item !== "";
        }

        // Remove empty objects
        if (typeof item === "object" && item !== null) {
          const hasValidValues = Object.values(item).some(v => {
            if (v === "__SKIPPED__" && keepSkips) return true;
            return v !== "" && v !== null;
          });
          return hasValidValues;
        }

        return true;
      });
  }

  // Handle dates
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle objects (prevent circular references)
  if (typeof data === "object") {
    if (seen.has(data)) {
      return null;
    }
    seen.add(data);

    const cleaned = {};

    for (const key in data) {
      // Skip Mongoose internals and prototypes
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      if (key.startsWith("$") || key.startsWith("_")) continue;

      const cleanedValue = cleanMockData(data[key], seen, keepSkips);

      // Only include non-empty values
      if (cleanedValue !== null && cleanedValue !== "") {
        if (!(Array.isArray(cleanedValue) && cleanedValue.length === 0)) {
          cleaned[key] = cleanedValue;
        }
      }
    }

    return cleaned;
  }

  return data;
};

// ====================================================================
// SKIP DETECTION
// ====================================================================

/**
 * Detect if user message is a skip request
 */
export const isSkipRequest = (message) => {
  if (!message || typeof message !== "string") {
    return false;
  }

  const lowerMessage = message.toLowerCase().trim();

  const skipPatterns = [
    /^skip$/,
    /^pass$/,
    /^next$/,
    /^n\/a$/,
    /^na$/,
    /^no$/,
    /^nope$/,
    /^nothing$/,
    /^none$/,
    /skip (this|it)/,
    /don'?t have/,
    /do not have/,
    /i don'?t/,
    /not applicable/,
    /leave (it )?blank/,
    /leave (it )?empty/,
    /i'?ll skip/,
    /let'?s skip/,
    /move on/,
    /go to next/,
    /^-$/
  ];

  return skipPatterns.some(pattern => pattern.test(lowerMessage));
};

// ====================================================================
// GROQ API UTILITIES
// ====================================================================

/**
 * Get a random validated Groq model
 */
export const getRandomModel = () => {
  return VALIDATED_GROQ_MODELS[Math.floor(Math.random() * VALIDATED_GROQ_MODELS.length)];
};

/**
 * Call Groq API with automatic retry and fallback
 */
export const callGroqAPI = async (
  messages,
  apiKey,
  options = {}
) => {
  const {
    tools = null,
    toolChoice = "auto",
    temperature = 0.5,
    maxRetries = 2
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = getRandomModel();

      const payload = {
        model,
        messages,
        temperature,
        max_tokens: 2000
      };

      if (tools) {
        payload.tools = tools;
        payload.tool_choice = toolChoice;
      }

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }

      const data = await response.json();

      if (data.choices?.[0]?.message) {
        return data.choices[0].message.content?.trim() || "";
      }

      throw new Error("Invalid API response structure");

    } catch (error) {
      lastError = error;
      console.error(`Groq API attempt ${attempt + 1} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`Groq API failed after ${maxRetries + 1} attempts: ${lastError.message}`);
};

// ====================================================================
// DATA VALIDATION
// ====================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number format (flexible)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Should have 10-15 digits, optionally starting with +
  const phoneRegex = /^\+?\d{10,15}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate URL format
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== "string") return false;

  try {
    new URL(url);
    return true;
  } catch {
    // Check if it's a valid partial URL (e.g., github.com/username)
    const partialURLRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    return partialURLRegex.test(url.trim());
  }
};

/**
 * Validate year format (4 digits)
 */
export const isValidYear = (year) => {
  if (!year) return false;

  const yearStr = String(year).trim();
  const yearNum = parseInt(yearStr, 10);

  return /^\d{4}$/.test(yearStr) && yearNum >= 1950 && yearNum <= 2100;
};

// ====================================================================
// TEXT PROCESSING
// ====================================================================

/**
 * Extract list items from text (handles bullets, numbers, commas)
 */
export const extractListItems = (text) => {
  if (!text || typeof text !== "string") return [];

  // Remove common bullet points and numbering
  let cleaned = text
    .replace(/^[\d\.\)\-\*•]\s*/gm, "") // Remove bullets/numbers at start
    .replace(/[\r\n]+/g, ","); // Replace newlines with commas

  // Split by comma and clean
  return cleaned
    .split(",")
    .map(item => item.trim())
    .filter(item => item.length > 0 && item !== "__SKIPPED__");
};

/**
 * Normalize date string to consistent format
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";

  const str = dateStr.trim();

  // Check for "Present" or similar
  if (/^(present|current|now|ongoing)$/i.test(str)) {
    return "Present";
  }

  // Check for year only (4 digits)
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  // Check for month and year (e.g., "Jan 2024", "January 2024", "01/2024")
  const monthYearMatch = str.match(/([a-z]+|\d{1,2})[\s\/\-](\d{4})/i);
  if (monthYearMatch) {
    return str; // Keep as provided
  }

  return str; // Return as-is if no pattern matches
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str) => {
  if (!str || typeof str !== "string") return "";

  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ====================================================================
// RESUME ANALYTICS
// ====================================================================

/**
 * Calculate resume completion percentage
 */
export const calculateCompletionPercentage = (resumeData) => {
  const weights = {
    personal: 30,
    education: 20,
    experience: 25,
    projects: 10,
    skills: 15
  };

  let totalScore = 0;
  let maxScore = 0;

  // Personal section
  maxScore += weights.personal;
  const requiredPersonalFields = ["name", "email", "phone"];
  const personalComplete = requiredPersonalFields.every(
    field => resumeData.personal?.[field]?.trim()
  );
  if (personalComplete) {
    totalScore += weights.personal;
  }

  // Education section
  maxScore += weights.education;
  if (resumeData.education?.length > 0) {
    totalScore += weights.education;
  }

  // Experience section
  maxScore += weights.experience;
  if (resumeData.experience?.length > 0) {
    totalScore += weights.experience;
  }

  // Projects section
  maxScore += weights.projects;
  if (resumeData.projects?.length > 0) {
    totalScore += weights.projects;
  }

  // Skills section
  maxScore += weights.skills;
  if (
    resumeData.skills?.languages?.length > 0 ||
    resumeData.skills?.technologies?.length > 0 ||
    resumeData.skills?.customSkills?.some(cs => cs.items?.length > 0)
  ) {
    totalScore += weights.skills;
  }

  return Math.round((totalScore / maxScore) * 100);
};

/**
 * Get missing required fields
 */
export const getMissingRequiredFields = (resumeData) => {
  const missing = [];

  // Personal required fields
  const requiredPersonal = ["name", "email", "phone"];
  requiredPersonal.forEach(field => {
    if (!resumeData.personal?.[field]?.trim()) {
      missing.push({ section: "personal", field });
    }
  });

  // At least one education
  if (!resumeData.education?.length) {
    missing.push({ section: "education", field: "first_entry" });
  }

  // At least one skill category
  if (
    !resumeData.skills?.languages?.length &&
    !resumeData.skills?.technologies?.length &&
    !resumeData.skills?.customSkills?.some(cs => cs.items?.length > 0)
  ) {
    missing.push({ section: "skills", field: "languages_or_technologies" });
  }

  return missing;
};

// ====================================================================
// EXPORT
// ====================================================================

export default {
  // Mock data
  isMockData,
  cleanMockData,

  // Skip detection
  isSkipRequest,

  // Groq API
  getRandomModel,
  callGroqAPI,

  // Validation
  isValidEmail,
  isValidPhone,
  isValidURL,
  isValidYear,

  // Text processing
  extractListItems,
  normalizeDate,
  titleCase,

  // Analytics
  calculateCompletionPercentage,
  getMissingRequiredFields
};

// ====================================================================
// LEGACY SUPPORT (Restored for chat.controllers.js compatibility)
// ====================================================================

import dotenv from "dotenv";
import { getGroqApiKey } from "./apiKeyManager.js";
dotenv.config();

const getSystemPrompt = (currentSection, currentField, collectedData) => {
  return `You are "ResumeAI", an expert career coach helping users build professional resumes.
CURRENT CONTEXT: Section: ${currentSection}, Field: ${currentField}.
Adjust your questions accordingly.`;
};

const getNextQuestion = (currentSection, currentField) => {
  return `Could you tell me about your ${currentField}?`;
};

export const extractDataFromMessage = async (userMessage, expectedField, currentSection) => {
  if (isSkipRequest(userMessage)) return "SKIP";

  const prompt = `Extract "${expectedField}" from: "${userMessage}". Return ONLY the value. If not found, return SKIP.`;
  const messages = [{ role: "user", content: prompt }];

  try {
    const result = await callGroqAPI(messages, getGroqApiKey());
    if (!result || isSkipRequest(result)) return "SKIP";
    return result.replace(/^(the |a |an |my |i am |i'm |it is |it's |this is )/i, '').trim();
  } catch (e) {
    console.error("Extraction error:", e);
    return userMessage; // Fallback
  }
};

export const getAIResponse = async (userMessage, conversationState, collectedData, chatHistory) => {
  const { currentSection, currentField } = conversationState;

  // Simple fallback logic to keep server running
  if (userMessage === "start") {
    return "Hi! I'm ResumeAI. What's your full name?";
  }

  const prompt = getSystemPrompt(currentSection, currentField, collectedData);
  const messages = [
    { role: "system", content: prompt },
    ...chatHistory.slice(-5).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: userMessage }
  ];

  try {
    const response = await callGroqAPI(messages, getGroqApiKey());
    return response || getNextQuestion(currentSection, currentField);
  } catch (e) {
    return getNextQuestion(currentSection, currentField);
  }
};