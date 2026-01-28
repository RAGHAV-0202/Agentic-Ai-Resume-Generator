/**
 * ═══════════════════════════════════════════════════════════════════
 * PRODUCTION-READY INTELLIGENT RESUME AGENT SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✓ Asks ALL questions systematically
 * ✓ Never replaces existing entries - proper array management
 * ✓ Smart extraction from conversational input
 * ✓ Mock data for preview on session creation
 * ✓ Comprehensive field coverage from model
 * ✓ Production-grade error handling
 */

import fetch from "node-fetch";

// ═══════════════════════════════════════════════════════════════════
// VALIDATED GROQ MODELS
// ═══════════════════════════════════════════════════════════════════
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

const getModel = () => GROQ_MODELS[Math.floor(Math.random() * GROQ_MODELS.length)];

// ═══════════════════════════════════════════════════════════════════
// COMPLETE RESUME SCHEMA (From Resume Model)
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
// INTELLIGENT QUESTION TEMPLATES
// ═══════════════════════════════════════════════════════════════════
const QUESTION_TEMPLATES = {
  personal: {
    name: "👋 Hi! I'm your AI Resume Assistant. Let's build an amazing resume together! First, what's your full name?",
    location: "Great! Where are you currently located? (City, State/Country)",
    email: "What's your professional email address?",
    phone: "What's the best phone number to reach you at?",
    linkedin: "Do you have a LinkedIn profile? (Enter the URL or username, or type 'skip')",
    github: "How about a GitHub profile? Great for showcasing your code! (URL or type 'skip')",
    website: "Do you have a personal website or portfolio? (URL or type 'skip')"
  },
  education: {
    institution: "🎓 Let's talk about your education! What university or college did you attend?",
    degree: "What degree did you earn? (e.g., Bachelor of Science in Computer Science)",
    startDate: "When did you start this degree? (Year is fine, like 2019)",
    endDate: "When did you graduate or when do you expect to? (Year or 'Present')",
    gpa: "What was your GPA? (Optional - type 'skip' if you prefer not to include)",
    coursework: "Any relevant coursework you'd like to highlight? (Separate with commas, or 'skip')"
  },
  experience: {
    company: "💼 Now let's add your work experience! What company did you work for?",
    position: "What was your job title or position?",
    location: "Where was this job located? (City, State or 'Remote')",
    startDate: "When did you start this position? (e.g., June 2022)",
    endDate: "When did you finish? (Use 'Present' if you're still there)",
    highlights: "Tell me about your key achievements or responsibilities (2-4 points, separate with commas or new lines)"
  },
  projects: {
    name: "🚀 Let's showcase your projects! What's the name of a project you're proud of?",
    link: "Do you have a link to this project? (GitHub repo, live demo, etc. or 'skip')",
    date: "When did you work on this? (Year is fine)",
    highlights: "What did this project do? Describe its purpose and your contribution (1-2 sentences)",
    technologies: "What technologies did you use? (e.g., React, Python, AWS - separate with commas)"
  },
  skills: {
    languages: "💻 What programming languages are you proficient in? (e.g., Python, JavaScript, Java)",
    technologies: "What frameworks, tools, and technologies do you know? (e.g., React, Docker, AWS)"
  },
  achievements: {
    list: "🏆 Any notable achievements, awards, or certifications? (e.g., hackathon wins, scholarships - separate with commas, or 'skip')"
  },
  publications: {
    title: "📄 Do you have any publications or research papers? If yes, what's the title?",
    authors: "Who are the authors? (Include yourself, separate with commas)",
    date: "When was it published? (Year or Month Year)",
    doi: "What's the DOI or publication link? (Optional - type 'skip' if not applicable)"
  }
};

// ═══════════════════════════════════════════════════════════════════
// MAIN AGENT CLASS
// ═══════════════════════════════════════════════════════════════════
class IntelligentResumeAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.API_URL = "https://api.groq.com/openai/v1/chat/completions";
  }

  // ─────────────────────────────────────────────────────────────────
  // GROQ API CALL
  // ─────────────────────────────────────────────────────────────────
  async callGroq(messages, tools = null, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const payload = {
          model: getModel(),
          messages,
          temperature: 0.3,
          max_tokens: 1500
        };

        if (tools) {
          payload.tools = tools;
          payload.tool_choice = "required";
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
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message;
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt === maxRetries) throw error;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SMART DATA EXTRACTION
  // ─────────────────────────────────────────────────────────────────
  async extractData(userMessage, field, section, arrayIndex = 0) {
    const isArrayField = RESUME_SCHEMA[section]?.arrayFields?.includes(field);

    const extractionPrompt = `Extract the "${field}" value from this message: "${userMessage}"

Context: Section is "${section}", Field is "${field}"

Rules:
1. Extract ONLY the ${field} value
2. Remove conversational fluff like "My ${field} is", "I worked at", etc.
3. ${isArrayField ? `This is an array field. Split by commas or newlines and return as array.` : `Return as plain text.`}
4. If user says "skip", "pass", "none", "n/a" → return "SKIP"
5. Be smart - extract from natural language

Examples:
"My name is John Smith" → "John Smith"
"I go to MIT" → "MIT"
"I know Python, JavaScript, and Java" → ["Python", "JavaScript", "Java"]
"skip" → "SKIP"

Extract now (return JSON):`;

    const tools = [{
      type: "function",
      function: {
        name: "extract_field",
        description: "Extract specific field value from user message",
        parameters: {
          type: "object",
          properties: {
            value: {
              type: isArrayField ? "array" : "string",
              description: `The extracted ${field} value`
            },
            is_skip: {
              type: "boolean",
              description: "True if user wants to skip this field"
            }
          },
          required: ["value", "is_skip"]
        }
      }
    }];

    try {
      const response = await this.callGroq(
        [{ role: "user", content: extractionPrompt }],
        tools
      );

      if (response.tool_calls?.[0]) {
        const result = JSON.parse(response.tool_calls[0].function.arguments);
        if (result.is_skip) return { skip: true };
        return { value: result.value, skip: false };
      }
    } catch (error) {
      console.error("Extraction failed:", error);
    }

    // Fallback: basic extraction
    if (/^(skip|pass|none|n\/?a)$/i.test(userMessage.trim())) {
      return { skip: true };
    }

    return { value: userMessage.trim(), skip: false };
  }

  // ─────────────────────────────────────────────────────────────────
  // GET NEXT QUESTION
  // ─────────────────────────────────────────────────────────────────
  getNextField(currentSection, currentField, resumeData) {
    const schema = RESUME_SCHEMA[currentSection];
    if (!schema) return null;

    const fields = schema.fields;
    const currentIndex = fields.indexOf(currentField);

    // Check if current section is array type
    if (schema.type === "array") {
      const arrayData = resumeData[currentSection] || [];
      const currentArrayIndex = arrayData.length > 0 ? arrayData.length - 1 : 0;
      const currentEntry = arrayData[currentArrayIndex] || {};

      // Find next missing field in current entry
      for (let i = currentIndex + 1; i < fields.length; i++) {
        const nextField = fields[i];
        if (!currentEntry[nextField] || currentEntry[nextField] === "") {
          return {
            section: currentSection,
            field: nextField,
            arrayIndex: currentArrayIndex,
            question: QUESTION_TEMPLATES[currentSection][nextField]
          };
        }
      }

      // Current entry complete - ask to add more
      if (currentField === fields[fields.length - 1]) {
        return {
          section: currentSection,
          field: "addMore",
          arrayIndex: currentArrayIndex,
          question: `Great! Would you like to add another ${currentSection.slice(0, -1)}? (Yes/No)`
        };
      }
    }

    // Move to next field in current section
    if (currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      return {
        section: currentSection,
        field: nextField,
        arrayIndex: 0,
        question: QUESTION_TEMPLATES[currentSection][nextField]
      };
    }

    // Move to next section
    const sections = Object.keys(RESUME_SCHEMA);
    const sectionIndex = sections.indexOf(currentSection);

    if (sectionIndex < sections.length - 1) {
      const nextSection = sections[sectionIndex + 1];
      const firstField = RESUME_SCHEMA[nextSection].fields[0];
      return {
        section: nextSection,
        field: firstField,
        arrayIndex: 0,
        question: QUESTION_TEMPLATES[nextSection][firstField]
      };
    }

    // All done!
    return {
      section: "complete",
      field: "complete",
      arrayIndex: 0,
      question: "🎉 Congratulations! Your resume is complete. You can now download it or make any edits!"
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PROCESS USER MESSAGE
  // ─────────────────────────────────────────────────────────────────
  async processMessage(userMessage, currentState, resumeData) {
    const { currentSection, currentField, currentArrayIndex } = currentState;

    // Handle "addMore" response
    if (currentField === "addMore") {
      const isYes = /^(yes|yeah|yep|sure|ok|okay|y)$/i.test(userMessage.trim());

      if (isYes) {
        // Create NEW empty entry in array
        const schema = RESUME_SCHEMA[currentSection];
        const newEntry = schema.isSimpleList ? "" : {};
        resumeData[currentSection].push(newEntry);

        // Move to first field of new entry
        const firstField = RESUME_SCHEMA[currentSection].fields[0];
        const newIndex = resumeData[currentSection].length - 1;

        return {
          resumeData,
          nextQuestion: QUESTION_TEMPLATES[currentSection][firstField],
          nextSection: currentSection,
          nextField: firstField,
          nextArrayIndex: newIndex,
          extracted: null
        };
      } else {
        // user said NO to addMore -> Move to NEXT SECTION
        const sections = Object.keys(RESUME_SCHEMA);
        const sectionIndex = sections.indexOf(currentSection);

        if (sectionIndex < sections.length - 1) {
          const nextSection = sections[sectionIndex + 1];
          const firstField = RESUME_SCHEMA[nextSection].fields[0];
          return {
            resumeData,
            nextQuestion: QUESTION_TEMPLATES[nextSection][firstField],
            nextSection: nextSection,
            nextField: firstField,
            nextArrayIndex: 0,
            extracted: null
          };
        } else {
          // Complete
          return {
            resumeData,
            nextQuestion: "🎉 Congratulations! Your resume is complete. You can now download it or make any edits!",
            nextSection: "complete",
            nextField: "complete",
            nextArrayIndex: 0,
            extracted: null
          };
        }
      }
    }

    // Extract data from message
    const extraction = await this.extractData(
      userMessage,
      currentField,
      currentSection,
      currentArrayIndex
    );

    // Update resume data
    if (!extraction.skip) {
      const schema = RESUME_SCHEMA[currentSection];

      if (schema.type === "array") {
        // Ensure array and entry exist
        if (!resumeData[currentSection]) {
          resumeData[currentSection] = [];
        }

        // Ensure we have an entry at the current index
        while (resumeData[currentSection].length <= currentArrayIndex) {
          resumeData[currentSection].push(schema.isSimpleList ? "" : {});
        }

        if (schema.isSimpleList) {
          resumeData[currentSection][currentArrayIndex] = extraction.value;
        } else {
          resumeData[currentSection][currentArrayIndex][currentField] = extraction.value;
        }
      } else if (schema.type === "object") {
        if (!resumeData[currentSection]) {
          resumeData[currentSection] = {};
        }
        resumeData[currentSection][currentField] = extraction.value;
      }
    }

    // Get next question
    const next = this.getNextField(currentSection, currentField, resumeData);

    return {
      resumeData,
      nextQuestion: next.question,
      nextSection: next.section,
      nextField: next.field,
      nextArrayIndex: next.arrayIndex || 0,
      extracted: extraction.skip ? null : extraction.value
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // START CONVERSATION
  // ─────────────────────────────────────────────────────────────────
  startConversation() {
    return {
      question: QUESTION_TEMPLATES.personal.name,
      section: "personal",
      field: "name",
      arrayIndex: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export const createAgent = (apiKey) => new IntelligentResumeAgent(apiKey);
export const getMockPreviewData = () => JSON.parse(JSON.stringify(MOCK_PREVIEW_DATA));
export { RESUME_SCHEMA };