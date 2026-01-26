import express from "express";
import {
  getAllTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controllers.js"
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/", getAllTemplates);
router.get("/:id", getTemplateById);
router.get("/slug/:slug", getTemplateBySlug);

// Admin Protected Routes
router.post("/", verifyAdminJWT, upload.single("thumbnail"), createTemplate);
router.put("/:id", verifyAdminJWT, upload.single("thumbnail"), updateTemplate);
router.delete("/:id", verifyAdminJWT, deleteTemplate);

export default router;