import fetch from "node-fetch";
import { MOCK_RESUME_DATA } from "./mockData.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; // Using larger model for better intelligence

// ============================================================================
// AGENT SYSTEM - Intelligent Resume Builder
// ============================================================================

/**
 * Main Agent Class - Handles intelligent conversation and data extraction
 */
class ResumeAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.conversationHistory = [];
  }

  /**
   * Call Groq API with tool support
   */
  async callGroq(messages, tools = null, toolChoice = "auto") {
    const payload = {
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
    };

    if (tools) {
      payload.tools = tools;
      payload.tool_choice = toolChoice;
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });



      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message;
    } catch (error) {
      console.error("Groq API error:", error);
      throw error;
    }
  }

  /**
   * Optimize content for ATS (Action verbs, metrics, keywords)
   */
  async optimizeForATS(content, contentType = "highlight") {
    const prompt = `You are an expert ATS (Applicant Tracking System) optimizer and professional resume writer.

TASK: Optimize the following ${contentType} to be ATS-friendly and impactful.

RULES:
1. Start with strong action verbs (Led, Developed, Implemented, Achieved, Designed, etc.)
2. Include quantifiable metrics when possible (%, numbers, time saved, revenue)
3. Use industry-standard keywords
4. Keep it concise (1-2 lines for highlights, 2-3 lines for descriptions)
5. Focus on impact and results
6. DO NOT add fake numbers - only suggest where metrics could go
7. Use professional, active language
8. Optimize length: if too long, condense; if too short, expand with value

Original content: "${content}"

Return ONLY the optimized version, nothing else.`;

    const messages = [
      {
        role: "system",
        content: "You are an expert resume writer specializing in ATS optimization.",
      },
      { role: "user", content: prompt },
    ];

    const response = await this.callGroq(messages);
    return response.content || content;
  }

  /**
   * Intelligent Multi-field Extraction
   * Extracts ALL fields mentioned in a message, not just the expected one
   */
  async extractMultipleFields(userMessage, currentSection, collectedData) {
    const tools = [
      {
        type: "function",
        function: {
          name: "extract_resume_data",
          description: "Extract resume information from user message. Can extract multiple fields at once.",
          parameters: {
            type: "object",
            properties: {
              extracted_fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    section: {
                      type: "string",
                      enum: ["personal", "education", "experience", "projects", "skills", "achievements"],
                      description: "Which section this data belongs to",
                    },
                    field: {
                      type: "string",
                      description: "Field name (e.g., name, email, company, position)",
                    },
                    value: {
                      type: "string",
                      description: "Extracted value",
                    },
                    arrayIndex: {
                      type: "number",
                      description: "For array sections (education, experience, projects), which entry (0 for first)",
                      default: 0,
                    },
                  },
                  required: ["section", "field", "value"],
                },
              },
              update_request: {
                type: "boolean",
                description: "True if user wants to UPDATE existing data",
              },
              user_wants_to_skip: {
                type: "boolean",
                description: "True if user says skip, pass, next, etc.",
              },
            },
            required: ["extracted_fields"],
          },
        },
      },
    ];

    const extractionPrompt = `You are a data extraction assistant. Extract ALL resume-related information from the user's message.

CURRENT CONTEXT:
- Current section: ${currentSection}
- Data collected so far: ${JSON.stringify(collectedData, null, 2)}

USER MESSAGE: "${userMessage}"

EXTRACTION RULES:
1. Extract ALL fields mentioned, even if they're from different sections
2. Example: "I'm John Doe, email john@email.com, I work at Google" → Extract name, email, company
3. Handle updates: "update my email to new@email.com" or "change company to Microsoft"
4. For lists (highlights, skills): split by commas or bullet points
5. Detect skip/pass requests
6. Be intelligent about context (if talking about work experience, company/position are likely mentioned)
7. Clean extracted values (remove phrases like "my name is", "I work at", etc.)

Examples:
- "I'm Raghav Kumar from Panipat" → [{section: "personal", field: "name", value: "Raghav Kumar"}, {section: "personal", field: "location", value: "Panipat"}]
- "I worked at Google as Software Engineer from 2020 to 2023" → [{section: "experience", field: "company", value: "Google", arrayIndex: 0}, {section: "experience", field: "position", value: "Software Engineer", arrayIndex: 0}, {section: "experience", field: "startDate", value: "2020", arrayIndex: 0}, {section: "experience", field: "endDate", value: "2023", arrayIndex: 0}]
- "Update my email to raghav@gmail.com" → [{section: "personal", field: "email", value: "raghav@gmail.com"}], update_request: true

Call the extract_resume_data function with the extracted information.`;

    const messages = [
      {
        role: "system",
        content: "You are an intelligent data extraction assistant that can extract multiple fields from a single message.",
      },
      { role: "user", content: extractionPrompt },
    ];

    try {
      const response = await this.callGroq(messages, tools, "auto");

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        const extractedData = JSON.parse(toolCall.function.arguments);
        return extractedData;
      }

      return { extracted_fields: [], user_wants_to_skip: false, update_request: false };
    } catch (error) {
      console.error("Extraction error:", error);
      return { extracted_fields: [], user_wants_to_skip: false, update_request: false };
    }
  }

  /**
   * Generate next question based on what's missing
   */
  async generateNextQuestion(collectedData, conversationHistory) {
    const missingFields = this.analyzeMissingFields(collectedData);

    if (missingFields.length === 0) {
      return {
        message: "🎉 Great! I have all the information I need. Your resume is ready to be generated!",
        isComplete: true,
        nextSection: "complete",
        nextField: "complete",
      };
    }

    const nextField = missingFields[0];

    const prompt = `You are "AI Resume Agent", a friendly and professional career coach helping users build their resume.

CONVERSATION CONTEXT:
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

CURRENT TASK:
- Section: ${nextField.section.toUpperCase()}
- Field: ${nextField.field.toUpperCase()}
- Description: ${nextField.description}

DATA COLLECTED SO FAR:
${JSON.stringify(collectedData, null, 2)}

INSTRUCTIONS:
1. **Be conversational and warm**: Acknowledge their previous answer if applicable but dont make message long
2. **Ask ONE clear question** for the next field needed
3. **Provide context**: Briefly explain why this field is important
4. **Give examples** when helpful (e.g., "like Python, JavaScript")
5. **Make it optional** if it's an optional field (mention they can skip)
6. **Use emojis sparingly** to keep it friendly
7. **Be encouraging**: Make them feel confident

Generate a short, punchy question for the ${nextField.field} field.`;

    const messages = [
      {
        role: "system",
        content: "You are a friendly AI resume coach. You speak in short, concise sentences. No long paragraphs.",
      },
      { role: "user", content: prompt },
    ];

    const response = await this.callGroq(messages);

    return {
      message: response.content,
      isComplete: false,
      nextSection: nextField.section,
      nextField: nextField.field,
      isArray: nextField.isArray,
      arrayIndex: nextField.arrayIndex,
    };
  }

  /**
   * Analyze what fields are missing in order of priority
   */
  analyzeMissingFields(collectedData) {
    // Flatten mock data into a Set of strings for easy lookup
    const mockValuesSet = new Set();
    const collectMockValues = (obj) => {
      if (!obj) return;
      if (typeof obj === "string") {
        mockValuesSet.add(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(collectMockValues);
      } else if (typeof obj === "object") {
        Object.values(obj).forEach(collectMockValues);
      }
    };
    collectMockValues(MOCK_RESUME_DATA);

    const isMock = (val) => {
      if (!val) return false;
      if (typeof val === 'string') return mockValuesSet.has(val);
      // If it's an array (like skills), check if *all* items are mock items (maybe just 1 is enough to be suspicious?)
      // Let's say if it's an exact match of string representation it's definitely mock, but that's hard.
      // Safer: if the value is a string, check set.
      return false;
    };

    const fieldDefinitions = [
      // Personal Info (Required)
      { section: "personal", field: "name", description: "Full name", required: true },
      { section: "personal", field: "email", description: "Email address", required: true },
      { section: "personal", field: "phone", description: "Phone number", required: true },
      { section: "personal", field: "location", description: "Location (City, State/Country)", required: true },
      { section: "personal", field: "linkedin", description: "LinkedIn profile URL", required: false },
      { section: "personal", field: "github", description: "GitHub profile URL", required: false },
      { section: "personal", field: "website", description: "Personal website/portfolio", required: false },

      // Education (Required - at least one)
      { section: "education", field: "institution", description: "University/School name", required: true, isArray: true, arrayIndex: 0 },
      { section: "education", field: "degree", description: "Degree and major", required: true, isArray: true, arrayIndex: 0 },
      { section: "education", field: "startDate", description: "Start date", required: true, isArray: true, arrayIndex: 0 },
      { section: "education", field: "endDate", description: "End date (or expected)", required: true, isArray: true, arrayIndex: 0 },
      { section: "education", field: "gpa", description: "GPA (optional)", required: false, isArray: true, arrayIndex: 0 },
      { section: "education", field: "coursework", description: "Relevant coursework", required: false, isArray: true, arrayIndex: 0 },

      // Experience (Optional but recommended)
      { section: "experience", field: "company", description: "Company name", required: false, isArray: true, arrayIndex: 0 },
      { section: "experience", field: "position", description: "Job title/position", required: false, isArray: true, arrayIndex: 0 },
      { section: "experience", field: "location", description: "Job location", required: false, isArray: true, arrayIndex: 0 },
      { section: "experience", field: "startDate", description: "Start date", required: false, isArray: true, arrayIndex: 0 },
      { section: "experience", field: "endDate", description: "End date (or Present)", required: false, isArray: true, arrayIndex: 0 },
      { section: "experience", field: "highlights", description: "Key responsibilities and achievements", required: false, isArray: true, arrayIndex: 0 },

      // Projects (Recommended)
      { section: "projects", field: "name", description: "Project name", required: false, isArray: true, arrayIndex: 0 },
      { section: "projects", field: "link", description: "Project link (GitHub/Demo)", required: false, isArray: true, arrayIndex: 0 },
      { section: "projects", field: "date", description: "Project date", required: false, isArray: true, arrayIndex: 0 },
      { section: "projects", field: "highlights", description: "Project description", required: false, isArray: true, arrayIndex: 0 },
      { section: "projects", field: "technologies", description: "Technologies used", required: false, isArray: true, arrayIndex: 0 },

      // Skills (Required)
      { section: "skills", field: "languages", description: "Programming languages", required: true },
      { section: "skills", field: "technologies", description: "Frameworks and tools", required: true },

      // Achievements (Optional)
      { section: "achievements", field: "items", description: "Achievements and awards", required: false },
    ];

    const missingFields = [];

    for (const fieldDef of fieldDefinitions) {
      const { section, field, isArray, arrayIndex } = fieldDef;

      let isMissing = false;



      if (section === "personal") {
        const val = collectedData.personal?.[field];
        isMissing = !val || val === "undefined" || String(val).trim() === "" || isMock(val);
      } else if (section === "skills") {
        isMissing = !collectedData.skills?.[field] || collectedData.skills[field].length === 0;
      } else if (section === "achievements") {
        isMissing = !collectedData.achievements || collectedData.achievements.length === 0;
      } else if (isArray) {
        const sectionData = collectedData[section];
        // console.log(`[Agent-Debug] Section ${section} data:`, JSON.stringify(sectionData));
        if (!sectionData || sectionData.length === 0) {
          isMissing = true;
        } else {
          const entry = sectionData[arrayIndex || 0];
          const val = entry?.[field];
          // console.log(`[Agent-Debug] Checking ${section}[${arrayIndex}].${field}. Value: '${val}'`);

          if (!entry || !val || val === "undefined" || (Array.isArray(val) && val.length === 0) || String(val).trim() === "" || isMock(val)) {
            isMissing = true;
          }
        }
      }

      // Only add required fields or first optional field per section
      if (isMissing && (fieldDef.required || missingFields.filter(f => f.section === section).length === 0)) {

        missingFields.push(fieldDef);
      }
    }


    return missingFields;
  }

  /**
   * Process user message and update database intelligently
   */
  async processMessage(userMessage, currentData, conversationHistory) {
    // Step 1: Extract all fields from message
    const extractionResult = await this.extractMultipleFields(
      userMessage,
      conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].nextSection : "personal",
      currentData
    );

    // Step 2: Update data intelligently
    const updatedData = JSON.parse(JSON.stringify(currentData)); // Deep clone
    let optimizationPromises = [];

    for (const extracted of extractionResult.extracted_fields) {
      const { section, field, value, arrayIndex = 0 } = extracted;

      if (section === "personal") {
        updatedData.personal = updatedData.personal || {};
        updatedData.personal[field] = value;
      } else if (section === "skills") {
        updatedData.skills = updatedData.skills || {};
        const items = value.split(",").map((s) => s.trim()).filter(Boolean);
        updatedData.skills[field] = items;
      } else if (section === "achievements") {
        updatedData.achievements = updatedData.achievements || [];
        const items = value.split(",").map((s) => s.trim()).filter(Boolean);
        updatedData.achievements.push(...items);
      } else if (["education", "experience", "projects"].includes(section)) {
        updatedData[section] = updatedData[section] || [];

        // Ensure entry exists
        while (updatedData[section].length <= arrayIndex) {
          updatedData[section].push({});
        }

        // Handle array fields (highlights, coursework, technologies)
        if (["highlights", "coursework", "technologies"].includes(field)) {
          const items = value.split(",").map((s) => s.trim()).filter(Boolean);
          updatedData[section][arrayIndex][field] = items;

          // Auto-optimize highlights for experience/projects
          if (field === "highlights" && (section === "experience" || section === "projects")) {
            for (let i = 0; i < items.length; i++) {
              optimizationPromises.push(
                this.optimizeForATS(items[i], section === "experience" ? "highlight" : "project_description")
                  .then(optimized => {
                    updatedData[section][arrayIndex][field][i] = optimized;
                  })
              );
            }
          }
        } else {
          updatedData[section][arrayIndex][field] = value;
        }
      }
    }

    // Wait for all optimizations to complete
    await Promise.all(optimizationPromises);

    // Step 3: Generate next question
    const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory);

    return {
      updatedData,
      extractedFields: extractionResult.extracted_fields,
      nextQuestion: nextQuestion.message,
      isComplete: nextQuestion.isComplete,
      nextSection: nextQuestion.nextSection,
      nextField: nextQuestion.nextField,
      wasUpdate: extractionResult.update_request,
      wasSkipped: extractionResult.user_wants_to_skip,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ResumeAgent;

export const createAgent = (apiKey) => {
  return new ResumeAgent(apiKey);
};