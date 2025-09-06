import { Request, Response } from "express";
import { Types } from "mongoose";
import Log from "../models/Log.model";

// Extend Request to include userDoc
interface AuthenticatedRequest extends Request {
  userDoc?: {
    _id: Types.ObjectId;
    role: "USER" | "ADMIN";
    email?: string;
    name?: string;
  };
}

export const getMyLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userDoc) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const logs = await Log.find({ userId: req.userDoc._id }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ error: "Could not fetch logs" });
  }
};

export const getAllLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userDoc || req.userDoc.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = await Log.find()
      .populate("userId", "email name role")
      .sort({ createdAt: -1 });

    res.json({ logs });
  } catch (err) {
    console.error("Get all logs error:", err);
    res.status(500).json({ error: "Could not fetch logs" });
  }
};
