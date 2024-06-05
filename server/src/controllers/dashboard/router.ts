import { Router } from "express";
import DashboardController from "./index";

const router = Router();

router.get("/citizens", DashboardController.getCitizens);

export default router;
