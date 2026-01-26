import express from "express";
import { generatePDF, downloadPDF, getPDFUrl , recompilePDF} from "../controllers/pdf.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/generate/:resumeId", generatePDF);
router.get("/download/:resumeId", downloadPDF);
router.get("/:resumeId", getPDFUrl);
router.post("/recompile/:resumeId", recompilePDF); 

export default router;