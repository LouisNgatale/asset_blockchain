import { Router } from "express";
import DashboardController from "./index";

const router = Router();

router.get("/citizens", DashboardController.getCitizens);
router.get("/stats", DashboardController.getStats);

export default router;
