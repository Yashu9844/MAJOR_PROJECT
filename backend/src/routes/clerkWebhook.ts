import express from "express";
import { Webhook } from "svix";
import User from "../models/User.model";

const router = express.Router();

router.post("/clerk", express.json({ type: "application/json" }), async (req, res) => {
  const payload = req.body;
  const headers:any = req.headers;

  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    const evt:any = wh.verify(JSON.stringify(payload), headers);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          imageUrl: image_url,
          lastLoginAt: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log("✅ Synced user:", email);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
});

export default router;
