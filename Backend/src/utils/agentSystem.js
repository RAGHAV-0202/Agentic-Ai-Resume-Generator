import fetch from "node-fetch";
import { MOCK_RESUME_DATA } from "./mockData.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ROTATION STRATEGY: Use a pool of models to avoid Rate Limits
const MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant"
];


const getRandomModel = () => MODELS[Math.floor(Math.random() * MODELS.length)];

class ResumeAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // --- 1. CALL GROQ API ---
  async callGroq(messages, tools = null, toolChoice = "auto") {
    const currentModel = getRandomModel();

    const payload = {
      model: currentModel,
      messages,
      temperature: 0.5,
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
        const errText = await response.text();
        console.error(`Groq API Error (${response.status}):`, errText);
        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return data.choices[0].message;
    } catch (error) {
      console.error("Groq Call Failed:", error);
      throw error;
    }
  }

  // --- 2. OPTIMIZE CONTENT ---
  async optimizeForATS(content, contentType = "highlight") {
    const prompt = `You are an expert ATS optimizer.
TASK: Optimize this ${contentType} to be impactful and concise (1-2 lines).
RULES: Use strong action verbs. Add metrics where possible. No fake numbers.
Original: "${content}"
Return ONLY the optimized version.`;

    const messages = [
      { role: "system", content: "You are an expert resume writer." },
      { role: "user", content: prompt },
    ];

    try {
      const response = await this.callGroq(messages);
      return response.content || content;
    } catch (e) {
      return content;
    }
  }

  // --- 3. EXTRACT FIELDS (Smart Indexing) ---
  async extractMultipleFields(userMessage, currentSection, collectedData, nextExpectedIndex = 0) {
    const tools = [
      {
        type: "function",
        function: {
          name: "extract_resume_data",
          description: "Extract resume information. Extract multiple fields at once.",
          parameters: {
            type: "object",
            properties: {
              extracted_fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    section: { type: "string", enum: ["personal", "education", "experience", "projects", "skills", "achievements"] },
                    field: { type: "string" },
                    value: { type: "string" },
                    arrayIndex: {
                      type: "number",
                      description: `For arrays (education/experience/projects), use index ${nextExpectedIndex} for NEW entries. Use 0-${Math.max(0, nextExpectedIndex - 1)} only for updates.`,
                      default: nextExpectedIndex
                    },
                  },
                  required: ["section", "field", "value"],
                },
              },
              user_wants_to_skip: { type: "boolean" },
            },
            required: ["extracted_fields"],
          },
        },
      },
    ];

    const extractionPrompt = `Extract resume data from: "${userMessage}"

CONTEXT:
- Section: ${currentSection}
- Existing Data: ${JSON.stringify(collectedData, null, 2)}
- Next Available Array Index: ${nextExpectedIndex} (USE THIS for new entries!)

RULES:
1. If the user mentions a NEW degree, job, or project, you MUST use arrayIndex: ${nextExpectedIndex}.
2. If the user is correcting an OLD entry (e.g. "change Panipat to Delhi"), use the existing index.
3. If the user says "skip", set user_wants_to_skip: true.`;

    const messages = [
      { role: "system", content: "You are a precise data extraction assistant." },
      { role: "user", content: extractionPrompt },
    ];

    try {
      const response = await this.callGroq(messages, tools, "required");
      if (response.tool_calls && response.tool_calls.length > 0) {
        return JSON.parse(response.tool_calls[0].function.arguments);
      }
      return { extracted_fields: [], user_wants_to_skip: false };
    } catch (error) {
      console.error("Extraction failed:", error);
      return { extracted_fields: [], user_wants_to_skip: false };
    }
  }

  // --- 4. ANALYZE MISSING FIELDS ---
  analyzeMissingFields(collectedData) {
    const isValid = (val) => val && val !== "__SKIPPED__" && val !== "skip" && String(val).trim() !== "";

    const getNextMissingFromArray = (section, fields, required) => {
      const arr = collectedData[section] || [];
      // Check existing entries
      for (let i = 0; i < arr.length; i++) {
        for (const field of fields) {
          if (!isValid(arr[i][field])) {
            return { section, field, isArray: true, arrayIndex: i, description: `Missing ${field} in ${section} #${i + 1}` };
          }
        }
      }
      // If array is empty and required
      if (required && arr.length === 0) {
        return { section, field: fields[0], isArray: true, arrayIndex: 0, description: `Add your first ${section}` };
      }
      return null;
    };

    // Personal
    const personalFields = ["name", "email", "phone", "location"];
    for (const f of personalFields) {
      if (!isValid(collectedData.personal?.[f])) return [{ section: "personal", field: f, description: `Your ${f}` }];
    }
    const personalOptional = ["linkedin", "github", "website"];
    for (const f of personalOptional) {
      if (collectedData.personal?.[f] === undefined) return [{ section: "personal", field: f, description: `Your ${f} (Optional)` }];
    }

    // Arrays
    const eduMissing = getNextMissingFromArray("education", ["institution", "degree", "startDate", "endDate"], true);
    if (eduMissing) return [eduMissing];

    const expMissing = getNextMissingFromArray("experience", ["company", "position", "startDate", "endDate", "highlights"], false);
    if (expMissing) return [expMissing];

    const projMissing = getNextMissingFromArray("projects", ["name", "date", "highlights", "technologies"], false);
    if (projMissing) return [projMissing];

    // Skills
    if (!isValid(collectedData.skills?.languages)) return [{ section: "skills", field: "languages", description: "Programming Languages" }];
    if (!isValid(collectedData.skills?.technologies)) return [{ section: "skills", field: "technologies", description: "Technologies/Frameworks" }];

    return [];
  }

  // --- 5. GENERATE NEXT QUESTION ---
  async generateNextQuestion(collectedData, conversationHistory = []) {
    const missingFields = this.analyzeMissingFields(collectedData);

    // SAFETY CHECK: Ensure history is an array
    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
    const lastMsg = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;

    // Check if we should ask "Add More?"
    const checkAddMore = (section, fields) => {
      const arr = collectedData[section];
      const isComplete = arr?.length > 0 && arr.every(item => fields.every(f => item[f]));
      const justAsked = lastMsg?.nextField === "add_more";

      // Only ask if we are currently in that section or transitioning from it
      if (isComplete && !justAsked && (lastMsg?.nextSection === section || !lastMsg)) {
        return true;
      }
      return false;
    };

    if (checkAddMore("education", ["institution", "degree"])) {
      return { message: "Would you like to add another education entry? (Yes/No)", nextSection: "education", nextField: "add_more", isComplete: false };
    }
    if (checkAddMore("experience", ["company", "position"])) {
      return { message: "Would you like to add another experience entry? (Yes/No)", nextSection: "experience", nextField: "add_more", isComplete: false };
    }
    if (checkAddMore("projects", ["name", "highlights"])) {
      return { message: "Would you like to add another project? (Yes/No)", nextSection: "projects", nextField: "add_more", isComplete: false };
    }

    if (missingFields.length === 0) {
      return { message: "🎉 All done! Your resume is ready.", isComplete: true, nextSection: "complete" };
    }

    const next = missingFields[0];
    const prompt = `Ask a short question for **${next.description}**. Context: Section ${next.section}. If optional, say "skip".`;
    const msg = await this.callGroq([{ role: "user", content: prompt }]);

    return {
      message: msg.content,
      nextSection: next.section,
      nextField: next.field,
      arrayIndex: next.arrayIndex,
      isComplete: false
    };
  }

  // --- 6. PROCESS MESSAGE (Logic Fix) ---
  async processMessage(userMessage, currentData, conversationHistory = []) {
    const updatedData = JSON.parse(JSON.stringify(currentData));

    // SAFETY CHECK: Ensure history is an array
    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
    const lastState = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : {};

    // HANDLE "ADD MORE" - The Loop Breaker
    if (lastState.nextField === "add_more") {
      const isYes = /yes|sure|yep/i.test(userMessage);

      if (isYes) {
        // CRITICAL FIX: Create new empty entry immediately
        const section = lastState.nextSection;
        updatedData[section] = updatedData[section] || [];
        updatedData[section].push({}); // Add empty object to increase length

        const nextQ = await this.generateNextQuestion(updatedData, safeHistory);
        return {
          updatedData,
          nextQuestion: nextQ.message,
          nextSection: nextQ.nextSection,
          nextField: nextQ.nextField,
          isComplete: false
        };
      }
      // If "No", just continue to standard extraction which will naturally pick the next missing field
    }

    // Determine Index for Extraction
    const currentSection = lastState.nextSection || "personal";
    let nextIndex = 0;
    if (["education", "experience", "projects"].includes(currentSection)) {
      // If we just added an empty object (from the Yes logic above in previous turn), use that index
      nextIndex = (updatedData[currentSection]?.length || 1) - 1;
      if (nextIndex < 0) nextIndex = 0;
    }

    // Extract
    const extraction = await this.extractMultipleFields(userMessage, currentSection, updatedData, nextIndex);

    // Update Data
    if (extraction.user_wants_to_skip && lastState.nextField) {
      const section = lastState.nextSection;
      const field = lastState.nextField;
      if (section === "personal") updatedData[section][field] = "__SKIPPED__";
    }

    for (const item of extraction.extracted_fields) {
      const { section, field, value, arrayIndex } = item;

      if (["education", "experience", "projects"].includes(section)) {
        updatedData[section] = updatedData[section] || [];
        while (updatedData[section].length <= arrayIndex) {
          updatedData[section].push({});
        }

        if (field === "highlights" || field === "technologies" || field === "coursework") {
          const val = Array.isArray(value) ? value : value.split(",");

          if (field === "highlights") { // Auto-optimize
            // Only optimize if it's a new or substantial update
            const optimized = await Promise.all(val.map(v => this.optimizeForATS(v, "highlight")));
            updatedData[section][arrayIndex][field] = optimized;
          } else {
            updatedData[section][arrayIndex][field] = val;
          }
        } else {
          updatedData[section][arrayIndex][field] = value;
        }
      } else if (section === "skills") {
        updatedData.skills = updatedData.skills || {};
        updatedData.skills[field] = value.split(",").map(s => s.trim());
      } else {
        updatedData[section] = updatedData[section] || {};
        updatedData[section][field] = value;
      }
    }

    const nextQ = await this.generateNextQuestion(updatedData, safeHistory);

    return {
      updatedData,
      extractedFields: extraction.extracted_fields,
      nextQuestion: nextQ.message,
      isComplete: nextQ.isComplete,
      nextSection: nextQ.nextSection,
      nextField: nextQ.nextField
    };
  }
}

export const createAgent = (apiKey) => new ResumeAgent(apiKey);