import express from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { UserLogin , UserRegister , UserLogout , isLoggedIn} from "../controllers/auth.controllers.js"
const router = express.Router()

router.route("/login").post(UserLogin)
router.route("/register").post(UserRegister)
router.route("/logout").post(UserLogout)
router.route("/isLoggedIn").get(isLoggedIn)

export default router