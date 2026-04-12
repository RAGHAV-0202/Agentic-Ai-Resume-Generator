import fetch from "node-fetch";

const ACTUAL_API_BASE = "https://apiresume.repolens.xyz/api";

const CONVERSATION = [
  "Hi, let's build my resume.",
  "My name is Remote Tester. Email is tester-bot@repolens.xyz.",
  "Phone is +1 555-000-0000, and I live in Web Server 4.",
  "My LinkedIn is linkedin.com/in/remotetester and GitHub is github.com/remotetester",
  "Let's add education. I went to Remote University for B.S. in Computer Science.",
  "From Aug 2018 to May 2022. I had a 4.0 GPA.",
  "Coursework was System Architecture and API Testing.",
  "No more education. Let's do experience.",
  "I work at Repolens QA as a Quality Assurance Bot.",
  "I work remotely on the web. Started June 2022 and still working here.",
  "My key achievements were verifying backend stability and testing rate limits for LLMs.",
  "No more experience.",
  "I built Agentic Backend Tester.",
  "No link. I built it in Jan 2024.",
  "Built an LLM validation payload harness using React, Node.js and Groq.",
  "React, Node.js, Groq.",
  "No more projects.",
  "I know JavaScript and Python.",
  "Express, Node.js, Mocha, Chai.",
  "skip",
  "skip",
  "skip",
  "None."
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function testRemoteAPI() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  TESTING HOSTED BACKEND OVER HTTP (CONVERSATIONAL MODE)   ");
  console.log("  Endpoint: " + ACTUAL_API_BASE);
  console.log("═══════════════════════════════════════════════════════════");

  try {
    const testUser = {
      name: "Remote Tester",
      email: "tester-" + Date.now() + "@repolens.xyz",
      password: "TestPassword123!"
    };

    console.log("\\n👤 [1/4] Registering test user account...");
    const regRes = await fetch(ACTUAL_API_BASE + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser)
    });
    
    if (!regRes.ok) throw new Error("Registration failed: " + await regRes.text());
    const regData = await regRes.json();
    const token = regData.data.accessToken;
    console.log("   ✅ User registered. Got Access Token.");

    console.log("\\n📄 [2/4] Creating blank resume...");
    const createRes = await fetch(ACTUAL_API_BASE + "/resume", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name: "Automated API Test Resume" })
    });
    if (!createRes.ok) throw new Error("Resume creation failed: " + await createRes.text());
    const createData = await createRes.json();
    const resumeId = createData.data._id || createData.data?.resume?._id;
    console.log("   ✅ Blank Resume created. Resume ID: " + resumeId);

    console.log("\\n🤖 [3/4] Starting Agentic Conversation...");
    const startRes = await fetch(ACTUAL_API_BASE + "/agent/start", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ resumeId })
    });

    if (!startRes.ok) throw new Error("Failed to start: " + await startRes.text());
    const startData = await startRes.json();
    console.log("   ✅ Conversation started.");
    
    console.log("\\n📝 Agent Initial Prompt: " + (startData.data?.aiMessage || startData.data?.response || "Let's begin!"));

    console.log("\\n📡 [4/4] Firing sequential conversation to LLM...");
    for (let i = 0; i < CONVERSATION.length; i++) {
        const userMsg = CONVERSATION[i];
        console.log("\\n💬 User [msg " + (i + 1) + "]: " + userMsg);

        const startLLMTime = Date.now();
        const msgRes = await fetch(ACTUAL_API_BASE + "/agent/message", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
              resumeId,
              message: userMsg
            })
        });

        const elapsed = ((Date.now() - startLLMTime) / 1000).toFixed(2);
        
        if (!msgRes.ok) {
            console.error("   ❌ Request failed (" + elapsed + "s): " + await msgRes.text());
            break;
        }
        
        const msgData = await msgRes.json();
        console.log("   ✅ Response (" + elapsed + "s) -> 🤖 Agent:");
        console.log("   \\\"" + msgData.data.response + "\\\"");

        await sleep(2000); 
    }

    console.log("\\n✅ ALL REMOTE CONVERSATION TESTS FINISHED!");

  } catch (error) {
    console.error("\\n❌ REMOTE API TEST FAILED:", error.message);
  }
}

testRemoteAPI();
