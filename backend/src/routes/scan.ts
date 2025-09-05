// src/routes/scans.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import Scan from '../models/Scan.model';

const r = Router();

r.post('/', requireAuth, async (req, res) => {
  const { fileName, fileSize } = req.body; // for now; later wire to real upload
  const scan = await Scan.create({
    userId: req.userDoc._id,
    fileName,
    fileSize,
    status: 'pending',
    timestamp: new Date(),
  });
  res.json(scan);
});

r.get('/mine', requireAuth, async (req, res) => {
  const scans = await Scan.find({ userId: req.userDoc._id }).sort({ timestamp: -1 });
  res.json(scans);
});

export default r;
