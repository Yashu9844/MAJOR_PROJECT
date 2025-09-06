import { Request, Response } from "express";
import { Types } from "mongoose";
import Log from "../models/Log.model";

// Extend Request to include userDoc
interface AuthenticatedRequest extends Request {
  userDoc?: {
    _id: Types.ObjectId;
    [key: string]: any;
  };
  body: {
    traffic?: Record<string, any>;
  };
}

export const checkNetwork = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userDoc } = req;
    const { traffic } = req.body;

    if (!traffic) {
      return res.status(400).json({ error: "Missing traffic data" });
    }

    if (!userDoc) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Mock anomaly score
    const anomalyScore = Math.random();
    const isSuspicious = anomalyScore > 0.7;

    const detectionResult = {
      anomalyScore,
      isSuspicious,
      message: isSuspicious ? "Potential intrusion detected" : "Normal traffic",
    };

    // Save log
    const log = await Log.create({
      userId: userDoc._id,
      type: "NETWORK",
      input: traffic,
      result: detectionResult,
    });

    res.json({ success: true, detectionResult, log });
  } catch (err) {
    console.error("Network check error:", err);
    res.status(500).json({ error: "Network check failed" });
  }
};
