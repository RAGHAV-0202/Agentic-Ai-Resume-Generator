import express from "express";
import {
  sendMessage,
  resetConversation,
  startConversation,
} from "../controllers/chat.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

router.post("/", sendMessage);
router.post("/start", startConversation);
router.post("/reset/:resumeId", resetConversation);

export default router;