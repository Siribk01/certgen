const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect } = require('../middleware/auth');

// Keep disk storage for CSV files only
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Use memory storage for images — we convert to base64 and return data URI
// This means logos/signatures are stored as base64 strings in MongoDB,
// which works in both the browser preview AND Puppeteer PDF generation
// without any network requests or CORS issues.
const memStorage = multer.memoryStorage();

const imageUpload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// POST /api/uploads/image
// Returns a base64 data URI instead of a URL
// This ensures the image works in:
//   - Browser preview (no CORS issues)
//   - Puppeteer PDF (no network requests needed)
//   - Email attachments (embedded inline)
router.post('/image', protect, imageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Convert buffer to base64 data URI
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64}`;

    res.json({
      success: true,
      url: dataUri,           // ← data URI, not a file URL
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;