// src/routes/agent.routes.js

import express from "express";
import {
  startAgenticConversation,
  sendAgenticMessage,
  updateResumeData,
  getConversationStatus,
  // resetAgenticConversation,
  skipCurrentField,
} from "../controllers/agent.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);


router.post("/start", startAgenticConversation);


router.post("/message", sendAgenticMessage);


router.post("/update", updateResumeData);


router.get("/status/:resumeId", getConversationStatus);


// router.post("/reset/:resumeId", resetAgenticConversation);


router.post("/skip", skipCurrentField);

export default router;