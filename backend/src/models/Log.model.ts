import mongoose, { Document, Schema } from "mongoose";

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId;
  type: "SCAN" | "NETWORK";
  input?: Record<string, any>;
  result?: Record<string, any>;
  createdAt: Date;
}

const logSchema = new Schema<ILog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["SCAN", "NETWORK"], required: true },
  input: { type: Object },
  result: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

const Log = mongoose.model<ILog>("Log", logSchema);
export default Log;
