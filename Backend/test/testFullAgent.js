import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createAgent } from "../src/utils/agentSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("❌ GROQ_API_KEY not found in .env");
  process.exit(1);
}

const agent = createAgent(API_KEY);

const RAW_RESUME_TEXT = `
Hi, I want to build my resume. Here is all my information at once:

Name: Alex Carter
Email: alex.carter@example.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/alexcarter
GitHub: github.com/alexcarter

Education:
University of California, Berkeley
B.S. Computer Science
Started: Aug 2018
Ended: May 2022
GPA: 3.9
Coursework: Data Structures, Algorithms, Operating Systems, Machine Learning

Experience:
Company: TechCorp Industries
Position: Backend Software Engineer
Location: San Francisco, CA
Started: June 2022
Ended: Present
Highlights:
- Designed and implemented scalable microservices using Node.js and Express.
- Optimized database queries in PostgreSQL, reducing average response time by 40%.
- Migrated legacy authentication to OAuth2, improving security for 100k+ active users.

Projects:
Project: Agentic Resume Generator
Link: github.com/alexcarter/resume-gen
Date: Jan 2024
Highlights:
- Built an AI-powered SaaS application using React and Node.js.
- Integrated Groq API for lightning-fast multi-turn conversational agents.
Technologies: React, Node.js, Groq, MongoDB

Skills:
Languages: JavaScript, Python, Java, C++
Frameworks: React, Express, Node.js, Next.js
Tools: Git, Docker, AWS, GitHub Actions
Libraries: Mongoose, TailwindCSS

Achievements:
- First Place Winner, Hack the North 2023
- AWS Certified Solutions Architect
`;

async function runTest() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  AGENTIC RESUME GENERATOR — FULL RESUME TEST");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Simulating a user pasting an entire resume at once...");
  
  const start = Date.now();
  let resumeData = {};
  let conversationHistory = [];

  try {
    const result = await agent.processMessage(
      RAW_RESUME_TEXT,
      resumeData,
      conversationHistory,
      "personal"
    );

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log("\n✅ API Call Completed Successfully!");
    console.log(`⏱️  Time taken: ${elapsed} seconds.`);
    console.log(`\n🤖 Agent's next question/response:\n"${result.nextQuestion}"`);
    console.log(`\n📊 Extracted Fields: ${result.extractedFields.length}`);
    
    console.log("\n📄 Final Compiled Resume Data:");
    console.log(JSON.stringify(result.updatedData, null, 2));
    
  } catch (error) {
    console.error("\n❌ Agent Processing Failed:");
    console.error(error);
  }
}

runTest();
