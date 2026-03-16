const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Participant = require('../models/Participant');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

// multer config for CSV uploads
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/csv');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `bulk_${Date.now()}.csv`)
});
const csvUpload = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv') ||
      file.mimetype === 'application/vnd.ms-excel';
    ok ? cb(null, true) : cb(new Error('Only .csv files allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET participants for an exam
router.get('/exam/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const participants = await Participant.find({ exam: req.params.examId }).sort('-createdAt');
    res.json({ success: true, count: participants.length, participants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET bulk import CSV template
router.get('/template/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const customFields = exam.customFields || [];
    const headers = ['Name', 'Email', 'Score', 'Grade', 'ExamDate', ...customFields.map(f => f.label)];
    const exampleRow = ['Jane Doe', 'jane@example.com', '85', 'A', '2024-01-15', ...customFields.map(f => `${f.label} value`)];
    const exampleRow2 = ['John Smith', 'john@example.com', '72', 'B', '2024-01-15', ...customFields.map(() => '')];

    const csv = [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bulk_import_template_${exam.title.replace(/\s+/g, '_')}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add single participant
router.post('/', protect, async (req, res) => {
  try {
    const { examId, name, email, score, grade, examDate, customFieldValues } = req.body;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // All participants are eligible for certificates regardless of score
    const passed = score !== undefined ? score >= (exam.passingScore || 0) : true;

    const participant = await Participant.create({
      name, email, exam: examId,
      score: score !== undefined ? Number(score) : undefined,
      grade,
      passed,
      examDate: examDate || new Date(),
      customFieldValues: customFieldValues || {},
      addedBy: req.user._id
    });
    res.status(201).json({ success: true, participant });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A participant with this email already exists in this exam' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST bulk import from JSON (pasted text)
router.post('/bulk', protect, async (req, res) => {
  try {
    const { examId, participants } = req.body;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const docs = participants.map(p => ({
      name: p.name,
      email: p.email,
      exam: examId,
      score: p.score !== undefined && p.score !== '' ? Number(p.score) : undefined,
      grade: p.grade,
      // All participants eligible for certificates
      passed: p.score !== undefined && p.score !== '' ? Number(p.score) >= (exam.passingScore || 0) : true,
      examDate: p.examDate || new Date(),
      customFieldValues: p.customFieldValues || {},
      addedBy: req.user._id
    }));

    const results = await Participant.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, count: results.length, message: `${results.length} participants imported` });
  } catch (err) {
    const inserted = err.result?.nInserted || 0;
    res.status(400).json({ success: false, message: err.message, inserted });
  }
});

// POST bulk import from CSV file upload
router.post('/bulk-csv', protect, csvUpload.single('file'), async (req, res) => {
  try {
    const { examId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No CSV file uploaded' });

    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Parse CSV
    const content = fs.readFileSync(req.file.path, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV must have a header row and at least one data row' });
    }

    // Parse header to get column positions
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'name');
    const emailIdx = headers.findIndex(h => h === 'email');
    const scoreIdx = headers.findIndex(h => h === 'score');
    const gradeIdx = headers.findIndex(h => h === 'grade');
    const dateIdx = headers.findIndex(h => h === 'examdate' || h === 'exam date' || h === 'date');

    if (nameIdx === -1 || emailIdx === -1) {
      return res.status(400).json({ success: false, message: 'CSV must have Name and Email columns' });
    }

    const customFields = exam.customFields || [];

    const docs = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const name = nameIdx !== -1 ? cols[nameIdx] : '';
      const email = emailIdx !== -1 ? cols[emailIdx] : '';

      if (!name || !email) { errors.push(`Row ${i + 1}: missing name or email`); continue; }

      const scoreRaw = scoreIdx !== -1 ? cols[scoreIdx] : '';
      const score = scoreRaw !== '' && !isNaN(scoreRaw) ? Number(scoreRaw) : undefined;
      const grade = gradeIdx !== -1 ? cols[gradeIdx] : '';
      const examDate = dateIdx !== -1 && cols[dateIdx] ? new Date(cols[dateIdx]) : new Date();

      // Custom fields — match by label
      const customFieldValues = {};
      customFields.forEach(f => {
        const idx = headers.findIndex(h => h === f.label.toLowerCase());
        if (idx !== -1 && cols[idx]) customFieldValues[f.key] = cols[idx];
      });

      docs.push({
        name, email,
        exam: examId,
        score,
        grade: grade || undefined,
        passed: score !== undefined ? score >= (exam.passingScore || 0) : true,
        examDate,
        customFieldValues,
        addedBy: req.user._id
      });
    }

    if (!docs.length) {
      return res.status(400).json({ success: false, message: 'No valid rows found', errors });
    }

    // Clean up temp file
    try { fs.unlinkSync(req.file.path); } catch (e) { }

    const results = await Participant.insertMany(docs, { ordered: false });
    res.status(201).json({
      success: true,
      count: results.length,
      message: `${results.length} participants imported`,
      errors: errors.length ? errors : undefined
    });
  } catch (err) {
    const inserted = err.result?.nInserted || 0;
    res.status(400).json({ success: false, message: err.message, inserted });
  }
});

// PUT update participant
router.put('/:id', protect, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id).populate('exam');
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });
    if (participant.exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { score, grade, name, email, examDate, customFieldValues } = req.body;
    if (name) participant.name = name;
    if (email) participant.email = email;
    if (examDate) participant.examDate = examDate;
    if (grade !== undefined) participant.grade = grade;
    if (score !== undefined) {
      participant.score = Number(score);
      participant.passed = Number(score) >= (participant.exam.passingScore || 0);
    }
    if (customFieldValues) {
      for (const [k, v] of Object.entries(customFieldValues)) {
        participant.customFieldValues.set(k, v);
      }
    }
    await participant.save();
    res.json({ success: true, participant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE participant
router.delete('/:id', protect, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id).populate('exam');
    if (!participant) return res.status(404).json({ success: false, message: 'Not found' });
    if (participant.exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await participant.deleteOne();
    res.json({ success: true, message: 'Participant removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;