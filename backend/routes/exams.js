const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

// GET all exams for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single exam
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create exam
router.post('/', protect, async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, exam });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update exam (general fields — title, description, instructor, etc.)
router.put('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/exams/:id/certificate-design — admin-only certificate customisation
router.put('/:id/certificate-design', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can customise certificate design' });
    }
    const allowedFields = [
      'certificateTemplate', 'primaryColor', 'logoUrl', 'certificateTitle',
      'certificateSubtitle', 'certificateFooterNote', 'showScore', 'showGrade',
      'showExamDate', 'showInstructor', 'showOrganization', 'showSeal',
      'signatureLabel', 'signatureUrl', 'sealText', 'fontFamily', 'backgroundPattern',
    ];
    const update = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      update,
      { new: true, runValidators: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam, message: 'Certificate design saved' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE exam
router.delete('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;