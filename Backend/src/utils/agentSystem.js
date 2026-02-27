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
  "openai/gpt-oss-120b",      // Primary — OpenAI GPT OSS 120B (30 req/min, 8K tok/min)
  "llama-3.3-70b-versatile",   // Fallback — Meta Llama 3.3 70B (30 req/min, 12K tok/min)
];

let modelIndex = 0;
const getModel = () => {
  const model = GROQ_MODELS[modelIndex % GROQ_MODELS.length];
  modelIndex++;
  return model;
};

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
// SECTION ORDER & FOCUS COMPUTATION
// ═══════════════════════════════════════════════════════════════════

const SECTION_ORDER = ["personal", "education", "experience", "projects", "skills", "achievements", "publications"];

/**
 * Compute the next field/section the agent should ask about.
 * Follows strict section order: personal → education → experience → projects → skills → achievements → publications
 * Within each section, goes through ALL fields (required + optional) before offering "add more" or moving on.
 *
 * @param {Object} resumeData - Current resume data
 * @param {string} minSection - The minimum section to start from (prevents going backwards).
 *                              Uses the conversationState.currentSection so we never revisit completed sections.
 */
const computeCurrentFocus = (resumeData, minSection = "personal") => {
  // Find the starting index — never go backwards
  const minIndex = Math.max(0, SECTION_ORDER.indexOf(minSection));
  const sectionsToCheck = SECTION_ORDER.slice(minIndex);

  for (const section of sectionsToCheck) {
    const schema = RESUME_SCHEMA[section];
    if (!schema) continue;

    if (section === "achievements") {
      const achievements = resumeData?.achievements || [];
      if (achievements.length === 0) {
        return { section: "achievements", field: "list", arrayIndex: 0, askAddMore: false };
      }
      continue; // achievements filled, move on
    }

    if (schema.type === "object") {
      // personal, skills — check each field in order
      for (const field of schema.fields) {
        const val = resumeData?.[section]?.[field];
        if (!val || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0)) {
          return { section, field, arrayIndex: 0, askAddMore: false };
        }
      }
      continue; // all fields filled, move to next section
    }

    if (schema.type === "array") {
      // education, experience, projects, publications
      const entries = resumeData?.[section] || [];
      const validEntries = entries.filter(e => {
        if (!e || typeof e !== "object") return false;
        const firstReq = schema.required[0];
        return firstReq && e[firstReq] && String(e[firstReq]).trim() !== "";
      });

      if (validEntries.length === 0) {
        // No entries yet — ask for the first field of a new entry
        return { section, field: schema.fields[0], arrayIndex: 0, askAddMore: false };
      }

      // Check if the LAST VALID entry has all fields filled
      const lastIdx = validEntries.length - 1;
      // Find the actual index in the full entries array
      const actualLastIdx = entries.indexOf(validEntries[lastIdx]);
      const lastEntry = validEntries[lastIdx];

      for (const field of schema.fields) {
        const val = lastEntry?.[field];
        const isEmpty = !val || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          return { section, field, arrayIndex: actualLastIdx, askAddMore: false };
        }
      }

      // Last valid entry is complete — ask "add more?"
      // But only if we're currently ON this section (not a section we already passed)
      if (section === minSection || minSection === "personal") {
        return { section, field: "addMore", arrayIndex: actualLastIdx, askAddMore: true };
      }
      // Otherwise, we already passed this section, move on
      continue;
    }
  }

  // All sections complete
  return { section: "complete", field: "complete", arrayIndex: 0, askAddMore: false };
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════

const buildSystemPrompt = (resumeData, missingFields, currentFocus) => {
  const missingFieldsSummary = missingFields.length > 0
    ? missingFields.map(f => `- ${f.section}.${f.field} ${f.required ? "(REQUIRED)" : "(optional)"}: ${f.description}`).join("\n")
    : "All required fields are filled! Check if user wants to add more or make edits.";

  const focusInstruction = currentFocus.section === "complete"
    ? "ALL SECTIONS COMPLETE — congratulate the user and ask if they want to make any edits."
    : currentFocus.askAddMore
      ? `ASK: "Would you like to add another ${currentFocus.section.replace(/s$/, '')}?" — If they say yes, start a new entry. If no, move to the next section.`
      : `ASK ABOUT: ${currentFocus.section}.${currentFocus.field} (array index: ${currentFocus.arrayIndex})`;

  return `You are "ResumeAI", an expert career coach and AI resume assistant. You help users build professional, ATS-optimized resumes through natural conversation.

## CRITICAL: SECTION PROGRESSION ORDER
You MUST follow this strict section order when asking questions:
  personal → education → experience → projects → skills → achievements → publications

Rules:
- **Complete each section fully** before moving to the next. Ask about ALL fields in a section (both required AND optional) before moving on.
- For optional fields (like GPA, LinkedIn, GitHub, website), ASK the user — don't skip them. They can say "skip" if they want.
- For array sections (education, experience, projects, publications): after completing all fields for an entry, ALWAYS ask "Would you like to add another [entry type]?" before moving to the next section.
- NEVER jump ahead to a later section while there are unfilled fields in the current section.

## CURRENT FOCUS (Your next question MUST be about this)
${focusInstruction}

## YOUR BEHAVIOR
1. **Extract everything** — If a user gives multiple pieces of info in one message, extract ALL of them using update_resume_fields. Don't ignore data just because you didn't ask for it.
2. **Accept out-of-order input** — If you asked about LinkedIn but the user talks about their work experience, capture the experience data anyway. BUT THEN return to asking about LinkedIn (the current focus).
3. **Handle updates** — If the user says "change my email to X" or "update my name", update the field immediately.
4. **Handle skips** — If the user says "skip", "pass", "no", "don't have one", move to the NEXT field in the current section (not a random section). DON'T call update_resume_fields for skipped fields.
5. **Be conversational** — Briefly acknowledge what you captured, then ask the next question. Keep responses short (1-2 sentences + question).
6. **ATS optimization (CRITICAL)** — For experience/project highlights:
   - MAXIMUM 2-3 bullet points per entry. Consolidate related tasks into single powerful statements.
   - Use STRONG power verbs: Architected, Spearheaded, Engineered, Orchestrated, Transformed, Pioneered, Revolutionized.
   - ALWAYS include quantifiable metrics — even estimated ones. E.g. "Reduced manual paperwork" → "Automated inventory workflows, eliminating 90% of manual paperwork and saving 15+ hours/week"
   - Make it IMPRESSIVE and impactful. Exaggerate within reason to wow recruiters. Think "What would make a Google recruiter stop scrolling?"
   - Combine weak points: "Fixed landing page" + "Developed backend" → "Spearheaded end-to-end development of inventory management system and revamped client-facing landing page, driving 40% improvement in user engagement"
   - NEVER save the user's raw text as-is for highlights. Always transform it into polished, recruiter-ready bullet points.
7. **Completion** — Mark isComplete=true ONLY when these are all filled: personal (name, email, phone), at least 1 education entry with required fields, at least 1 experience OR project with required fields, and skills (languages + technologies).

## RESUME SCHEMA
${JSON.stringify(RESUME_SCHEMA, null, 2)}

## CURRENT RESUME DATA
${JSON.stringify(resumeData, null, 2)}

## MISSING FIELDS (for reference only — follow CURRENT FOCUS above for question order)
${missingFieldsSummary}

## TOOL USAGE
- ALWAYS call generate_response to produce your reply.
- Call update_resume_fields BEFORE generate_response if the user provided any data.
- In generate_response, set nextSection and nextField to match CURRENT FOCUS (or the next focus if current was just completed).
- For array sections (education, experience, projects, publications), use the arrayIndex shown in CURRENT FOCUS above. Do NOT use -1 unless the user explicitly wants to add a BRAND NEW entry. Always update the existing entry being discussed.
- CRITICAL: When the user provides additional info about the SAME entry (e.g., highlights for the project you just asked about), use the SAME arrayIndex, NOT -1.
- For skills.languages and skills.technologies, provide arrays of strings.
- For achievements, use section="achievements", field="list", value=[array of achievement strings].

## IMPORTANT RULES
- NEVER invent or hallucinate data. Only save what the user explicitly provides.
- NEVER ask for a field that's already filled unless the user wants to update it.
- Keep your messages concise but friendly. Use emojis sparingly (max 1 per message).`;
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

          // -1 means add new entry — but check if the last entry is mostly empty first (dedup guard)
          if (targetIndex === -1) {
            const lastEntry = resumeData[section][resumeData[section].length - 1];
            const hasRequiredData = lastEntry && schema.required.some(req =>
              lastEntry[req] && String(lastEntry[req]).trim() !== ""
            );

            if (lastEntry && !hasRequiredData) {
              // Last entry is mostly empty — reuse it instead of creating a new one
              targetIndex = resumeData[section].length - 1;
            } else {
              resumeData[section].push({});
              targetIndex = resumeData[section].length - 1;
            }
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
  async processMessage(userMessage, resumeData, conversationHistory = [], currentSection = "personal") {
    const missingFields = this.analyzeMissingFields(resumeData);
    const currentFocus = computeCurrentFocus(resumeData, currentSection);

    // ─────────────────────────────────────────────────────────────
    // PRE-LLM SKIP DETECTION — Handle skip/no/pass without API call
    // ─────────────────────────────────────────────────────────────
    const skipPatterns = /^(skip|no|pass|none|nope|n\/a|na|don'?t have|no thanks|next|move on)$/i;
    const trimmedMsg = userMessage.trim();

    if (skipPatterns.test(trimmedMsg)) {
      // For "add more?" prompts — user says no, advance to next section
      if (currentFocus.askAddMore) {
        const nextSectionIdx = SECTION_ORDER.indexOf(currentFocus.section) + 1;
        const nextSec = nextSectionIdx < SECTION_ORDER.length ? SECTION_ORDER[nextSectionIdx] : "complete";
        const nextFocus = computeCurrentFocus(resumeData, nextSec);

        return {
          updatedData: resumeData,
          extractedFields: [],
          nextQuestion: nextFocus.section === "complete"
            ? "🎉 Your resume looks complete! Would you like to make any edits?"
            : this._generateBasicQuestion([{ section: nextFocus.section, field: nextFocus.field, required: true, description: "" }]),
          nextSection: nextFocus.section,
          nextField: nextFocus.field,
          isComplete: nextFocus.section === "complete",
          wasUpdate: false
        };
      }

      // For regular field skips — advance to next field in current section
      // Temporarily mark the field as "skipped" by moving the focus forward
      const nextFocus = this._computeNextFieldAfterSkip(resumeData, currentFocus, currentSection);

      return {
        updatedData: resumeData,
        extractedFields: [],
        nextQuestion: nextFocus.askAddMore
          ? `Would you like to add another ${nextFocus.section.replace(/s$/, '')} entry?`
          : nextFocus.section === "complete"
            ? "🎉 Your resume looks complete! Would you like to make any edits or add more details?"
            : this._generateBasicQuestion([{ section: nextFocus.section, field: nextFocus.field, required: true, description: "" }]),
        nextSection: nextFocus.section,
        nextField: nextFocus.field,
        isComplete: nextFocus.section === "complete",
        wasUpdate: false
      };
    }

    const systemPrompt = buildSystemPrompt(resumeData, missingFields, currentFocus);

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
    let nextSection = currentFocus.section;
    let nextField = currentFocus.field;
    let isComplete = currentFocus.section === "complete";
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

      // Recompute focus after updates were applied (use the UPDATED section as floor)
      if (wasUpdate) {
        // The new minimum is whichever is further: the LLM's nextSection or the current section
        const updatedMinIdx = Math.max(
          SECTION_ORDER.indexOf(currentSection),
          SECTION_ORDER.indexOf(nextSection)
        );
        const updatedMin = SECTION_ORDER[Math.max(0, updatedMinIdx)] || currentSection;
        const newFocus = computeCurrentFocus(updatedData, updatedMin);
        nextSection = newFocus.section;
        nextField = newFocus.field;
        isComplete = newFocus.section === "complete";
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
                nextSection = fArgs.nextSection || nextSection;
                nextField = fArgs.nextField || nextField;
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

    // ═══════════════════════════════════════════════════════════════
    // HARD FLOOR GUARD — Never go backwards, no matter what the LLM says
    // ═══════════════════════════════════════════════════════════════
    const currentIdx = SECTION_ORDER.indexOf(currentSection);
    const resultIdx = SECTION_ORDER.indexOf(nextSection);
    if (currentIdx >= 0 && resultIdx >= 0 && resultIdx < currentIdx) {
      // LLM tried to go backwards — clamp to current section or forward
      const correctedFocus = computeCurrentFocus(updatedData, currentSection);
      nextSection = correctedFocus.section;
      nextField = correctedFocus.field;
      isComplete = correctedFocus.section === "complete";
      console.log(`⚠️  Floor guard: LLM tried to go back to ${SECTION_ORDER[resultIdx]}, clamped to ${nextSection}`);
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
  // SKIP NAVIGATION HELPER
  // ─────────────────────────────────────────────────────────────────
  _computeNextFieldAfterSkip(resumeData, currentFocus, currentSection) {
    const schema = RESUME_SCHEMA[currentFocus.section];
    if (!schema) {
      // Move to next section
      const nextIdx = SECTION_ORDER.indexOf(currentFocus.section) + 1;
      const nextSec = nextIdx < SECTION_ORDER.length ? SECTION_ORDER[nextIdx] : "complete";
      return computeCurrentFocus(resumeData, nextSec);
    }

    if (schema.type === "object") {
      // Find the next field after the current one
      const fieldIdx = schema.fields.indexOf(currentFocus.field);
      if (fieldIdx >= 0 && fieldIdx < schema.fields.length - 1) {
        // Check remaining fields in this section
        for (let i = fieldIdx + 1; i < schema.fields.length; i++) {
          const val = resumeData?.[currentFocus.section]?.[schema.fields[i]];
          if (!val || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0)) {
            return { section: currentFocus.section, field: schema.fields[i], arrayIndex: 0, askAddMore: false };
          }
        }
      }
      // All fields in this object section done, move to next section
      const nextIdx = SECTION_ORDER.indexOf(currentFocus.section) + 1;
      const nextSec = nextIdx < SECTION_ORDER.length ? SECTION_ORDER[nextIdx] : "complete";
      return computeCurrentFocus(resumeData, nextSec);
    }

    if (schema.type === "array") {
      // Find the next field in the current entry
      const fieldIdx = schema.fields.indexOf(currentFocus.field);
      if (fieldIdx >= 0 && fieldIdx < schema.fields.length - 1) {
        const entry = resumeData?.[currentFocus.section]?.[currentFocus.arrayIndex];
        for (let i = fieldIdx + 1; i < schema.fields.length; i++) {
          const val = entry?.[schema.fields[i]];
          if (!val || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0)) {
            return { section: currentFocus.section, field: schema.fields[i], arrayIndex: currentFocus.arrayIndex, askAddMore: false };
          }
        }
        // All fields in this entry done — ask "add more?"
        return { section: currentFocus.section, field: "addMore", arrayIndex: currentFocus.arrayIndex, askAddMore: true };
      }
      // Current field not found — just ask "add more?"
      return { section: currentFocus.section, field: "addMore", arrayIndex: currentFocus.arrayIndex, askAddMore: true };
    }

    // Achievements or unknown — move to next section
    const nextIdx = SECTION_ORDER.indexOf(currentFocus.section) + 1;
    const nextSec = nextIdx < SECTION_ORDER.length ? SECTION_ORDER[nextIdx] : "complete";
    return computeCurrentFocus(resumeData, nextSec);
  }

  // ─────────────────────────────────────────────────────────────────
  // FALLBACK RESPONSES
  // ─────────────────────────────────────────────────────────────────
  _fallbackResponse(userMessage, resumeData, missingFields, currentSection = "personal") {
    const focus = computeCurrentFocus(resumeData, currentSection);
    const question = focus.section === "complete"
      ? "🎉 Your resume looks complete! Would you like to make any edits?"
      : focus.askAddMore
        ? `Would you like to add another ${focus.section.replace(/s$/, '')} entry?`
        : this._generateBasicQuestion([{ section: focus.section, field: focus.field, required: true, description: "" }]);

    return {
      updatedData: resumeData,
      extractedFields: [],
      nextQuestion: question,
      nextSection: focus.section,
      nextField: focus.field,
      isComplete: focus.section === "complete",
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
      "education.institution": "What institution did you study at?",
      "education.degree": "What degree did you earn?",
      "education.startDate": "When did you start? (month and year)",
      "education.endDate": "When did you finish? (month and year, or 'Present')",
      "education.gpa": "What was your GPA? (or type 'skip')",
      "education.coursework": "Any relevant coursework? (or type 'skip')",
      "experience.first_entry": "💼 Let's add work experience! What company did you work for?",
      "experience.company": "What company did you work for?",
      "experience.position": "What was your position?",
      "experience.location": "Where was the company located?",
      "experience.startDate": "When did you start?",
      "experience.endDate": "When did you finish?",
      "experience.highlights": "Describe your key contributions (2-3 bullet points)",
      "projects.first_entry": "🚀 Let's showcase your projects! What's the project name?",
      "projects.name": "What's the project name?",
      "projects.link": "Do you have a link for this project? (or type 'skip')",
      "projects.date": "When did you work on this project?",
      "projects.highlights": "Describe what you built (2-3 bullet points)",
      "projects.technologies": "What technologies did you use?",
      "skills.languages": "💻 What programming languages do you know?",
      "skills.technologies": "What frameworks and technologies do you use?",
      "achievements.list": "🏆 Any achievements, awards, or certifications? (or type 'skip')",
      "publications.first_entry": "📄 Any publications? (or type 'skip')",
    };

    const key = `${target.section}.${target.field}`;
    return questionMap[key] || `Could you tell me about your ${target.field}? (or type 'skip')`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export const createAgent = (apiKey) => new AgenticResumeAgent(apiKey);
export const getMockPreviewData = () => JSON.parse(JSON.stringify(MOCK_PREVIEW_DATA));
export { RESUME_SCHEMA };