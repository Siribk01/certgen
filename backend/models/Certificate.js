const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  // Standard fields — all shown on certificate
  participantName: { type: String, required: true },
  participantEmail: { type: String, required: true },
  examTitle: { type: String, required: true },
  instructorName: { type: String, required: true },
  organization: { type: String },
  score: { type: Number },
  grade: { type: String },
  examDate: { type: Date },
  issueDate: { type: Date, default: Date.now },
  // Snapshot of custom field values rendered on the certificate
  customFieldValues: { type: Map, of: String, default: {} },
  // Custom field definitions (label + showOnCertificate) snapshotted at issue time
  customFieldDefs: { type: Array, default: [] },
  pdfPath: { type: String },
  isValid: { type: Boolean, default: true },
  // Email delivery
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who triggered send
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
