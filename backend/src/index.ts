import express, { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/authenticated';
import scanRoutes from './routes/scan';
import clerkWebhook from './routes/clerkWebhook';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/webhooks', clerkWebhook);



// Routes
app.get("/", (req, res) => {
  res.send("🚀 Backend running...");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));
