import dotenv from "dotenv"
dotenv.config()

import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

// MOCK DATA DETECTION - More comprehensive list
const MOCK_VALUES = [
  "John Doe", "Jane Doe", "john.doe@example.com", "jane.doe@example.com",
  "San Francisco, CA", "San Francisco", "+1 (555) 123-4567", "(555) 123-4567",
  "linkedin.com/in/johndoe", "github.com/johndoe", "johndoe.dev",
  "University of California, Berkeley", "UC Berkeley", "Berkeley",
  "Bachelor of Science in Computer Science", "B.S. in Computer Science",
  "Tech Innovations Inc.", "Tech Innovations", "Software Engineer",
  "E-Commerce Platform", "Task Management App", "example.com",
  "Present", "June 2022", "2018", "2022", "3.8/4.0"
];

// Enhanced skip detection
const isSkipRequest = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  const skipPatterns = [
    /^skip$/i,
    /^pass$/i,
    /^next$/i,
    /^n\/a$/i,
    /^na$/i,
    /^no$/i,
    /^nope$/i,
    /^nothing$/i,
    /skip (this|it)/i,
    /don'?t have/i,
    /do not have/i,
    /i don'?t/i,
    /not applicable/i,
    /leave (it )?blank/i,
    /leave (it )?empty/i,
    /i'?ll skip/i,
    /let'?s skip/i,
    /move on/i,
    /go to next/i,
  ];

  return skipPatterns.some(pattern => pattern.test(lowerMessage));
};

// Check if data contains mock values
const containsMockData = (value) => {
  if (!value || value === "") return true;
  if (typeof value === 'string') {
    return MOCK_VALUES.some(mock =>
      value.toLowerCase().includes(mock.toLowerCase())
    );
  }
  return false;
};

// Recursively clean mock data from collected data
const cleanMockData = (data, seen = new WeakSet()) => {
  if (data === null || data === undefined) return null;

  if (typeof data === 'string') {
    if (data === "__SKIPPED__") return ""; // Strip skipped values
    return containsMockData(data) ? "" : data;
  }

  if (typeof data === 'object') {
    if (seen.has(data)) return null;
    seen.add(data);
  }

  if (Array.isArray(data)) {
    return data
      .map(item => cleanMockData(item, seen))
      .filter(item => {
        if (typeof item === 'string') return item !== "";
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).some(v => v !== "" && v !== null);
        }
        return true;
      });
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (typeof data === 'object') {
    const cleaned = {};
    for (const key in data) {
      // Skip Mongoose internal properties and prototype properties
      if (Object.prototype.hasOwnProperty.call(data, key) && !key.startsWith('$') && !key.startsWith('_')) {
        const cleanedValue = cleanMockData(data[key], seen);
        // Only include non-empty values
        if (cleanedValue !== null && cleanedValue !== "" &&
          !(Array.isArray(cleanedValue) && cleanedValue.length === 0)) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  return data;
};

// Get system prompt based on current state
const getSystemPrompt = (currentSection, currentField, collectedData) => {
  const sectionGuides = {
    personal: {
      name: "Ask for their full name warmly and professionally.",
      location: "Ask for their city and state/country. Mention this helps with location-based opportunities.",
      email: "Ask for their professional email address.",
      phone: "Ask for their phone number with country code.",
      linkedin: "Ask for their LinkedIn profile URL. This is optional but recommended for credibility.",
      github: "Ask for their GitHub username or URL. Optional but great for developers.",
      website: "Ask if they have a personal website or portfolio. Completely optional.",
    },
    education: {
      institution: "Ask for the name of their university or college.",
      degree: "Ask for their degree and major/field of study (e.g., B.Tech in Computer Science).",
      startDate: "Ask when they started this degree (year is fine).",
      endDate: "Ask when they graduated or expect to graduate.",
      gpa: "Ask for their GPA. Make it clear this is optional.",
      coursework: "Ask for relevant coursework. Optional - only if relevant to their career goals.",
    },
    experience: {
      company: "Ask for the company or organization name.",
      position: "Ask for their job title or role.",
      location: "Ask where the job was located (city/state or 'Remote').",
      startDate: "Ask when they started this position.",
      endDate: "Ask when they left or if they're currently working there (use 'Present').",
      highlights: "Ask for 2-4 key achievements or responsibilities. Encourage action verbs and quantifiable results.",
    },
    projects: {
      name: "Ask for a project name they're proud of.",
      link: "Ask for a GitHub repo, live demo URL, or any project link. Optional.",
      date: "Ask when they worked on this project.",
      highlights: "Ask them to describe what the project does and their role/contribution.",
      technologies: "Ask for the tech stack or tools used (e.g., React, Python, AWS).",
    },
    skills: {
      languages: "Ask for programming languages they're proficient in (e.g., Python, JavaScript, Java).",
      technologies: "Ask for frameworks, tools, and technologies they know (e.g., React, Docker, AWS).",
    },
    achievements: "Ask for notable achievements, awards, or recognitions (e.g., hackathon wins, scholarships, certifications).",
    publications: "Ask if they have any research publications, papers, or articles. Optional.",
  };

  const currentGuide = sectionGuides[currentSection]?.[currentField] ||
    sectionGuides[currentSection] ||
    "Continue the conversation naturally.";

  // Count how much real data we have
  const cleanData = cleanMockData(collectedData);
  const hasRealData = cleanData && Object.keys(cleanData).length > 0;

  return `You are "ResumeAI", an expert career coach helping users build professional resumes through natural conversation.

CURRENT CONTEXT:
- Section: ${currentSection.toUpperCase()}
- Field: ${currentField.toUpperCase()}
- Task: ${currentGuide}

${hasRealData ? `REAL DATA COLLECTED:
${JSON.stringify(cleanData, null, 2)}` : 'No real data collected yet - this is the start of the conversation.'}

CRITICAL INSTRUCTIONS:

1. **IGNORE ALL MOCK/PLACEHOLDER DATA**: Any data like "John Doe", "University of California", "Tech Innovations Inc.", "San Francisco, CA", "john.doe@example.com" is MOCK DATA. Treat it as if the field is empty.

2. **HANDLE SKIP REQUESTS**: If user says "skip", "pass", "next", "I don't have", "n/a", "leave it blank", or similar, IMMEDIATELY acknowledge and move forward. Say something like "No problem, we can skip that. Let's move on!"

3. **BE CONVERSATIONAL**: 
   - Acknowledge their previous answer briefly (e.g., "Great choice!", "That sounds impressive!")
   - Ask ONE clear question at a time
   - Be encouraging and supportive
   - Use their name if you know it

4. **PROVIDE HELPFUL TIPS**: Occasionally add a 1-sentence tip:
   - For experience: "Recruiters love seeing quantifiable achievements with numbers!"
   - For projects: "Including a live demo link can really make your project stand out."
   - For skills: "Focus on technologies you've used in real projects."

5. **NO REPETITION**: Never ask for information they just provided in their last message.

6. **NATURAL TRANSITIONS**: When moving between sections, provide smooth transitions like:
   - "Great job on the personal info! Now let's talk about your education."
   - "Awesome projects! Let's wrap up with your skills."

7. **OPTIONAL FIELDS**: Always make it clear when a field is optional. Say things like:
   - "This is optional, but do you have..."
   - "Feel free to skip if you don't have..."

Keep responses warm, professional, and encouraging. Make them excited about building their resume!`;
};

// Get appropriate question based on current state
const getNextQuestion = (currentSection, currentField, userName = null) => {
  const greeting = userName ? `${userName}` : "there";

  const questions = {
    personal: {
      name: `Hi! 👋 I'm ResumeAI, your personal resume assistant. I'm here to help you build an amazing resume through a friendly chat. Let's start with the basics - what's your full name?`,
      location: `Thanks${userName ? `, ${userName}` : ''}! Where are you currently located? (City, State/Country)`,
      email: `Great! What's your professional email address?`,
      phone: `What's the best phone number to reach you? (Include country code if outside US)`,
      linkedin: `Do you have a LinkedIn profile? If so, share the URL. (Feel free to skip if you don't have one)`,
      github: `How about a GitHub profile? This is great for showcasing your code! (Optional - type 'skip' if you don't have one)`,
      website: `Do you have a personal website or portfolio? (Completely optional)`,
    },
    education: {
      institution: `Perfect! Now let's talk about your education. 🎓 What university or college did you attend (or are currently attending)?`,
      degree: `What degree and major are you pursuing or did you complete? (e.g., Bachelor of Science in Computer Science)`,
      startDate: `When did you start this degree? (Year is fine)`,
      endDate: `When did/will you graduate? (Year or 'Expected 2025')`,
      gpa: `Would you like to include your GPA? This is optional - only include it if it's strong (3.5+). Type 'skip' if you prefer not to.`,
      coursework: `Any relevant coursework you'd like to highlight? (Optional - only include courses relevant to your target role)`,
      addMore: `Would you like to add another degree or educational qualification? (yes/no)`,
    },
    experience: {
      company: `Excellent! Now let's add your work experience. 💼 What's the name of the company you worked for?`,
      position: `What was your job title or role?`,
      location: `Where was this position located? (e.g., 'New York, NY' or 'Remote')`,
      startDate: `When did you start this role? (e.g., 'January 2023' or 'Jan 2023')`,
      endDate: `When did you leave this role? (Use 'Present' if you're still working there)`,
      highlights: `Great! Now for the important part - what were your key achievements and responsibilities? Share 2-4 bullet points. 

💡 Tip: Start with action verbs (Led, Developed, Increased) and include numbers when possible (e.g., "Increased sales by 30%")`,
      addMore: `Would you like to add another work experience? (yes/no)`,
    },
    projects: {
      name: `Awesome! Let's showcase your projects. 🚀 What's the name of a project you're proud of?`,
      link: `Do you have a link to this project? (GitHub repo, live demo, etc.) - Type 'skip' if you don't have one.`,
      date: `When did you work on this project? (e.g., '2023' or 'Summer 2023')`,
      highlights: `Describe what this project does and what your main contributions were. What problem does it solve?`,
      technologies: `What technologies or tools did you use to build this? (e.g., React, Node.js, MongoDB, AWS)`,
      addMore: `Would you like to add another project? (yes/no)`,
    },
    skills: {
      languages: `Almost there! 🎯 What programming languages are you proficient in? (e.g., Python, JavaScript, Java)`,
      technologies: `What frameworks, tools, and technologies do you work with? (e.g., React, Docker, AWS, Git)`,
    },
    achievements: `Do you have any notable achievements, awards, or certifications you'd like to include? (e.g., hackathon wins, scholarships, Dean's List) - This is optional!`,
    publications: `Finally, do you have any research publications, papers, or articles? (Optional - type 'skip' if none)`,
    complete: `🎉 Congratulations${userName ? `, ${userName}` : ''}! I've collected all your information. Your resume data is complete and ready to be formatted into a professional PDF!`,
  };

  return questions[currentSection]?.[currentField] || "Tell me more about that.";
};

// Call GROQ API
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GROQ API error: ${response.status} - ${errorText}`);
      throw new Error(`GROQ API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("GROQ API call failed:", error);
    return null;
  }
};

/**
 * Optimize experience highlight with AI
 */
export const optimizeExperienceHighlight = async (rawHighlight) => {
  const prompt = `Rewrite this work achievement to be more impactful and ATS-friendly:

"${rawHighlight}"

Rules:
1. Start with a strong action verb (Led, Developed, Implemented, Achieved, Increased, etc.)
2. Keep it concise (1-2 lines maximum)
3. Focus on impact and results
4. Use professional language
5. If numbers are mentioned, keep them; if not, DON'T add fake numbers
6. Return ONLY the improved version, no explanations

Improved version:`;

  const messages = [
    {
      role: "system",
      content: "You are an expert resume writer. Provide only the improved version, nothing else.",
    },
    { role: "user", content: prompt },
  ];

  const optimized = await callGroqAPI(messages);
  return optimized || rawHighlight;
};

/**
 * Optimize project description
 */
export const optimizeProjectDescription = async (rawDescription) => {
  const prompt = `Enhance this project description for a resume:

"${rawDescription}"

Rules:
1. Keep it concise (1-2 sentences)
2. Emphasize technical skills and problem-solving
3. Highlight the value created
4. Use professional language
5. DON'T invent features not mentioned
6. Return ONLY the improved version

Improved version:`;

  const messages = [
    {
      role: "system",
      content: "You are an expert at writing technical project descriptions. Provide only the improved version.",
    },
    { role: "user", content: prompt },
  ];

  const optimized = await callGroqAPI(messages);
  return optimized || rawDescription;
};

/**
 * Main AI response function
 */
export const getAIResponse = async (
  userMessage,
  conversationState,
  collectedData,
  chatHistory
) => {
  const { currentSection, currentField, isComplete } = conversationState;

  // If conversation is complete
  if (isComplete) {
    const userName = collectedData?.personal?.name || null;
    return getNextQuestion("complete", null, userName);
  }

  // Handle conversation start
  if (userMessage === "start" || chatHistory.length === 0) {
    return getNextQuestion("personal", "name");
  }

  // Clean mock data from collected data
  let plainData = collectedData;
  try {
    plainData = JSON.parse(JSON.stringify(collectedData));
  } catch (e) {
    console.error("Error parsing collectedData:", e);
  }

  const cleanData = cleanMockData(plainData);
  const userName = cleanData?.personal?.name || null;

  // Build conversation context
  const systemPrompt = getSystemPrompt(currentSection, currentField, cleanData);

  // Keep last 8 messages for context (more recent context)
  const recentHistory = chatHistory.slice(-8).map((msg) => ({
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

    // Fallback if AI fails
    if (!aiResponse) {
      return getNextQuestion(currentSection, currentField, userName);
    }

    return aiResponse;
  } catch (error) {
    console.error("GROQ failed, using fallback question:", error);
    return getNextQuestion(currentSection, currentField, userName);
  }
};

/**
 * Enhanced data extraction from user message
 */
export const extractDataFromMessage = async (
  userMessage,
  expectedField,
  currentSection
) => {
  // First check if it's a skip request
  if (isSkipRequest(userMessage)) {
    return "SKIP";
  }

  // Use GROQ for intelligent extraction
  const extractionPrompt = `Extract the "${expectedField}" value from this user message. Return ONLY the extracted value with NO explanations, NO quotes, NO formatting.

User message: "${userMessage}"
Expected field: ${expectedField}
Section: ${currentSection}

Extraction Rules:
- Return ONLY the pure extracted value
- NO explanatory text, NO "The value is:", NO quotes
- For names: Extract full name only (e.g., "Raghav Kumar")
- For emails: Extract email address only (e.g., "raghav@email.com")
- For dates: Keep user's format (e.g., "2023", "Jan 2024", "2020-2024")
- For phone: Keep as provided with country code if given
- For URLs: Extract the full URL or just username/handle
- For lists (highlights, coursework, technologies): Return comma-separated values WITHOUT bullets or numbers
- Remove phrases like "My name is", "I am", "It is", "The company is", etc.
- If the message is conversational but contains the info, extract just the relevant part
- If unclear or not mentioned, return exactly: SKIP

Examples:
"My name is Raghav Kumar" → Raghav Kumar
"I live in Panipat, Haryana, India" → Panipat, Haryana, India
"raghav.kumar@gmail.com" → raghav.kumar@gmail.com
"I worked on building a dashboard, improving performance by 40%, and leading a team of 3" → building a dashboard, improving performance by 40%, leading a team of 3
"B.Tech in Computer Science" → B.Tech in Computer Science
"I started in June 2022" → June 2022
"skip this" → SKIP
"I don't have one" → SKIP

Extract now:`;

  try {
    const messages = [
      {
        role: "system",
        content: "You are a precise data extraction assistant. Extract ONLY the requested value with NO additional text whatsoever.",
      },
      { role: "user", content: extractionPrompt },
    ];

    const extracted = await callGroqAPI(messages);

    if (!extracted) {
      return userMessage.trim();
    }

    const trimmed = extracted.trim();

    // Double-check if the AI returned "SKIP" or similar
    if (isSkipRequest(trimmed)) {
      return "SKIP";
    }

    // Remove common prefixes the AI might add despite instructions
    const cleanedExtraction = trimmed
      .replace(/^(the |a |an |my |i am |i'm |it is |it's |this is )/i, '')
      .trim();

    return cleanedExtraction || userMessage.trim();
  } catch (error) {
    console.error("Extraction failed:", error);
    return userMessage.trim();
  }
};

/**
 * Suggest improvements for a complete section
 */
export const suggestSectionImprovements = async (section, data) => {
  if (section === "experience" && data.highlights && Array.isArray(data.highlights)) {
    const optimizedHighlights = [];

    for (const highlight of data.highlights) {
      if (highlight && !containsMockData(highlight)) {
        const optimized = await optimizeExperienceHighlight(highlight);
        optimizedHighlights.push(optimized);
      }
    }

    return { ...data, highlights: optimizedHighlights };
  }

  if (section === "projects" && data.highlights && Array.isArray(data.highlights)) {
    const optimizedHighlights = [];

    for (const highlight of data.highlights) {
      if (highlight && !containsMockData(highlight)) {
        const optimized = await optimizeProjectDescription(highlight);
        optimizedHighlights.push(optimized);
      }
    }

    return { ...data, highlights: optimizedHighlights };
  }

  return data;
};

// Export helper functions for use in other modules
export { isSkipRequest, containsMockData, cleanMockData };