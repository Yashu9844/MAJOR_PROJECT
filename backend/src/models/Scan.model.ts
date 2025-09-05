import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScan extends Document {
  userId: Types.ObjectId;  // reference to User
  fileName: string;
  fileSize: number;
  status: string;
  verdict?: string;
  sha256?: string;
  timestamp: Date;
}

const ScanSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  status: { type: String, required: true, default: "pending" },
  verdict: { type: String },
  sha256: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IScan>("Scan", ScanSchema);
