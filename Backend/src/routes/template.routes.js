import express from "express";
import {
  getAllTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.get("/slug/:slug", getTemplateBySlug);

router.post("/", verifyJWT, createTemplate);
router.put("/:id", verifyJWT, updateTemplate);
router.delete("/:id", verifyJWT, deleteTemplate);

export default router;