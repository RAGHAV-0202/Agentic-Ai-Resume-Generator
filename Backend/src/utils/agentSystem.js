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
4. For lists (highlights, skills, coursework): 
   - Split by commas, bullet points, OR newlines using "\n"
   - CRITICAL: If the user provides a paragraph for 'highlights', split it into separate sentences/points.
5. Detect skip/pass requests
6. Be intelligent about context (if talking about work experience, company/position are likely mentioned)
7. Clean extracted values (remove phrases like "my name is", "I work at", etc.)

Examples:
- "I'm Raghav Kapoora from Panipat" → [{section: "personal", field: "name", value: "Raghav Kapoor"}, {section: "personal", field: "location", value: "Panipat"}]
- "I worked at Google as Software Engineer from 2020 to 2023" → [{section: "experience", field: "company", value: "Google", arrayIndex: 0}, {section: "experience", field: "position", value: "Software Engineer", arrayIndex: 0}, {section: "experience", field: "startDate", value: "2020", arrayIndex: 0}, {section: "experience", field: "endDate", value: "2023", arrayIndex: 0}]
- dont got to arrayIndex : 1 , unless you ask "add more experience" or "add more projects" or "add more education" and user agrees
- "highlights: I built a website. I optimized the backend. I led a team." → [{section: "experience", field: "highlights", value: "I built a website. (optimize content add more as per yourself in this), I optimized the backend., I led a team", arrayIndex: 0}] 
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
  async generateNextQuestion(collectedData, conversationHistory, forceSkip = false, currentSection = "personal") {
    const missingFields = this.analyzeMissingFields(collectedData);

    let currentMissingFields = [...missingFields];

    if (forceSkip && currentMissingFields.length > 0) {
      // Check if we are skipping an array field that is basically part of the same section
      // If we skip "gpa", we just go to "coursework".
      // If we skip the LAST field of a section, we go to NEXT section.
      // This is handled automatically by the order of missingFields.

      // However, loop prevention:
      // logic in analyzeMissingFields might stubbornly return the same field if not marked skipped.
      // We are relying on the fact that if we force skip, we pick index 1.

      // What if index 1 is ALSO effectively the same (e.g. part of same blocked entry)?
      // It should be fine.

      // Simple heuristic: If we force skip, we discard the first suggestion.
      if (currentMissingFields.length > 1) {
        currentMissingFields.shift();
      } else {
        // If we force skip the LAST field of ALL, we are done.
        return {
          message: "🎉 Great! I have all the information I need. Your resume is ready to be generated!",
          isComplete: true,
          nextSection: "complete",
          nextField: "complete",
        };
      }
    }

    if (currentMissingFields.length === 0) {
      return {
        message: "🎉 Great! I have all the information I need. Your resume is ready to be generated!",
        isComplete: true,
        nextSection: "complete",
        nextField: "complete",
      };
    }

    let nextField = currentMissingFields[0];

    // ✅ ADD MORE DETECTION (User Request: "it should ask first add more for adding more than one education , experience etc")
    // Logic: If we are switching SECTIONS, checks if the previous section (currentSection) was an Array section.
    // If so, and we are not explicitly forcing skip/moving on, we should interject.

    const arraySections = ["education", "experience", "projects"];

    // If we detect we are done with the current section (nextField is different), 
    // AND currentSection is an array section
    // AND we haven't asked "add more" yet (controlled by caller state, but we can't see it here easily without passing it).
    // Actually, expecting the caller to handle "Yes/No" logic means we only trigger this question ONCE.
    // If we return a "pendingArrayAddition" flag, the caller will ensure next time we come here, we've moved past it?
    // No, if user said "No", caller sets pending=false. We come back here.
    // We see NextField is still different. We see CurrentSection is Array.
    // We would trigger it AGAIN. Infinite loop to "Add more?".

    // Fix: We need to know if we are "allowed" to leave the section.
    // If user said "No" (skip add more), the caller should probably have updated `currentSection` to the `nextSection`.
    // OR call this, get this result, and ignore it if we just asked?

    // Let's assume the standard behavior is to ask.
    // The controller manages the "I already asked" state by advancing the section in the DB *if* the user decliners.

    if (currentSection && nextField.section !== currentSection && arraySections.includes(currentSection)) {
      // We are about to leave an array section.
      // Assume we need to ask "Add more?".

      // NOTE: The Caller (Controller) is responsible for:
      // 1. If user says "No" to add more -> Update `resume.conversationState.currentSection` to `nextField.section` BEFORE calling this?
      //    OR call this, get this result, and ignore it if we just asked?

      // Let's assume the standard behavior is to ask.
      // The controller manages the "I already asked" state by advancing the section in the DB *if* the user decliners.

      return {
        message: `Would you like to add another entry for ${currentSection}? (Yes/No)`,
        isComplete: false,
        nextSection: currentSection, // Stay in current section
        nextField: "add_more",
        isPendingArrayAddition: true
      };
    }

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
      isArray: nextField.isArray, // Note: new logic removed isArray from defs in analyzeMissingFields, but we might want to preserve it or re-derive it?
      // analyzeMissingFields returns the full def, so if we kept it in defs (we did), it's here.
      // Wait, my replacement for analyzeMissingFields kept 'isArray' in definitions. YES.
      arrayIndex: nextField.arrayIndex,
    };
  }

  /**
   * Analyze what fields are missing in order of priority
   */
  /**
   * Analyze what fields are missing in order of priority
   * Prioritizes the current section to prevent jumping back and forth
   */
  analyzeMissingFields(collectedData, currentSection = null) {
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
      return false;
    };

    const isMissingValue = (val) => {
      // If it's explicitly skipped, it's NOT missing
      if (val === "__SKIPPED__") return false;

      return !val || val === "undefined" || (Array.isArray(val) && val.length === 0) || String(val).trim() === "" || isMock(val);
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
      { section: "education", field: "institution", description: "University/School name", required: true, isArray: true },
      { section: "education", field: "degree", description: "Degree and major", required: true, isArray: true },
      { section: "education", field: "startDate", description: "Start date", required: true, isArray: true },
      { section: "education", field: "endDate", description: "End date (or expected)", required: true, isArray: true },
      { section: "education", field: "gpa", description: "GPA (optional)", required: false, isArray: true },
      { section: "education", field: "coursework", description: "Relevant coursework", required: false, isArray: true },

      // Experience (Optional but recommended)
      { section: "experience", field: "company", description: "Company name", required: false, isArray: true },
      { section: "experience", field: "position", description: "Job title/position", required: false, isArray: true },
      { section: "experience", field: "location", description: "Job location", required: false, isArray: true },
      { section: "experience", field: "startDate", description: "Start date", required: false, isArray: true },
      { section: "experience", field: "endDate", description: "End date (or Present)", required: false, isArray: true },
      { section: "experience", field: "highlights", description: "Key responsibilities and achievements", required: false, isArray: true },

      // Projects (Recommended)
      { section: "projects", field: "name", description: "Project name", required: false, isArray: true },
      { section: "projects", field: "link", description: "Project link (GitHub/Demo)", required: false, isArray: true },
      { section: "projects", field: "date", description: "Project date", required: false, isArray: true },
      { section: "projects", field: "highlights", description: "Project description", required: false, isArray: true },
      { section: "projects", field: "technologies", description: "Technologies used", required: false, isArray: true },

      // Skills (Required)
      { section: "skills", field: "languages", description: "Programming languages", required: true },
      { section: "skills", field: "technologies", description: "Frameworks and tools", required: true },

      // Achievements (Optional)
      { section: "achievements", field: "items", description: "Achievements and awards", required: false },
    ];

    let missingFields = [];

    // Logic:
    // 1. If we have a currentSection, ONLY check that section first.
    // 2. If valid fields are missing in currentSection, return those immediately.
    // 3. If currentSection is complete (or not provided), scan all sections in order.

    // Function to scan a specific section
    const scanSection = (sectionName) => {
      const foundMissing = [];
      const sectionDefs = fieldDefinitions.filter(f => f.section === sectionName);

      if (["education", "experience", "projects"].includes(sectionName)) {
        const sectionData = collectedData[sectionName] || [];
        // Always check at least the first item or existing items
        const count = Math.max(1, sectionData.length);

        for (let i = 0; i < count; i++) {
          const entry = sectionData[i] || {};
          for (const fieldDef of sectionDefs) {
            const val = entry[fieldDef.field];
            if (isMissingValue(val)) {
              foundMissing.push({ ...fieldDef, arrayIndex: i });
            }
          }
        }
      } else {
        // Simple sections
        for (const fieldDef of sectionDefs) {
          const { section, field } = fieldDef;
          let val;
          if (section === "personal") val = collectedData.personal?.[field];
          else if (section === "skills") val = collectedData.skills?.[field];
          else if (section === "achievements") val = collectedData.achievements;

          if (isMissingValue(val)) {
            foundMissing.push(fieldDef);
          }
        }
      }
      return foundMissing;
    };

    // Phase 1: Check Current Section Priority
    if (currentSection) {
      const currentSectionMissing = scanSection(currentSection);
      if (currentSectionMissing.length > 0) {
        // If we found missing fields in current context, return ONLY them to stay focused
        return currentSectionMissing;
      }
    }

    // Phase 2: Global Scan (if current section is done or not set)
    const sections = ["personal", "education", "experience", "projects", "skills", "achievements"];

    // Optimization: If we just finished 'currentSection', we should start scanning from the NEXT section to the end, 
    // then wrap around to the beginning (to fill skips)? 
    // Or just scan linearly? Linear scan is safest to ensure 'personal' is filled.
    // But to prevent "backtracking" to optional fields we skipped:
    // We already handle "__SKIPPED__". So linear scan is fine, assuming skipped fields are marked.
    // If they aren't marked skipped, we WILL loop back.
    // But since we prioritize currentSection, we won't loop back UNTIL we leave the current section.

    for (const section of sections) {
      if (section === currentSection) continue; // Already checked
      missingFields = missingFields.concat(scanSection(section));
    }

    return missingFields;
  }

  /**
   * Process user message and update database intelligently
   */
  /**
   * Process user message and update database intelligently
   */
  async processMessage(userMessage, currentData, conversationHistory, conversationState = {}) {
    // Check for "Add More" Confirmation if pending
    if (conversationState.pendingArrayAddition) {
      // Simple heuristic for Yes/No
      const lowerMsg = userMessage.toLowerCase().trim();
      const yesPatterns = [/^yes/i, /^sure/i, /^ok/i, /^yep/i, /^yeah/i, /^add/i, /^one more/i];
      const isYes = yesPatterns.some(p => p.test(lowerMsg));

      const updatedData = JSON.parse(JSON.stringify(currentData));
      const currentSection = conversationState.currentSection;

      if (isYes) {
        // Add empty item
        updatedData[currentSection] = updatedData[currentSection] || [];
        updatedData[currentSection].push({});

        // Generate next question for this new item
        const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory, false, currentSection);

        return {
          updatedData,
          extractedFields: [],
          nextQuestion: nextQuestion.message,
          isComplete: false,
          nextSection: currentSection,
          nextField: nextQuestion.nextField,
          wasUpdate: false,
          wasSkipped: false,
          pendingArrayAddition: false // Reset flag
        };
      } else {
        // No, move on
        // We need to force move to next section
        // generateNextQuestion with currentSection passed in checks for transition
        // But since we are here, we know we want to transition.

        // We rely on generateNextQuestion detecting the transition naturally.
        // BUT, if we pass currentSection as "education", it triggers "Add more" loop.
        // We need to pass the NEXT section.

        // How do we know the next section? analyzeMissingFields knows.
        const missing = this.analyzeMissingFields(updatedData);
        const nextField = missing[0]; // Should be in next section since current is full
        const nextSection = nextField ? nextField.section : "complete";

        // Generate question for the NEXT section directly
        const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory, false, nextSection);

        return {
          updatedData,
          extractedFields: [],
          nextQuestion: nextQuestion.message,
          isComplete: nextQuestion.isComplete,
          nextSection: nextQuestion.nextSection,
          nextField: nextQuestion.nextField,
          wasUpdate: false,
          wasSkipped: false,
          pendingArrayAddition: false // Reset flag
        };
      }
    }

    // Step 1: Extract all fields from message
    const extractionResult = await this.extractMultipleFields(
      userMessage,
      conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].nextSection : "personal",
      // If we provided conversationState, we could use that. currentSection is safer.
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
          let items = [];

          // Split by comma or semicolon
          if (typeof value === 'string') {
            // If it's a long paragraph (highlights), try splitting by periods too
            if (field === 'highlights' && value.length > 50 && !value.includes(',')) {
              items = value.split(/[.;\n]+/).map(s => s.trim()).filter(Boolean);
            } else {
              items = value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
            }
          } else if (Array.isArray(value)) {
            items = value;
          }

          updatedData[section][arrayIndex][field] = items;

          // Auto-optimize highlights for experience/projects
          if (field === "highlights" && (section === "experience" || section === "projects")) {
            for (let i = 0; i < items.length; i++) {
              optimizationPromises.push(
                this.optimizeForATS(items[i], section === "experience" ? "highlight" : "project_description")
                  .then(optimized => {
                    updatedData[section][arrayIndex][field][i] = optimized;
                  })
                  .catch(err => {
                    console.error("Optimization failed for item:", i, err);
                    // Keep original value on error
                    updatedData[section][arrayIndex][field][i] = items[i];
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
    // Pass currentSection from state to allow transition detection
    const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory, false, conversationState.currentSection);

    return {
      updatedData,
      extractedFields: extractionResult.extracted_fields,
      nextQuestion: nextQuestion.message,
      isComplete: nextQuestion.isComplete,
      nextSection: nextQuestion.nextSection,
      nextField: nextQuestion.nextField,
      wasUpdate: extractionResult.update_request,
      wasSkipped: extractionResult.user_wants_to_skip,
      pendingArrayAddition: nextQuestion.isPendingArrayAddition || false
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