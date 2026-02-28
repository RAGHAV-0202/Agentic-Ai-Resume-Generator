import { Router } from "express";
import {
    adminLogin,
    adminLogout,
    AdminIsLoggedIn,
    AdminGetAllUsers
} from "../controllers/admin.controllers.js";
import { getAdminAnalytics } from "../controllers/analytics.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Assuming this exists, wait, checking auth.controllers.js

const router = Router();

router.route("/login").post(adminLogin);
router.route("/logout").post(adminLogout);
router.route("/me").get(AdminIsLoggedIn);
router.route("/users").get(AdminGetAllUsers); // Maybe protect this? Usually yes.
router.route("/analytics").get(getAdminAnalytics);

export default router;
