import express from "express";
import {
  getUserResumes,
  getResumeById,
  deleteResume,
  setResumeTemplate,
  createResumeWithPreview,
  updateResumeData,
} from "../controllers/resume.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// router.post("/", createResume);
router.post("/", createResumeWithPreview)
router.get("/", getUserResumes);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);
router.put("/:id/template", setResumeTemplate);
router.patch("/:id/data", updateResumeData);

export default router;