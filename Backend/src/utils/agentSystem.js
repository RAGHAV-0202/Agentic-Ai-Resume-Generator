import fetch from "node-fetch";

// ====================================================================
// VALIDATED GROQ MODEL POOL
// ====================================================================
// Only use models that are confirmed to work with Groq API
const VALIDATED_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];



const getRandomModel = () =>
  VALIDATED_GROQ_MODELS[Math.floor(Math.random() * VALIDATED_GROQ_MODELS.length)];

// ====================================================================
// RESUME DATA SCHEMA
// ====================================================================
const RESUME_SCHEMA = {
  personal: {
    required: ["name", "email", "phone"],
    optional: ["location", "linkedin", "github", "website"],
    type: "object"
  },
  education: {
    required: ["institution", "degree", "startDate", "endDate"],
    optional: ["gpa", "coursework", "location"],
    type: "array"
  },
  experience: {
    required: ["company", "position", "startDate", "endDate"],
    optional: ["location", "highlights"],
    type: "array"
  },
  projects: {
    required: ["name", "date"],
    optional: ["link", "highlights", "technologies"],
    type: "array"
  },
  skills: {
    required: ["languages", "technologies"],
    optional: [],
    type: "object"
  },
  achievements: {
    required: [],
    optional: ["list"],
    type: "array"
  }
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Check if a value is valid (not empty, not skipped, not mock data)
 */
const isValidValue = (val) => {
  if (!val) return false;
  if (val === "__SKIPPED__" || val === "skip") return false;
  if (typeof val === "string" && val.trim() === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
};

/**
 * Get the current active index for array sections
 * This is crucial for preventing overwrites and loops
 */
const getActiveArrayIndex = (sectionData) => {
  if (!Array.isArray(sectionData) || sectionData.length === 0) {
    return 0; // First entry
  }

  // Find the last incomplete entry
  const lastIndex = sectionData.length - 1;
  const lastEntry = sectionData[lastIndex];

  // If last entry has any data, it's being worked on
  if (lastEntry && Object.keys(lastEntry).length > 0) {
    return lastIndex;
  }

  return lastIndex;
};

/**
 * Check if an array entry is complete
 */
const isArrayEntryComplete = (entry, requiredFields) => {
  if (!entry) return false;
  return requiredFields.every(field => isValidValue(entry[field]));
};

// ====================================================================
// MAIN AGENT CLASS
// ====================================================================

class ResumeAgentV2 {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  }

  // ------------------------------------------------------------------
  // GROQ API CALLER
  // ------------------------------------------------------------------
  async callGroq(messages, tools = null, toolChoice = "auto", temperature = 0.5) {
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

    try {
      const response = await fetch(this.GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Groq API Error (${response.status}):`, errText);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message;
    } catch (error) {
      console.error("❌ Groq API Call Failed:", error.message);
      throw error;
    }
  }

  // ------------------------------------------------------------------
  // ATS CONTENT OPTIMIZER
  // ------------------------------------------------------------------
  async optimizeForATS(content, contentType = "highlight") {
    const prompt = `Optimize this ${contentType} for ATS and impact:

Original: "${content}"

Requirements:
- Start with a strong action verb
- Be specific and quantifiable where possible
- Keep it concise (1-2 lines max)
- Focus on impact and results
- Don't add fake metrics

Return ONLY the optimized version.`;

    const messages = [
      {
        role: "system",
        content: "You are an expert resume writer. Return only the optimized text, nothing else."
      },
      { role: "user", content: prompt }
    ];

    try {
      const response = await this.callGroq(messages, null, "auto", 0.3);
      return response.content?.trim() || content;
    } catch (error) {
      console.error("⚠️  Optimization failed, using original:", error.message);
      return content;
    }
  }

  // ------------------------------------------------------------------
  // SMART FIELD EXTRACTION WITH EXPLICIT INDEX TRACKING
  // ------------------------------------------------------------------
  async extractMultipleFields(userMessage, currentState, collectedData) {
    const { currentSection, currentField } = currentState;

    // Determine the correct array index
    let targetIndex = 0;
    if (RESUME_SCHEMA[currentSection]?.type === "array") {
      const sectionData = collectedData[currentSection] || [];
      targetIndex = getActiveArrayIndex(sectionData);
    }

    const tools = [{
      type: "function",
      function: {
        name: "extract_resume_data",
        description: "Extract resume information from user message",
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
                    enum: ["personal", "education", "experience", "projects", "skills", "achievements"]
                  },
                  field: { type: "string" },
                  value: { type: "string" },
                  arrayIndex: {
                    type: "number",
                    description: `Current working index is ${targetIndex}. Use this for updates to current entry.`
                  }
                },
                required: ["section", "field", "value"]
              }
            },
            user_wants_to_skip: { type: "boolean", default: false }
          },
          required: ["extracted_fields"]
        }
      }
    }];

    const extractionPrompt = `Extract resume data from: "${userMessage}"

CURRENT CONTEXT:
- Section: ${currentSection}
- Field: ${currentField}
- Active Array Index: ${targetIndex}
- Existing Data for this entry: ${JSON.stringify(collectedData[currentSection]?.[targetIndex] || {}, null, 2)}

CRITICAL RULES:
1. If updating the CURRENT entry, use arrayIndex: ${targetIndex}
2. If the user explicitly mentions adding a NEW item, use arrayIndex: ${targetIndex + 1}
3. Extract ALL mentioned fields in a single call
4. Set user_wants_to_skip: true only if user explicitly says "skip", "pass", "next"

Extract now:`;

    const messages = [
      { role: "system", content: "You are a precise data extraction assistant for resume building." },
      { role: "user", content: extractionPrompt }
    ];

    try {
      const response = await this.callGroq(messages, tools, "required");

      if (response.tool_calls?.[0]) {
        const args = JSON.parse(response.tool_calls[0].function.arguments);
        return args;
      }

      return { extracted_fields: [], user_wants_to_skip: false };
    } catch (error) {
      console.error("❌ Extraction failed:", error.message);
      return { extracted_fields: [], user_wants_to_skip: false };
    }
  }

  // ------------------------------------------------------------------
  // PRIORITY-BASED MISSING FIELD ANALYZER
  // ------------------------------------------------------------------
  analyzeMissingFields(collectedData, currentState = null) {
    const missing = [];

    // Helper to check if field is missing
    const isMissing = (val) => !isValidValue(val);

    // PRIORITY 1: Current active entry (prevents perfectionist regression)
    if (currentState && RESUME_SCHEMA[currentState.currentSection]?.type === "array") {
      const section = currentState.currentSection;
      const sectionData = collectedData[section] || [];
      const activeIndex = getActiveArrayIndex(sectionData);
      const activeEntry = sectionData[activeIndex] || {};

      const schema = RESUME_SCHEMA[section];
      const allFields = [...schema.required, ...schema.optional];

      for (const field of allFields) {
        if (isMissing(activeEntry[field])) {
          const isRequired = schema.required.includes(field);
          missing.push({
            section,
            field,
            arrayIndex: activeIndex,
            isArray: true,
            description: `${field} for ${section} #${activeIndex + 1}`,
            priority: isRequired ? 1 : 2
          });

          // Return immediately - focus on completing current entry first
          if (isRequired) return [missing[0]];
        }
      }
    }

    // PRIORITY 2: Personal section (always required)
    if (!currentState || currentState.currentSection === "personal") {
      const personal = collectedData.personal || {};
      const schema = RESUME_SCHEMA.personal;

      for (const field of schema.required) {
        if (isMissing(personal[field])) {
          missing.push({
            section: "personal",
            field,
            isArray: false,
            description: `Your ${field}`,
            priority: 1
          });
        }
      }

      if (missing.length > 0) return [missing[0]];

      for (const field of schema.optional) {
        if (personal[field] === undefined) {
          missing.push({
            section: "personal",
            field,
            isArray: false,
            description: `Your ${field} (optional)`,
            priority: 3
          });
        }
      }
    }

    // PRIORITY 3: First entry of array sections
    const arraySections = ["education", "experience", "projects"];
    for (const section of arraySections) {
      const sectionData = collectedData[section] || [];

      if (sectionData.length === 0) {
        const schema = RESUME_SCHEMA[section];
        missing.push({
          section,
          field: schema.required[0],
          arrayIndex: 0,
          isArray: true,
          description: `Add your first ${section}`,
          priority: section === "education" ? 2 : 3
        });
      }
    }

    // PRIORITY 4: Skills
    if (!collectedData.skills?.languages || collectedData.skills.languages.length === 0) {
      missing.push({
        section: "skills",
        field: "languages",
        description: "Programming languages",
        priority: 2
      });
    }

    if (!collectedData.skills?.technologies || collectedData.skills.technologies.length === 0) {
      missing.push({
        section: "skills",
        field: "technologies",
        description: "Technologies and frameworks",
        priority: 2
      });
    }

    // Sort by priority and return top missing field
    missing.sort((a, b) => a.priority - b.priority);
    return missing.length > 0 ? [missing[0]] : [];
  }

  // ------------------------------------------------------------------
  // INTELLIGENT NEXT QUESTION GENERATOR
  // ------------------------------------------------------------------
  async generateNextQuestion(collectedData, conversationHistory = [], forceSkip = false, stateContext = null) {
    // Build current state from context if provided
    const currentState = stateContext || {
      currentSection: conversationHistory[conversationHistory.length - 1]?.nextSection || "personal",
      currentField: conversationHistory[conversationHistory.length - 1]?.nextField || "name"
    };

    // Check for "Add More" scenario
    const lastMsg = conversationHistory[conversationHistory.length - 1];
    const isAddMoreContext = lastMsg?.nextField === "add_more";

    // Handle array section completion
    const arraySections = ["education", "experience", "projects"];
    if (!isAddMoreContext && arraySections.includes(currentState.currentSection)) {
      const sectionData = collectedData[currentState.currentSection] || [];
      const activeIndex = getActiveArrayIndex(sectionData);
      const activeEntry = sectionData[activeIndex] || {};
      const schema = RESUME_SCHEMA[currentState.currentSection];

      // Check if current entry is complete
      const isComplete = isArrayEntryComplete(activeEntry, schema.required);

      if (isComplete && sectionData.length > 0) {
        return {
          message: `Great! Would you like to add another ${currentState.currentSection.slice(0, -1)}? (Yes/No)`,
          nextSection: currentState.currentSection,
          nextField: "add_more",
          isComplete: false,
          pendingArrayAddition: true
        };
      }
    }

    // Get next missing field
    const missingFields = this.analyzeMissingFields(collectedData, currentState);

    if (missingFields.length === 0) {
      return {
        message: "🎉 Congratulations! Your resume is complete. You can now download it or make any edits.",
        nextSection: "complete",
        nextField: "complete",
        isComplete: true
      };
    }

    const next = missingFields[0];

    // Generate contextual question
    const questionPrompt = `Generate a friendly, conversational question asking for: ${next.description}

Context:
- Section: ${next.section}
- Field: ${next.field}
- This is for a professional resume

Requirements:
- Keep it warm and encouraging
- Make it clear if the field is optional
- Add a helpful tip if appropriate
- Keep it under 30 words

Return ONLY the question.`;

    try {
      const messages = [
        { role: "system", content: "You are a friendly resume coach. Ask clear, encouraging questions." },
        { role: "user", content: questionPrompt }
      ];

      const response = await this.callGroq(messages);
      const question = response.content?.trim() || `Could you provide your ${next.field}?`;

      return {
        message: question,
        nextSection: next.section,
        nextField: next.field,
        arrayIndex: next.arrayIndex,
        isComplete: false,
        pendingArrayAddition: false
      };
    } catch (error) {
      console.error("⚠️  Question generation failed, using fallback");
      return {
        message: `Could you provide your ${next.description}?`,
        nextSection: next.section,
        nextField: next.field,
        arrayIndex: next.arrayIndex,
        isComplete: false
      };
    }
  }

  // ------------------------------------------------------------------
  // MAIN MESSAGE PROCESSOR (THE ROUTER/TRAFFIC COP)
  // ------------------------------------------------------------------
  async processMessage(userMessage, currentData, conversationHistory = [], currentState = null) {
    const updatedData = JSON.parse(JSON.stringify(currentData));
    const lastState = conversationHistory[conversationHistory.length - 1] || {};

    // Build current state
    const state = currentState || {
      currentSection: lastState.nextSection || "personal",
      currentField: lastState.nextField || "name"
    };

    // ===== COMMAND HANDLER: "Add More" Logic =====
    if (lastState.nextField === "add_more") {
      const isYes = /^(yes|yeah|yep|sure|ok|okay|yup|add|more|another)$/i.test(userMessage.trim());

      if (isYes) {
        // Create new empty entry IMMEDIATELY
        const section = state.currentSection;
        updatedData[section] = updatedData[section] || [];
        updatedData[section].push({}); // Add empty object

        const schema = RESUME_SCHEMA[section];
        const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory, false, {
          currentSection: section,
          currentField: schema.required[0] // Start with first required field
        });

        return {
          updatedData,
          extractedFields: [],
          nextQuestion: nextQuestion.message,
          nextSection: nextQuestion.nextSection,
          nextField: nextQuestion.nextField,
          arrayIndex: updatedData[section].length - 1,
          isComplete: false,
          pendingArrayAddition: false
        };
      } else {
        // User said "No" - move to next section
        const sections = Object.keys(RESUME_SCHEMA);
        const currentIndex = sections.indexOf(state.currentSection);
        const nextSectionKey = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

        if (nextSectionKey) {
          const nextSchema = RESUME_SCHEMA[nextSectionKey];
          const nextField = nextSchema.type === "array"
            ? nextSchema.required[0]
            : (nextSchema.required[0] || nextSchema.optional[0]);

          const nextQuestion = await this.generateNextQuestion(updatedData, conversationHistory, false, {
            currentSection: nextSectionKey,
            currentField: nextField
          });

          return {
            updatedData,
            extractedFields: [],
            nextQuestion: nextQuestion.message,
            nextSection: nextQuestion.nextSection,
            nextField: nextQuestion.nextField,
            isComplete: false,
            pendingArrayAddition: false
          };
        }
      }
    }

    // ===== DATA EXTRACTOR =====
    const extraction = await this.extractMultipleFields(userMessage, state, updatedData);

    // Handle skip request
    if (extraction.user_wants_to_skip) {
      const section = state.currentSection;
      const field = state.currentField;

      if (RESUME_SCHEMA[section]?.type === "array") {
        const activeIndex = getActiveArrayIndex(updatedData[section] || []);
        updatedData[section] = updatedData[section] || [];
        while (updatedData[section].length <= activeIndex) {
          updatedData[section].push({});
        }
        updatedData[section][activeIndex][field] = "__SKIPPED__";
      } else if (section === "personal") {
        updatedData.personal = updatedData.personal || {};
        updatedData.personal[field] = "__SKIPPED__";
      } else if (section === "skills") {
        updatedData.skills = updatedData.skills || {};
        updatedData.skills[field] = "__SKIPPED__";
      }
    }

    // Process extracted fields
    for (const item of extraction.extracted_fields) {
      const { section, field, value, arrayIndex } = item;

      if (RESUME_SCHEMA[section]?.type === "array") {
        updatedData[section] = updatedData[section] || [];
        const targetIndex = arrayIndex !== undefined ? arrayIndex : getActiveArrayIndex(updatedData[section]);

        while (updatedData[section].length <= targetIndex) {
          updatedData[section].push({});
        }

        // Handle array fields within objects
        if (["highlights", "coursework", "technologies"].includes(field)) {
          const items = Array.isArray(value)
            ? value
            : value.split(",").map(v => v.trim()).filter(v => v);

          // Auto-optimize highlights
          if (field === "highlights") {
            const optimized = await Promise.all(
              items.map(item => this.optimizeForATS(item, "highlight"))
            );
            updatedData[section][targetIndex][field] = optimized;
          } else {
            updatedData[section][targetIndex][field] = items;
          }
        } else {
          updatedData[section][targetIndex][field] = value;
        }
      } else if (section === "skills") {
        updatedData.skills = updatedData.skills || {};
        const items = value.split(",").map(v => v.trim()).filter(v => v);
        updatedData.skills[field] = items;
      } else if (section === "achievements") {
        updatedData.achievements = updatedData.achievements || [];
        const items = value.split(",").map(v => v.trim()).filter(v => v);
        updatedData.achievements.push(...items);
      } else {
        // Personal section
        updatedData[section] = updatedData[section] || {};
        updatedData[section][field] = value;
      }
    }

    // Generate next question
    const nextQ = await this.generateNextQuestion(updatedData, conversationHistory, false, state);

    return {
      updatedData,
      extractedFields: extraction.extracted_fields,
      nextQuestion: nextQ.message,
      nextSection: nextQ.nextSection,
      nextField: nextQ.nextField,
      arrayIndex: nextQ.arrayIndex,
      isComplete: nextQ.isComplete,
      pendingArrayAddition: nextQ.pendingArrayAddition || false
    };
  }

  // ------------------------------------------------------------------
  // TARGETED UPDATE (For editing specific sections)
  // ------------------------------------------------------------------
  async updateSpecificData(updateRequest, currentData) {
    const tools = [{
      type: "function",
      function: {
        name: "update_resume_data",
        description: "Update specific resume fields based on user request",
        parameters: {
          type: "object",
          properties: {
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string" },
                  field: { type: "string" },
                  value: { type: "string" },
                  arrayIndex: { type: "number" },
                  action: {
                    type: "string",
                    enum: ["update", "add", "delete"]
                  }
                },
                required: ["section", "field", "value", "action"]
              }
            }
          },
          required: ["updates"]
        }
      }
    }];

    const prompt = `Parse this update request: "${updateRequest}"

Current data: ${JSON.stringify(currentData, null, 2)}

Extract what needs to be updated, added, or deleted.`;

    try {
      const messages = [
        { role: "system", content: "You are a resume data update parser." },
        { role: "user", content: prompt }
      ];

      const response = await this.callGroq(messages, tools, "required");

      if (response.tool_calls?.[0]) {
        const updates = JSON.parse(response.tool_calls[0].function.arguments);
        const updatedData = JSON.parse(JSON.stringify(currentData));

        for (const update of updates.updates) {
          const { section, field, value, arrayIndex, action } = update;

          if (action === "update") {
            if (arrayIndex !== undefined && Array.isArray(updatedData[section])) {
              updatedData[section][arrayIndex][field] = value;
            } else {
              updatedData[section][field] = value;
            }
          }
          // Add more action handlers as needed
        }

        return {
          updatedData,
          extractedFields: updates.updates,
          message: "Updated successfully!"
        };
      }

      return { updatedData: currentData, extractedFields: [], message: "No updates found" };
    } catch (error) {
      console.error("❌ Update failed:", error.message);
      return { updatedData: currentData, extractedFields: [], message: "Update failed" };
    }
  }
}

// ====================================================================
// EXPORT
// ====================================================================

export const createAgent = (apiKey) => new ResumeAgentV2(apiKey);