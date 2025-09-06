import express from "express";
import multer from "multer";
import { scanFile } from "../controllers/scanFile.controller";
import { checkNetwork } from "../controllers/checkNetwork.controller";
import { getMyLogs, getAllLogs } from "../controllers/getMyLogs.controller";
import { requireAuth } from "../middleware/auth";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/scan", requireAuth, upload.single("file"), scanFile);
router.post("/network", requireAuth, checkNetwork);
router.get("/logs", requireAuth, getMyLogs);
router.get("/admin/logs", requireAuth, getAllLogs);

export default router;
