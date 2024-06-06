import authRouter from "./auth/router";
import dashboardRouter from "./dashboard/router";
import assetsRouter from "./assets/router";
import { Router } from "express";

const router = Router();

router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/assets", assetsRouter);

export default router;
