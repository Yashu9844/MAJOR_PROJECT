import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScan extends Document {
  userId: Types.ObjectId;          // reference to User
  fileName: string;                // uploaded file name
  fileSize: number;                // file size in bytes
  status: "pending" | "scanned" | "failed"; // scan state
  verdict?: string;                // e.g., "malware", "clean"
  sha256?: string;                 // file hash (optional)
  result?: Record<string, any>;    // detailed detection result (like threats list)
  createdAt: Date;
}

const ScanSchema: Schema = new Schema<IScan>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "scanned", "failed"],
    default: "pending",
  },
  verdict: { type: String },
  sha256: { type: String },
  result: { type: Object }, // store AI/ML or API scan output
  createdAt: { type: Date, default: Date.now },
});

const Scan = mongoose.model<IScan>("Scan", ScanSchema);
export default Scan;
