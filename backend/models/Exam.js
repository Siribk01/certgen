// const mongoose = require('mongoose');

// const CustomFieldSchema = new mongoose.Schema({
//   key:               { type: String, required: true, trim: true },
//   label:             { type: String, required: true, trim: true },
//   type:              { type: String, enum: ['text', 'number', 'date'], default: 'text' },
//   showOnCertificate: { type: Boolean, default: true },
//   required:          { type: Boolean, default: false }
// }, { _id: false });

// const ExamSchema = new mongoose.Schema({
//   // ── Core exam info ──────────────────────────────────────────────────────
//   title:        { type: String, required: true, trim: true },
//   description:  { type: String, trim: true },
//   instructor:   { type: String, required: true, trim: true },
//   organization: { type: String, trim: true },
//   passingScore: { type: Number, required: true, min: 0, max: 100, default: 60 },
//   duration:     { type: String, trim: true },
//   customFields: { type: [CustomFieldSchema], default: [] },

//   // ── Certificate design (admin-only) ────────────────────────────────────
//   certificateTemplate:  { type: String, enum: ['modern', 'classic', 'elegant'], default: 'modern' },
//   primaryColor:         { type: String, default: '#1a73e8' },
//   fontFamily:           { type: String, enum: ['inter', 'playfair', 'merriweather', 'montserrat'], default: 'inter' },
//   backgroundPattern:    { type: String, enum: ['none', 'dots', 'lines', 'grid', 'cross'], default: 'none' },

//   // Uploaded assets stored as base64 data URIs (device upload) or URLs
//   logoUrl:          { type: String, default: '' },       // URL or base64
//   signatureUrl:     { type: String, default: '' },       // base64 image of signature
//   signatureLabel:   { type: String, default: 'Course Instructor' },

//   // Text overrides
//   certificateTitle:      { type: String, default: '' },
//   certificateSubtitle:   { type: String, default: '' },
//   certificateFooterNote: { type: String, default: '' },
//   sealText:              { type: String, default: 'Verified Certificate' },

//   // Field visibility
//   showScore:        { type: Boolean, default: true },
//   showGrade:        { type: Boolean, default: true },
//   showExamDate:     { type: Boolean, default: true },
//   showInstructor:   { type: Boolean, default: true },
//   showOrganization: { type: Boolean, default: true },
//   showSeal:         { type: Boolean, default: true },

//   // ── Meta ────────────────────────────────────────────────────────────────
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now },
//   isActive:  { type: Boolean, default: true }
// });

// module.exports = mongoose.model('Exam', ExamSchema);
const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  type: { type: String, enum: ['text', 'number', 'date'], default: 'text' },
  showOnCertificate: { type: Boolean, default: true },
  required: { type: Boolean, default: false }
}, { _id: false });

const ExamSchema = new mongoose.Schema({
  // ── Core exam info ──────────────────────────────────────────────────────
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  instructor: { type: String, required: true, trim: true },
  organization: { type: String, trim: true },
  passingScore: { type: Number, min: 0, max: 100, default: 0 },
  duration: { type: String, trim: true },
  customFields: { type: [CustomFieldSchema], default: [] },

  // ── Certificate design (admin-only) ────────────────────────────────────
  certificateTemplate: { type: String, enum: ['modern', 'classic', 'elegant'], default: 'modern' },
  primaryColor: { type: String, default: '#1a73e8' },
  fontFamily: { type: String, enum: ['inter', 'playfair', 'merriweather', 'montserrat'], default: 'inter' },
  backgroundPattern: { type: String, enum: ['none', 'dots', 'lines', 'grid', 'cross'], default: 'none' },

  // Logos — logoUrl2 is optional second logo (appears on the right)
  logoUrl: { type: String, default: '' },
  logoUrl2: { type: String, default: '' },   // ← second logo (right side)

  signatureUrl: { type: String, default: '' },
  signatureLabel: { type: String, default: 'Course Instructor' },

  // Text overrides
  certificateTitle: { type: String, default: '' },
  certificateSubtitle: { type: String, default: '' },
  certificateFooterNote: { type: String, default: '' },
  sealText: { type: String, default: 'Verified Certificate' },

  // Field visibility
  showScore: { type: Boolean, default: true },
  showGrade: { type: Boolean, default: true },
  showExamDate: { type: Boolean, default: true },
  showInstructor: { type: Boolean, default: true },
  showOrganization: { type: Boolean, default: true },
  showSeal: { type: Boolean, default: true },

  // ── Meta ────────────────────────────────────────────────────────────────
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Exam', ExamSchema);