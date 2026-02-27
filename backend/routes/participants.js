const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

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

// POST add single participant (with grade + customFieldValues)
router.post('/', protect, async (req, res) => {
  try {
    const { examId, name, email, score, grade, examDate, customFieldValues } = req.body;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const passed = score !== undefined ? score >= exam.passingScore : false;
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

// POST bulk import participants (CSV-style: name, email, score, grade, ...customFields)
router.post('/bulk', protect, async (req, res) => {
  try {
    const { examId, participants } = req.body;
    const exam = await Exam.findOne({ _id: examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const docs = participants.map(p => ({
      name: p.name,
      email: p.email,
      exam: examId,
      score: p.score !== undefined ? Number(p.score) : undefined,
      grade: p.grade,
      passed: p.score !== undefined ? Number(p.score) >= exam.passingScore : false,
      examDate: p.examDate || new Date(),
      customFieldValues: p.customFieldValues || {},
      addedBy: req.user._id
    }));

    const results = await Participant.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, count: results.length, message: `${results.length} participants imported` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, inserted: err.result?.nInserted });
  }
});

// PUT update participant (score, grade, customFieldValues, etc.)
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
      participant.passed = Number(score) >= participant.exam.passingScore;
    }
    if (customFieldValues) {
      // Merge custom field updates
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
