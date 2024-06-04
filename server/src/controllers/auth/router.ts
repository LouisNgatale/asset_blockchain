import { Router } from "express";
import AuthController from "./index";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/login-staff", AuthController.loginStaff);

export default router;
