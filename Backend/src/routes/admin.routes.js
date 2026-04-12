import { Router } from "express";
import {
    adminLogin,
    adminLogout,
    AdminIsLoggedIn,
    AdminGetAllUsers,
    AdminGetAllResumes,
    AdminGetResumeById,
    AdminGenerateResumePdf
} from "../controllers/admin.controllers.js";
import { getAdminAnalytics } from "../controllers/analytics.controllers.js";
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";

const router = Router();

router.route("/login").post(adminLogin);
router.route("/logout").post(verifyAdminJWT, adminLogout);
router.route("/me").get(verifyAdminJWT, AdminIsLoggedIn);
router.route("/users").get(verifyAdminJWT, AdminGetAllUsers);
router.route("/resumes").get(verifyAdminJWT, AdminGetAllResumes);
router.route("/resumes/:resumeId").get(verifyAdminJWT, AdminGetResumeById);
router.route("/resumes/:resumeId/pdf").post(verifyAdminJWT, AdminGenerateResumePdf);
router.route("/analytics").get(verifyAdminJWT, getAdminAnalytics);

export default router;
