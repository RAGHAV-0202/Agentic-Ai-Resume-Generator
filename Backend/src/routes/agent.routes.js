// src/routes/agent.routes.js

import express from "express";
import {
  startAgenticConversation,
  sendAgenticMessage,
  updateResumeData,
  getConversationStatus,
  resetAgenticConversation,
  skipCurrentField,
} from "../controllers/agent.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Start a new agentic conversation
router.post("/start", startAgenticConversation);

// Send a message (core agentic endpoint)
router.post("/message", sendAgenticMessage);

// Update specific data via natural language
router.post("/update", updateResumeData);

// Get conversation status and completion
router.get("/status/:resumeId", getConversationStatus);

// Reset conversation and start over
router.post("/reset/:resumeId", resetAgenticConversation);

// Skip current field
router.post("/skip", skipCurrentField);

export default router;