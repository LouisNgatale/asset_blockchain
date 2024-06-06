import authRouter from "./auth/router";
import dashboardRouter from "./dashboard/router";
import assetsRouter from "./assets/router";
import { Router } from "express";
import { jwtAuthentication } from "../middlewares/auth";

const router = Router();

router.use("/auth", authRouter);
router.use("/dashboard", jwtAuthentication, dashboardRouter);
router.use("/assets", jwtAuthentication, assetsRouter);

export default router;
