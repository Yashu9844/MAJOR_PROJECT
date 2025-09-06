import { Request, Response } from "express";
import Log, { ILog } from "../models/Log.model";

// Extend Express Request to include userDoc (from requireAuth middleware)
interface AuthenticatedRequest extends Request {
  userDoc?: {
    _id: string;
  };
  file?: Express.Multer.File;
}

export const scanFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userDoc } = req;
    const file = req.file;

    if (!userDoc) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Mock detection result (replace with API/ML later)
    const detectionResult = {
      filename: file.originalname,
      safe: Math.random() > 0.3, // 70% safe, 30% flagged
      threats: ["Trojan.Generic", "Worm.AutoRun"].slice(
        0,
        Math.floor(Math.random() * 2)
      ),
    };

    // Save log
    const log: ILog = await Log.create({
      userId: userDoc._id,
      type: "SCAN",
      input: { filename: file.originalname, size: file.size },
      result: detectionResult,
    });

    res.json({ success: true, detectionResult, log });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: "File scan failed" });
  }
};
