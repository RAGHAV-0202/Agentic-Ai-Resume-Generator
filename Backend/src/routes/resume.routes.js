import express from "express";
import {
  createResume,
  getUserResumes,
  getResumeById,
  deleteResume,
  setResumeTemplate,
  createResumeWithPreview,
} from "../controllers/resume.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// router.post("/", createResume);
router.post("/" , createResumeWithPreview)
router.get("/", getUserResumes);
router.get("/:id", getResumeById);
router.delete("/:id", deleteResume);
router.put("/:id/template", setResumeTemplate);

export default router;