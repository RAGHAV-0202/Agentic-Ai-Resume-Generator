import dotenv from "dotenv"
dotenv.config()

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

// System prompt that guides the AI based on current state
// System prompt that guides the AI based on current state
const getSystemPrompt = (currentSection, currentField, collectedData) => {
  const sectionGuides = {
    personal: {
      name: "Ask for the user's full name. Be warm and professional.",
      location: "Ask for their location (City, Country). Mention this helps match with local recruiters.",
      email: "Ask for their professional email address.",
      phone: "Ask for their phone number.",
      linkedin: "Ask for their LinkedIn profile URL. Mention it adds credibility.",
      github: "Ask for GitHub URL. Great for showcasing code!",
      website: "Ask for a personal website or portfolio.",
    },
    education: {
      institution: "Ask for the university or school name.",
      degree: "Ask for the degree and major (e.g., B.Tech in CSE).",
      startDate: "Ask for the start date/year.",
      endDate: "Ask for the graduation date/year (expected is fine).",
      gpa: "Ask for GPA. Tell them it's optional and fine to skip if they prefer.",
      coursework: "Ask for relevant coursework. Suggest things like user's major subjects.",
    },
    experience: {
      company: "Ask for the company name.",
      position: "Ask what their role/title was.",
      location: "Ask for the location (or if it was Remote).",
      startDate: "Ask when they started.",
      endDate: "Ask when they finished (or if they still work there).",
      highlights: "Ask for key responsibilities. Encourage them to use action verbs and numbers!",
    },
    projects: {
      name: "Ask for the project name.",
      link: "Ask for a link (GitHub/Demo).",
      date: "Ask when they built it.",
      highlights: "Ask what the project does and what their contribution was.",
      technologies: "Ask for the tech stack used (e.g., React, Node.js).",
    },
    skills: {
      languages: "Ask for programming languages they are proficient in.",
      technologies: "Ask for other tools, frameworks, and libraries they know.",
    },
  };

  const currentGuide = sectionGuides[currentSection]?.[currentField] || "Continue the conversation naturally.";

  return `You are "AI Resume Agent", an expert career coach and resume builder. Your goal is to help the user build a winning resume through a friendly, natural conversation.

CURRENT CONTEXT:
- **Section**: ${currentSection.toUpperCase()}
- **Field**: ${currentField.toUpperCase()}
- **Task**: ${currentGuide}

DATA COLLECTED SO FAR:
${JSON.stringify(collectedData, null, 2)}

INSTRUCTIONS:
1. **Be Conversational**: Don't just ask the question. Briefly acknowledge their previous answer (e.g., "That's a great university!", "Python is a very useful language.").
2. **One Question Only**: Ask exactly ONE question for the current field. Do not overwhelm the user.
3. **Be Helpful**: Occasionally offer a short 1-sentence tip relevant to the current field (e.g., "Recruiters love quantifiable achievements.").
4. **Handle Skips**: If they say "skip", "pass", "next", or "later", accept it immediately. Do not pressure them to answer.
5. **No Repetition**: The user's previous message is in your history. Do not ask for what they just told you.

Maintain a professional yet encouraging tone. Make them feel confident!`;
};

// Get the appropriate question based on state
const getNextQuestion = (currentSection, currentField) => {
  const questions = {
    personal: {
      name: "Hi! 👋 I'm your resume assistant. Let's build an amazing resume together! First, what's your full name?",
      location: "Great! Where are you located?",
      email: "What's the best email address to reach you?",
      phone: "And your phone number?",
      linkedin: "Do you have a LinkedIn profile? (You can share the URL or say 'skip')",
      github: "How about a GitHub profile? (Optional - say 'skip' if you don't have one)",
      website: "Do you have a personal website or portfolio? (Optional)",
    },
    education: {
      institution: "Perfect! Now let's talk about your education. What institution are you studying at or did you graduate from?",
      degree: "What degree and major are you pursuing or did you complete?",
      startDate: "When did you start?",
      endDate: "When did/will you graduate?",
      gpa: "Would you like to mention your GPA? (Optional - say 'skip' if you prefer not to)",
      coursework: "Any relevant coursework you'd like to highlight? (Optional)",
      addMore: "Would you like to add another degree or education?",
    },
    experience: {
      company: "Great! Now let's add your work experience. What company did you work for?",
      position: "What was your position or role?",
      location: "Where was this job located? (City, State or 'Remote')",
      startDate: "When did you start?",
      endDate: "When did you finish? (or say 'present' if you're still working there)",
      highlights: "What were your main responsibilities and achievements? You can list multiple points separated by commas.",
      addMore: "Would you like to add another work experience?",
    },
    projects: {
      name: "Awesome! Let's showcase your projects. What's the name of a project you're proud of?",
      link: "Do you have a link to this project? (GitHub, live demo, etc.)",
      date: "When did you work on this?",
      highlights: "Describe what the project does and your role in it.",
      technologies: "What technologies or tools did you use?",
      addMore: "Would you like to add another project?",
    },
    skills: {
      languages: "Almost done! What programming languages do you know?",
      technologies: "What frameworks, technologies, or tools are you familiar with?",
    },
    complete: "🎉 Awesome! I've collected all your information. Your resume is ready to be generated!",
  };

  return questions[currentSection]?.[currentField] || "Tell me more.";
};

const callGroqAPI = async (messages) => {
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
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROQ API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling GROQ API:", error);
    throw error;
  }
};

export const getAIResponse = async (
  userMessage,
  conversationState,
  collectedData,
  chatHistory
) => {
  const { currentSection, currentField, isComplete } = conversationState;

  if (isComplete) {
    return "🎉 Awesome! I've collected all your information. Your resume is ready to be generated!";
  }

  // If this is the start of conversation
  if (userMessage === "start" || chatHistory.length === 0) {
    return getNextQuestion("personal", "name");
  }

  // If asking "add more?" for arrays
  if (currentField === "addMore") {
    if (/yes|yeah|sure|yep|add|more/i.test(userMessage)) {
      return `Great! Let's add another ${currentSection.slice(0, -1)}. ${getNextQuestion(currentSection,
        currentSection === "education" ? "institution" :
          currentSection === "experience" ? "company" :
            "name"
      )}`;
    } else {
      // Moving to next section
      const sectionOrder = ["personal", "education", "experience", "projects", "skills"];
      const currentIndex = sectionOrder.indexOf(currentSection);
      const nextSection = sectionOrder[currentIndex + 1];

      if (nextSection) {
        const firstField = nextSection === "skills" ? "languages" :
          nextSection === "projects" ? "name" :
            nextSection === "experience" ? "company" :
              nextSection === "education" ? "institution" : "name";
        return getNextQuestion(nextSection, firstField);
      }
    }
  }

  // Build conversation context for GROQ
  const systemPrompt = getSystemPrompt(
    currentSection,
    currentField,
    collectedData
  );

  // Keep last 10 messages for context
  const recentHistory = chatHistory.slice(-10).map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
  ];

  try {
    const aiResponse = await callGroqAPI(messages);
    return aiResponse;
  } catch (error) {
    // Fallback to predefined questions if GROQ fails
    console.error("GROQ failed, using fallback question");
    return getNextQuestion(currentSection, currentField);
  }
};

// Extract data from user message
export const extractDataFromMessage = async (
  userMessage,
  expectedField,
  currentSection
) => {
  // Simple extraction for common cases
  const lowerMessage = userMessage.toLowerCase();

  // Check if user wants to skip
  if (
    lowerMessage.includes("skip") ||
    lowerMessage.includes("none") ||
    lowerMessage.includes("don't have") ||
    lowerMessage.includes("pass") ||
    lowerMessage.includes("later") ||
    lowerMessage.includes("next") ||
    lowerMessage === "no" ||
    lowerMessage === "n/a"
  ) {
    return "SKIP";
  }

  // Use GROQ for intelligent extraction
  const extractionPrompt = `Extract the ${expectedField} from the following user message. Return ONLY the extracted value, nothing else. No explanations, no formatting, just the raw value.

User message: "${userMessage}"

Expected field: ${expectedField}
Section: ${currentSection}

Rules:
- If the field is not clearly mentioned, return "SKIP"
- For names: extract the full name
- For emails: extract email address
- For dates: keep the format as user provided (e.g., "2023", "Jan 2024", "2023-2027")
- For phone numbers: keep as provided
- For URLs: extract the full URL or username
- For lists (highlights, coursework, technologies): return comma-separated values
- Remove any introductory phrases like "My name is", "I am", etc.
- Just return the pure value

Examples:
User: "My name is Raghav Kumar" → Return: "Raghav Kumar"
User: "I live in Panipat, Haryana" → Return: "Panipat, Haryana"
User: "raghav@email.com" → Return: "raghav@email.com"
User: "I worked on building a dashboard, improving performance, and leading a team" → Return: "building a dashboard, improving performance, leading a team"
User: "skip" → Return: "SKIP"

Now extract from the user message above:`;

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a data extraction assistant. Extract only the requested information, nothing more.",
      },
      { role: "user", content: extractionPrompt },
    ];

    const extracted = await callGroqAPI(messages);
    return extracted.trim();
  } catch (error) {
    console.error("Extraction failed:", error);
    // Fallback: return the message as-is (better than nothing)
    return userMessage.trim();
  }
};