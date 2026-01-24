// src/test/testGroq.js

import dotenv from "dotenv";
import { getAIResponse, extractDataFromMessage } from "../src/utils/groqService.js"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

dotenv.config();

const testGroq = async () => {
  console.log("Testing GROQ Service...\n");

  // Test 1: Get first question
  console.log("Test 1: Starting conversation");
  const firstMessage = await getAIResponse(
    "start",
    { currentSection: "personal", currentField: "name", isComplete: false },
    {},
    []
  );
  console.log("AI:", firstMessage);
  console.log("\n---\n");

  // Test 2: Extract name
  console.log("Test 2: Extracting name");
  const extractedName = await extractDataFromMessage(
    "My name is Raghav Kapoor",
    "name",
    "personal"
  );
  console.log("Extracted:", extractedName);
  console.log("\n---\n");

  // Test 3: Extract email
  console.log("Test 3: Extracting email");
  const extractedEmail = await extractDataFromMessage(
    "raghav@example.com",
    "email",
    "personal"
  );
  console.log("Extracted:", extractedEmail);
  console.log("\n---\n");

  console.log("✅ All tests completed!");
};

testGroq();