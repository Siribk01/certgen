const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  score: { type: Number, min: 0, max: 100 },
  grade: { type: String, trim: true },              // e.g., "A", "Distinction"
  passed: { type: Boolean, default: false },
  examDate: { type: Date, default: Date.now },
  // Custom field values: { "batch": "2024-A", "venue": "Lagos" }
  customFieldValues: { type: Map, of: String, default: {} },
  certificateIssued: { type: Boolean, default: false },
  certificateId: { type: String },
  certificateSentAt: { type: Date },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index: one participant per exam per email
ParticipantSchema.index({ email: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Participant', ParticipantSchema);
