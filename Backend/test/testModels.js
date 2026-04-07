/**
 * ═══════════════════════════════════════════════════════════════════
 * MODEL TESTER — Tests all Groq models for availability & quality
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Run:  node test/testModels.js
 * 
 * Tests each model with a simple resume-related prompt and reports:
 * ✅ Working models (with response time & preview)
 * ❌ Failed models (with error reason)
 */

import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("❌ GROQ_API_KEY not found in .env");
  process.exit(1);
}

// All models to test
const MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "qwen/qwen3-32b",
  "moonshotai/kimi-k2-instruct",
  "openai/gpt-oss-20b",
  "moonshotai/kimi-k2-instruct-0905",
  "llama-3.1-8b-instant",
];

// Simple resume prompt to test quality
const TEST_MESSAGES = [
  {
    role: "system",
    content: "You are a resume assistant. Respond concisely in 1-2 sentences."
  },
  {
    role: "user",
    content: "Improve this resume bullet point: 'Worked on the backend of the application using Node.js'"
  }
];

// ═══════════════════════════════════════════════════════════════════
// TEST A SINGLE MODEL
// ═══════════════════════════════════════════════════════════════════
async function testModel(model) {
  const start = Date.now();
  
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: TEST_MESSAGES,
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      const errBody = await response.text();
      return {
        model,
        status: "FAIL",
        elapsed,
        error: `HTTP ${response.status}: ${errBody.slice(0, 150)}`,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "(empty response)";
    const tokens = data.usage;

    return {
      model,
      status: "OK",
      elapsed,
      reply: reply.slice(0, 200),
      tokens: tokens ? `${tokens.prompt_tokens}→${tokens.completion_tokens} tok` : "n/a",
    };
  } catch (err) {
    return {
      model,
      status: "FAIL",
      elapsed: Date.now() - start,
      error: err.message.slice(0, 150),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════
async function runTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  GROQ MODEL TESTER — Testing all configured models");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`  Models:  ${MODELS.length}`);
  console.log(`  Prompt:  "${TEST_MESSAGES[1].content.slice(0, 60)}..."`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const results = [];

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    process.stdout.write(`[${i + 1}/${MODELS.length}] Testing ${model}... `);
    
    const result = await testModel(model);
    results.push(result);

    if (result.status === "OK") {
      console.log(`✅ ${result.elapsed}ms (${result.tokens})`);
      console.log(`    → ${result.reply}\n`);
    } else {
      console.log(`❌ ${result.elapsed}ms`);
      console.log(`    → ${result.error}\n`);
    }

    // Small delay to avoid rate limiting between tests
    if (i < MODELS.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");

  const working = results.filter(r => r.status === "OK");
  const failed = results.filter(r => r.status === "FAIL");

  if (working.length > 0) {
    console.log(`\n  ✅ WORKING (${working.length}/${MODELS.length}):`);
    working
      .sort((a, b) => a.elapsed - b.elapsed)
      .forEach((r, i) => {
        console.log(`     ${i + 1}. ${r.model} — ${r.elapsed}ms (${r.tokens})`);
      });
  }

  if (failed.length > 0) {
    console.log(`\n  ❌ FAILED (${failed.length}/${MODELS.length}):`);
    failed.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.model} — ${r.error.slice(0, 80)}`);
    });
  }

  // Recommended order by speed
  if (working.length > 0) {
    console.log("\n  🏆 RECOMMENDED ORDER (by response time):");
    working
      .sort((a, b) => a.elapsed - b.elapsed)
      .forEach((r, i) => {
        console.log(`     ${i + 1}. "${r.model}"  (${r.elapsed}ms)`);
      });
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");
}

runTests().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
