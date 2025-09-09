import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { scanFile } from '../controllers/scanFile.controller';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for scanning
    cb(null, true);
  },
});

const router = Router();

// File scan endpoint with multer middleware - PROTECTED
router.post('/scan', requireAuth, upload.single('file'), scanFile);

// Temporary test endpoint without auth for testing
router.post('/test-scan', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Mock detection result
    const detectionResult = {
      filename: file.originalname,
      safe: Math.random() > 0.3,
      threats: ['Test.Malware', 'Sample.Virus'].slice(0, Math.floor(Math.random() * 2)),
    };
    
    // Try to save a test log (using a dummy user ID)
    const Log = require('../models/Log.model').default;
    const mongoose = require('mongoose');
    const testLogData = {
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Valid ObjectId
      type: 'SCAN', // Valid enum value
      input: { filename: file.originalname, size: file.size },
      result: detectionResult,
    };
    
    console.log('[DB] Attempting to save test log:', testLogData);
    
    let savedLog = null;
    try {
      savedLog = await Log.create(testLogData);
      console.log('[DB] Test log saved successfully:', savedLog._id);
    } catch (dbErr) {
      console.error('[DB] Failed to save test log:', dbErr);
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully!',
      fileInfo: {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      },
      detectionResult,
      logSaved: !!savedLog,
      logId: savedLog?._id
    });
  } catch (err) {
    console.error('Test scan error:', err);
    res.status(500).json({ error: 'File upload test failed' });
  }
});

export default router;
