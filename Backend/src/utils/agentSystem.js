/**
 * ═══════════════════════════════════════════════════════════════════
 * TRUE AGENTIC RESUME SYSTEM — LLM Tool-Use Architecture
 * ═══════════════════════════════════════════════════════════════════
 *
 * Unlike a linear questionnaire, this agent uses the LLM as the
 * "brain" — it decides what to extract, what to update, and what
 * to ask next via tool-calling (function-calling).
 *
 * Capabilities:
 * ✓ Multi-field extraction from a single message
 * ✓ Out-of-order field filling (experience while asking for LinkedIn)
 * ✓ Natural language updates ("update my email to X")
 * ✓ Intelligent question generation based on missing fields
 * ✓ ATS-optimized bullet point enhancement
 * ✓ Conversational, context-aware interaction
 */

import fetch from "node-fetch";

// ═══════════════════════════════════════════════════════════════════
// GROQ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
];

const getModel = () => GROQ_MODELS[0];

// ═══════════════════════════════════════════════════════════════════
// COMPLETE RESUME SCHEMA
// ═══════════════════════════════════════════════════════════════════
const RESUME_SCHEMA = {
  personal: {
    fields: ["name", "location", "email", "phone", "linkedin", "github", "website"],
    required: ["name", "email", "phone"],
    type: "object"
  },
  education: {
    fields: ["institution", "degree", "startDate", "endDate", "gpa", "coursework"],
    required: ["institution", "degree", "startDate", "endDate"],
    arrayFields: ["coursework"],
    type: "array"
  },
  experience: {
    fields: ["company", "position", "location", "startDate", "endDate", "highlights"],
    required: ["company", "position", "startDate", "endDate"],
    arrayFields: ["highlights"],
    type: "array"
  },
  projects: {
    fields: ["name", "link", "date", "highlights", "technologies"],
    required: ["name", "date"],
    arrayFields: ["highlights", "technologies"],
    type: "array"
  },
  skills: {
    fields: ["languages", "technologies"],
    required: ["languages", "technologies"],
    type: "object"
  },
  achievements: {
    fields: ["list"],
    required: [],
    type: "array"
  },
  publications: {
    fields: ["title", "authors", "date", "doi"],
    required: ["title", "authors", "date"],
    arrayFields: ["authors"],
    type: "array"
  }
};

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA FOR PREVIEW
// ═══════════════════════════════════════════════════════════════════
const MOCK_PREVIEW_DATA = {
  personal: {
    name: "Sarah Chen",
    location: "Seattle, WA",
    email: "sarah.chen@email.com",
    phone: "+1 (206) 555-0123",
    linkedin: "linkedin.com/in/sarahchen",
    github: "github.com/sarahchen",
    website: "sarahchen.dev"
  },
  education: [
    {
      institution: "University of Washington",
      degree: "Bachelor of Science in Computer Science",
      startDate: "2019",
      endDate: "2023",
      gpa: "3.9/4.0",
      coursework: ["Machine Learning", "Data Structures", "Algorithms", "Database Systems"]
    }
  ],
  experience: [
    {
      company: "Microsoft",
      position: "Software Engineer Intern",
      location: "Redmond, WA",
      startDate: "June 2022",
      endDate: "September 2022",
      highlights: [
        "Developed cloud-native microservices using Azure and .NET Core",
        "Improved API response time by 35% through query optimization",
        "Collaborated with team of 8 engineers on critical infrastructure"
      ]
    }
  ],
  projects: [
    {
      name: "AI Resume Analyzer",
      link: "github.com/sarahchen/resume-ai",
      date: "2023",
      highlights: [
        "Built ML model to analyze resume effectiveness with 92% accuracy",
        "Processed 10,000+ resumes for training dataset"
      ],
      technologies: ["Python", "TensorFlow", "React", "FastAPI"]
    }
  ],
  skills: {
    languages: ["Python", "JavaScript", "TypeScript", "Java", "C++"],
    frameworks: ["React", "Node.js", "Express.js", "PostgreSQL", "MongoDB"],
    developerTools: ["Git", "Docker", "Kubernetes", "AWS", "VS Code"],
    libraries: ["Pandas", "NumPy", "Redux", "Material UI"]
  },
  achievements: [
    "Winner of HackMIT 2022 - Best AI/ML Project",
    "Published research paper on resume optimization algorithms",
    "Dean's List - All 4 years"
  ],
  publications: []
};

// ═══════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS FOR LLM
// ═══════════════════════════════════════════════════════════════════

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "update_resume_fields",
      description: `Extract and update one or more resume fields from the user's message. 
Call this tool to save ANY information the user provides, even if it's for a different section than what was asked.
You can update multiple fields across multiple sections in a single call.
For bullet-point fields (highlights, coursework, technologies, authors, achievements), provide arrays.
For achievements, provide the full list of achievements as an array of strings.
IMPORTANT: For highlights (experience/project descriptions), optimize for ATS with strong action verbs and quantifiable metrics.`,
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            description: "List of field updates to apply",
            items: {
              type: "object",
              properties: {
                section: {
                  type: "string",
                  enum: ["personal", "education", "experience", "projects", "skills", "achievements", "publications"],
                  description: "Which resume section to update"
                },
                field: {
                  type: "string",
                  description: "Which field within the section to update (e.g., 'name', 'company', 'languages'). For achievements, use 'list'."
                },
                value: {
                  description: "The extracted value. String for simple fields, array of strings for list fields (highlights, coursework, technologies, languages, achievements list, etc.)"
                },
                arrayIndex: {
                  type: "integer",
                  description: "For array sections (education, experience, projects, publications), which entry index to update (0-based). Use -1 to ADD a new entry. Default 0.",
                  default: 0
                }
              },
              required: ["section", "field", "value"]
            }
          }
        },
        required: ["updates"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_response",
      description: `Generate the AI's response message and determine what to ask next.
Always call this tool AFTER update_resume_fields (if there were updates).
Use the missing fields context to decide what to ask about next.
Be conversational, encouraging, and specific.`,
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The AI's response message to the user. Should acknowledge what was captured, and ask the next relevant question. Be warm and conversational."
          },
          nextSection: {
            type: "string",
            enum: ["personal", "education", "experience", "projects", "skills", "achievements", "publications", "complete"],
            description: "Which section the next question is about. Use 'complete' if all required sections are filled."
          },
          nextField: {
            type: "string",
            description: "Which specific field the next question targets. Use 'complete' if done."
          },
          isComplete: {
            type: "boolean",
            description: "True if all required resume sections have sufficient data (personal info, at least 1 education, at least 1 experience or project, and skills)."
          }
        },
        required: ["message", "nextSection", "nextField", "isComplete"]
      }
    }
  }
];

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════

const buildSystemPrompt = (resumeData, missingFields) => {
  const missingFieldsSummary = missingFields.length > 0
    ? missingFields.map(f => `- ${f.section}.${f.field} ${f.required ? "(REQUIRED)" : "(optional)"}: ${f.description}`).join("\n")
    : "All required fields are filled! Check if user wants to add more or make edits.";

  return `You are "ResumeAI", an expert career coach and AI resume assistant. You help users build professional, ATS-optimized resumes through natural conversation.

## YOUR BEHAVIOR
1. **Extract everything** — If a user gives multiple pieces of info in one message, extract ALL of them using update_resume_fields. Don't ignore data just because you didn't ask for it.
2. **Accept out-of-order input** — If you asked about LinkedIn but the user talks about their work experience, capture the experience data anyway. Don't force them back to LinkedIn.
3. **Handle updates** — If the user says "change my email to X" or "update my name", update the field immediately.
4. **Handle skips** — If the user says "skip", "pass", "no", "don't have one", move to the next field/section. DON'T call update_resume_fields for skipped fields.
5. **Be conversational** — Acknowledge what you captured, provide encouragement, and ask natural follow-up questions.
6. **ATS optimization** — For experience/project highlights, enhance weak descriptions with strong action verbs (Developed, Engineered, Spearheaded, Optimized, etc.) and quantifiable metrics when possible. But keep the user's original meaning.
7. **Smart questioning** — Focus on REQUIRED missing fields first, then optional ones. Don't re-ask fields already filled.
8. **Completion** — Mark isComplete=true ONLY when these are all filled: personal (name, email, phone), at least 1 education entry, at least 1 experience OR project, and skills (languages + technologies).

## RESUME SCHEMA
${JSON.stringify(RESUME_SCHEMA, null, 2)}

## CURRENT RESUME DATA
${JSON.stringify(resumeData, null, 2)}

## MISSING FIELDS
${missingFieldsSummary}

## TOOL USAGE
- ALWAYS call generate_response to produce your reply.
- Call update_resume_fields BEFORE generate_response if the user provided any data.
- For array sections (education, experience, projects, publications), use arrayIndex to target the right entry. Use 0 for the first entry, 1 for the second, etc. Use -1 to add a NEW entry.
- For skills.languages and skills.technologies, provide arrays of strings.
- For achievements, use section="achievements", field="list", value=[array of achievement strings].

## IMPORTANT RULES
- NEVER invent or hallucinate data. Only save what the user explicitly provides.
- NEVER ask for a field that's already filled unless the user wants to update it.
- When asking "would you like to add more?", if user says no, move to the next section.
- Keep your messages concise but friendly. Use emojis sparingly.`;
};

// ═══════════════════════════════════════════════════════════════════
// MAIN AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class AgenticResumeAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.API_URL = "https://api.groq.com/openai/v1/chat/completions";
  }

  // ─────────────────────────────────────────────────────────────────
  // GROQ API CALL (with tool support)
  // ─────────────────────────────────────────────────────────────────
  async callGroq(messages, tools = null, toolChoice = "auto", maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const payload = {
          model: getModel(),
          messages,
          temperature: 0.3,
          max_tokens: 2000
        };

        if (tools) {
          payload.tools = tools;
          payload.tool_choice = toolChoice;
        }

        const response = await fetch(this.API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        return data.choices[0].message;
      } catch (error) {
        console.error(`Groq attempt ${attempt + 1} failed:`, error.message);
        if (attempt === maxRetries) throw error;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ANALYZE MISSING FIELDS
  // ─────────────────────────────────────────────────────────────────
  analyzeMissingFields(resumeData) {
    const missing = [];

    // Personal section
    const personalRequired = RESUME_SCHEMA.personal.required;
    for (const field of RESUME_SCHEMA.personal.fields) {
      const value = resumeData?.personal?.[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        missing.push({
          section: "personal",
          field,
          required: personalRequired.includes(field),
          description: `Your ${field}`
        });
      }
    }

    // Array sections
    const arraySections = ["education", "experience", "projects", "publications"];
    for (const section of arraySections) {
      const entries = resumeData?.[section] || [];
      const validEntries = entries.filter(e => {
        if (!e || typeof e !== "object") return false;
        const firstRequired = RESUME_SCHEMA[section].required[0];
        return firstRequired && e[firstRequired] && String(e[firstRequired]).trim() !== "";
      });

      if (validEntries.length === 0) {
        const isRequired = ["education", "experience"].includes(section);
        missing.push({
          section,
          field: "first_entry",
          required: isRequired,
          description: `Add your first ${section} entry`
        });
      } else {
        // Check last entry for incomplete fields
        const lastEntry = validEntries[validEntries.length - 1];
        for (const field of RESUME_SCHEMA[section].fields) {
          const val = lastEntry[field];
          const isEmpty = !val || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0);
          if (isEmpty) {
            missing.push({
              section,
              field,
              required: RESUME_SCHEMA[section].required.includes(field),
              description: `${field} for your ${section} entry "${lastEntry[RESUME_SCHEMA[section].fields[0]] || "current"}"`
            });
          }
        }
      }
    }

    // Skills
    const languages = resumeData?.skills?.languages || [];
    const technologies = resumeData?.skills?.technologies || [];
    if (languages.length === 0) {
      missing.push({ section: "skills", field: "languages", required: true, description: "Programming languages you know" });
    }
    if (technologies.length === 0) {
      missing.push({ section: "skills", field: "technologies", required: true, description: "Frameworks and technologies you use" });
    }

    // Achievements (optional)
    const achievements = resumeData?.achievements || [];
    if (achievements.length === 0) {
      missing.push({ section: "achievements", field: "list", required: false, description: "Awards, certifications, or notable achievements" });
    }

    return missing;
  }

  // ─────────────────────────────────────────────────────────────────
  // APPLY UPDATES TO RESUME DATA
  // ─────────────────────────────────────────────────────────────────
  applyUpdates(resumeData, updates) {
    const extractedFields = [];

    for (const update of updates) {
      const { section, field, value, arrayIndex = 0 } = update;
      const schema = RESUME_SCHEMA[section];
      if (!schema) continue;

      try {
        if (section === "achievements") {
          // Achievements are a flat array of strings
          const newAchievements = Array.isArray(value) ? value : [value];
          if (!resumeData.achievements) resumeData.achievements = [];
          // Replace or append
          resumeData.achievements = [...new Set([...resumeData.achievements, ...newAchievements])];
          extractedFields.push({ section, field: "list", value: newAchievements });

        } else if (schema.type === "object") {
          // Personal, Skills
          if (!resumeData[section]) resumeData[section] = {};
          resumeData[section][field] = value;
          extractedFields.push({ section, field, value });

        } else if (schema.type === "array") {
          // Education, Experience, Projects, Publications
          if (!resumeData[section]) resumeData[section] = [];

          let targetIndex = arrayIndex;

          // -1 means add new entry
          if (targetIndex === -1) {
            resumeData[section].push({});
            targetIndex = resumeData[section].length - 1;
          }

          // Ensure entry exists at index
          while (resumeData[section].length <= targetIndex) {
            resumeData[section].push({});
          }

          resumeData[section][targetIndex][field] = value;
          extractedFields.push({ section, field, value, arrayIndex: targetIndex });
        }
      } catch (err) {
        console.error(`Failed to apply update ${section}.${field}:`, err.message);
      }
    }

    return { resumeData, extractedFields };
  }

  // ─────────────────────────────────────────────────────────────────
  // PROCESS MESSAGE (Core agentic method)
  // ─────────────────────────────────────────────────────────────────
  async processMessage(userMessage, resumeData, conversationHistory = []) {
    const missingFields = this.analyzeMissingFields(resumeData);

    const systemPrompt = buildSystemPrompt(resumeData, missingFields);

    // Build messages for LLM
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // Call LLM with tools
    let response;
    try {
      response = await this.callGroq(messages, AGENT_TOOLS, "required");
    } catch (error) {
      console.error("LLM call failed:", error.message);
      // Fallback: return a safe response
      return this._fallbackResponse(userMessage, resumeData, missingFields);
    }

    // Process tool calls
    let extractedFields = [];
    let updatedData = { ...resumeData };
    let nextQuestion = "";
    let nextSection = "personal";
    let nextField = "name";
    let isComplete = false;
    let wasUpdate = false;

    if (response.tool_calls && response.tool_calls.length > 0) {
      // Collect tool results for multi-turn
      const toolResults = [];

      for (const toolCall of response.tool_calls) {
        const fnName = toolCall.function.name;
        let args;

        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error("Failed to parse tool arguments:", e.message);
          continue;
        }

        if (fnName === "update_resume_fields") {
          const result = this.applyUpdates(updatedData, args.updates || []);
          updatedData = result.resumeData;
          extractedFields = [...extractedFields, ...result.extractedFields];
          wasUpdate = true;

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({
              success: true,
              updatedFields: result.extractedFields.map(f => `${f.section}.${f.field}`),
              message: `Successfully updated ${result.extractedFields.length} field(s).`
            })
          });

        } else if (fnName === "generate_response") {
          nextQuestion = args.message || "";
          nextSection = args.nextSection || "personal";
          nextField = args.nextField || "name";
          isComplete = args.isComplete || false;

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ success: true })
          });
        }
      }

      // If we got updates but no generate_response, do a follow-up call
      if (wasUpdate && !nextQuestion) {
        try {
          const followUpMessages = [
            ...messages,
            response, // assistant message with tool_calls
            ...toolResults,
          ];

          const followUp = await this.callGroq(followUpMessages, AGENT_TOOLS, "required");

          if (followUp.tool_calls) {
            for (const tc of followUp.tool_calls) {
              if (tc.function.name === "generate_response") {
                const fArgs = JSON.parse(tc.function.arguments);
                nextQuestion = fArgs.message || "";
                nextSection = fArgs.nextSection || "personal";
                nextField = fArgs.nextField || "name";
                isComplete = fArgs.isComplete || false;
              }
            }
          }

          // If still no question, use content
          if (!nextQuestion && followUp.content) {
            nextQuestion = followUp.content;
          }
        } catch (err) {
          console.error("Follow-up call failed:", err.message);
          // Generate a basic question from missing fields
          nextQuestion = this._generateBasicQuestion(this.analyzeMissingFields(updatedData));
        }
      }
    }

    // If we still don't have a response, use the content directly
    if (!nextQuestion && response.content) {
      nextQuestion = response.content;
    }

    // Final fallback
    if (!nextQuestion) {
      nextQuestion = this._generateBasicQuestion(this.analyzeMissingFields(updatedData));
    }

    return {
      updatedData,
      extractedFields,
      nextQuestion,
      nextSection,
      nextField,
      isComplete,
      wasUpdate
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // START CONVERSATION
  // ─────────────────────────────────────────────────────────────────
  startConversation() {
    return {
      message: "👋 Hi! I'm your AI Resume Assistant. I'll help you build a professional, ATS-optimized resume through our conversation.\n\nYou can share your information naturally — for example, tell me your name, email, and location all at once, or one at a time. I'll capture everything!\n\nLet's start — what's your full name?",
      nextSection: "personal",
      nextField: "name",
      isComplete: false
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // FALLBACK RESPONSES
  // ─────────────────────────────────────────────────────────────────
  _fallbackResponse(userMessage, resumeData, missingFields) {
    const question = this._generateBasicQuestion(missingFields);
    return {
      updatedData: resumeData,
      extractedFields: [],
      nextQuestion: `I had a brief hiccup processing that. ${question}`,
      nextSection: missingFields[0]?.section || "personal",
      nextField: missingFields[0]?.field || "name",
      isComplete: false,
      wasUpdate: false
    };
  }

  _generateBasicQuestion(missingFields) {
    if (missingFields.length === 0) {
      return "🎉 Your resume looks complete! Would you like to make any edits or add more details?";
    }

    const requiredMissing = missingFields.filter(f => f.required);
    const target = requiredMissing.length > 0 ? requiredMissing[0] : missingFields[0];

    const questionMap = {
      "personal.name": "What's your full name?",
      "personal.email": "What's your email address?",
      "personal.phone": "What's your phone number?",
      "personal.location": "Where are you located?",
      "personal.linkedin": "Do you have a LinkedIn profile? (or type 'skip')",
      "personal.github": "Do you have a GitHub profile? (or type 'skip')",
      "personal.website": "Do you have a personal website? (or type 'skip')",
      "education.first_entry": "🎓 Let's add your education! What university did you attend?",
      "experience.first_entry": "💼 Now let's add work experience! What company did you work for?",
      "projects.first_entry": "🚀 Want to showcase any projects?",
      "skills.languages": "💻 What programming languages do you know?",
      "skills.technologies": "What frameworks and technologies do you use?",
      "achievements.list": "🏆 Any achievements, awards, or certifications? (or type 'skip')",
    };

    const key = `${target.section}.${target.field}`;
    return questionMap[key] || `Could you tell me about your ${target.field} (${target.section} section)?`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export const createAgent = (apiKey) => new AgenticResumeAgent(apiKey);
export const getMockPreviewData = () => JSON.parse(JSON.stringify(MOCK_PREVIEW_DATA));
export { RESUME_SCHEMA };