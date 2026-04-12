import express from "express";
import {
  getUserResumes,
  getResumeById,
  deleteResume,
  setResumeTemplate,
  createResumeWithPreview,
  updateResumeData,
  updateResumeName,
} from "../controllers/resume.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// router.post("/", createResume);
router.post("/", createResumeWithPreview)
router.get("/", getUserResumes);
router.put("/:id/name", updateResumeName);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);
router.put("/:id/template", setResumeTemplate);
router.patch("/:id/data", updateResumeData);

export default router;