import express from "express";
import { getPublicResumeById } from "../controllers/public.controllers.js";

const router = express.Router();

router.get("/resumes/:id", getPublicResumeById);

export default router;
