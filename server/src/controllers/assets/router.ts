import { Router } from "express";
import AssetsController from "./index";

const router = Router();

router.post("", AssetsController.createAsset);
router.get("", AssetsController.fetchAssets);

export default router;
