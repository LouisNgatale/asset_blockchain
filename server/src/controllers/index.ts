import authRouter from "./auth/router";
import dashboardRouter from "./dashboard/router";
import { Router } from "express";

const router = Router();

router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);

export default router;
