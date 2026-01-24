import dotenv from "dotenv"
dotenv.config()

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant"; 

// System prompt that guides the AI based on current state
const getSystemPrompt = (currentSection, currentField, collectedData) => {
  const sectionGuides = {
    personal: {
      name: "Ask for the user's full name in a friendly way.",
      location: "Ask where they are currently located (city, state/country).",
      email: "Ask for their email address.",
      phone: "Ask for their phone number.",
      linkedin: "Ask if they have a LinkedIn profile (optional). They can skip if they don't have one.",
      github: "Ask if they have a GitHub profile (optional).",
      website: "Ask if they have a personal website or portfolio (optional).",
    },
    education: {
      institution: "Ask what educational institution they attended or are attending.",
      degree: "Ask what degree and major they are pursuing or completed.",
      startDate: "Ask when they started (e.g., '2023' or 'Sept 2023').",
      endDate: "Ask when they graduated or will graduate (e.g., '2027' or 'May 2027').",
      gpa: "Ask if they want to mention their GPA (optional, can skip).",
      coursework: "Ask if they want to list relevant coursework (optional).",
    },
    experience: {
      company: "Ask what company they worked for.",
      position: "Ask what their position or role was.",
      location: "Ask where the job was located (city, state or 'Remote').",
      startDate: "Ask when they started this position.",
      endDate: "Ask when they finished (or say 'present' if still working).",
      highlights: "Ask them to describe their main responsibilities and achievements. They can list multiple points.",
    },
    projects: {
      name: "Ask what the project name is.",
      link: "Ask if they have a link to the project (GitHub, live demo, etc.). Optional.",
      date: "Ask when they worked on this project.",
      highlights: "Ask them to describe what the project does and their role.",
      technologies: "Ask what technologies or tools they used for this project.",
    },
    skills: {
      languages: "Ask what programming languages they know.",
      technologies: "Ask what frameworks, technologies, or tools they are familiar with.",
    },
  };

  const currentGuide = sectionGuides[currentSection]?.[currentField] || "Continue the conversation naturally.";

  return `You are a professional, friendly resume-building assistant. Your job is to help users create their resume by asking questions ONE AT A TIME.

CURRENT SECTION: ${currentSection}
CURRENT FIELD: ${currentField}

CURRENT TASK: ${currentGuide}

DATA COLLECTED SO FAR:
${JSON.stringify(collectedData, null, 2)}

IMPORTANT RULES:
1. Ask ONE question at a time - be conversational and friendly
2. Keep questions short and clear
3. If the user provides information for the current field, acknowledge it briefly and move on
4. If user says "skip", "none", or "I don't have one", acknowledge and move to next question
5. Use a friendly, encouraging tone
6. Use emojis sparingly (max 1 per message)
7. Don't repeat information the user already provided
8. For array fields like highlights or coursework, if user provides comma-separated items, accept them all

EXAMPLES:
- Bad: "What is your full legal name as it appears on official documents?"
- Good: "What's your full name?"

- Bad: "Please provide your current residential location including city and state."
- Good: "Where are you located?"

Keep it natural and conversational!`;
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
    { role: "user", content: userMessage },
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