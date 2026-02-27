const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const Participant = require('../models/Participant');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');
const { generateCertificatePDF } = require('../utils/pdfGenerator');
const { sendCertificateEmail } = require('../utils/emailSender');

// ─── PUBLIC: Verify certificate ────────────────────────────────────────────────
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId, isValid: true });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found or has been revoked' });
    res.json({ success: true, valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Get all certificates for an exam ─────────────────────────────────────────
router.get('/exam/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const certs = await Certificate.find({ exam: req.params.examId }).sort('-createdAt');
    res.json({ success: true, count: certs.length, certificates: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Helper: build cert data from participant + exam ───────────────────────────
const buildCertData = (participant, exam, certificateId) => ({
  certificateId,
  participantName: participant.name,
  participantEmail: participant.email,
  examTitle: exam.title,
  instructorName: exam.instructor,
  organization: exam.organization,
  score: participant.score,
  grade: participant.grade,
  examDate: participant.examDate,
  issueDate: new Date(),
  primaryColor: exam.primaryColor || '#1a73e8',
  fontFamily: exam.fontFamily || 'inter',
  backgroundPattern: exam.backgroundPattern || 'none',
  logoUrl: exam.logoUrl || '',
  signatureUrl: exam.signatureUrl || '',
  showSeal: exam.showSeal !== false,
  certificateTitle: exam.certificateTitle || '',
  certificateSubtitle: exam.certificateSubtitle || '',
  certificateFooterNote: exam.certificateFooterNote || '',
  signatureLabel: exam.signatureLabel || 'Course Instructor',
  sealText: exam.sealText || 'Verified Certificate',
  showScore: exam.showScore !== false,
  showGrade: exam.showGrade !== false,
  showExamDate: exam.showExamDate !== false,
  showInstructor: exam.showInstructor !== false,
  showOrganization: exam.showOrganization !== false,
  // custom fields
  customFieldDefs: exam.customFields || [],
  customFieldValues: Object.fromEntries(
    participant.customFieldValues instanceof Map
      ? participant.customFieldValues
      : Object.entries(participant.customFieldValues || {})
  )
});

// ─── ADMIN: Generate + send certificate for ONE participant ────────────────────
router.post('/generate/:participantId', protect, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.participantId).populate('exam');
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });
    if (participant.exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { sendEmail = true } = req.body;

    // Reuse existing cert ID if cert already exists (re-generation scenario)
    let existingCert = await Certificate.findOne({ participant: participant._id });
    const certificateId = existingCert?.certificateId || `CERT-${uuidv4().toUpperCase().slice(0, 12)}`;

    const certData = buildCertData(participant, participant.exam, certificateId);

    // Generate PDF
    const pdfResult = await generateCertificatePDF(certData, participant.exam.certificateTemplate || 'modern');

    // Upsert certificate record
    if (existingCert) {
      Object.assign(existingCert, {
        ...certData,
        pdfPath: pdfResult.path,
        emailSent: false,
        participant: participant._id,
        exam: participant.exam._id,
      });
      await existingCert.save();
    } else {
      existingCert = await Certificate.create({
        ...certData,
        participant: participant._id,
        exam: participant.exam._id,
        pdfPath: pdfResult.path
      });
    }

    // Mark participant
    participant.certificateIssued = true;
    participant.certificateId = certificateId;

    if (sendEmail) {
      const verifyUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;
      await sendCertificateEmail({
        recipientName: participant.name,
        recipientEmail: participant.email,
        examTitle: participant.exam.title,
        score: participant.score,
        grade: participant.grade,
        examDate: participant.examDate,
        customFieldDefs: participant.exam.customFields || [],
        customFieldValues: certData.customFieldValues,
        certificateId,
        pdfPath: pdfResult.path,
        verifyUrl
      });
      existingCert.emailSent = true;
      existingCert.emailSentAt = new Date();
      existingCert.sentBy = req.user._id;
      participant.certificateSentAt = new Date();
      await existingCert.save();
    }

    await participant.save();

    res.json({
      success: true,
      message: sendEmail ? 'Certificate generated and emailed to participant' : 'Certificate generated (email not sent)',
      certificate: existingCert,
      downloadUrl: `${process.env.BACKEND_URL}/certificates/cert_${certificateId}.pdf`
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Bulk generate + send for selected participant IDs ──────────────────
router.post('/bulk-generate', protect, async (req, res) => {
  try {
    const { participantIds, sendEmail = true } = req.body;
    if (!participantIds?.length) {
      return res.status(400).json({ success: false, message: 'No participant IDs provided' });
    }

    const results = [];

    for (const pid of participantIds) {
      try {
        const participant = await Participant.findById(pid).populate('exam');
        if (!participant) { results.push({ id: pid, success: false, error: 'Not found' }); continue; }
        if (participant.exam.createdBy.toString() !== req.user._id.toString()) {
          results.push({ id: pid, success: false, error: 'Unauthorized' }); continue;
        }

        let existing = await Certificate.findOne({ participant: participant._id });
        const certificateId = existing?.certificateId || `CERT-${uuidv4().toUpperCase().slice(0, 12)}`;
        const certData = buildCertData(participant, participant.exam, certificateId);
        const pdfResult = await generateCertificatePDF(certData, participant.exam.certificateTemplate || 'modern');

        if (existing) {
          Object.assign(existing, { ...certData, pdfPath: pdfResult.path, emailSent: false });
          await existing.save();
        } else {
          existing = await Certificate.create({ ...certData, participant: participant._id, exam: participant.exam._id, pdfPath: pdfResult.path });
        }

        participant.certificateIssued = true;
        participant.certificateId = certificateId;

        if (sendEmail) {
          const verifyUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;
          await sendCertificateEmail({
            recipientName: participant.name,
            recipientEmail: participant.email,
            examTitle: participant.exam.title,
            score: participant.score,
            grade: participant.grade,
            examDate: participant.examDate,
            customFieldDefs: participant.exam.customFields || [],
            customFieldValues: certData.customFieldValues,
            certificateId,
            pdfPath: pdfResult.path,
            verifyUrl
          });
          existing.emailSent = true;
          existing.emailSentAt = new Date();
          existing.sentBy = req.user._id;
          participant.certificateSentAt = new Date();
          await existing.save();
        }
        await participant.save();
        results.push({ id: pid, success: true, name: participant.name, email: participant.email, certificateId });
      } catch (e) {
        results.push({ id: pid, success: false, error: e.message });
      }
    }

    const ok = results.filter(r => r.success).length;
    res.json({ success: true, message: `Processed ${ok}/${participantIds.length} certificates`, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Revoke a certificate ──────────────────────────────────────────────
router.delete('/:certificateId', protect, async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).populate('exam');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    if (cert.exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    cert.isValid = false;
    await cert.save();
    res.json({ success: true, message: 'Certificate revoked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// GET /certificates/download-zip?exam=:examId — download all issued certs as ZIP
router.get('/download-zip', protect, async (req, res) => {
  try {
    const { exam } = req.query;
    if (!exam) return res.status(400).json({ success: false, message: 'exam param required' });

    const archiver = require('archiver');
    const path = require('path');
    const fs = require('fs');

    const certs = await Certificate.find({ exam, isValid: true })
      .populate('participant', 'name');

    if (certs.length === 0) {
      return res.status(404).json({ success: false, message: 'No issued certificates found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="certificates_${exam}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    let added = 0;
    for (const cert of certs) {
      if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
        const name = cert.participant?.name || 'participant';
        const safe = name.replace(/[^a-z0-9]/gi, '_');
        archive.file(cert.pdfPath, { name: `${safe}_${cert.certificateId}.pdf` });
        added++;
      }
    }

    if (added === 0) {
      return res.status(404).json({ success: false, message: 'No PDF files found on disk. Re-generate certificates first.' });
    }

    await archive.finalize();
  } catch (err) {
    console.error('ZIP download error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
});

// GET /certificates?exam=:examId — list certificates for an exam
router.get('/', protect, async (req, res) => {
  try {
    const { exam } = req.query;
    if (!exam) return res.status(400).json({ success: false, message: 'exam query param required' });
    const certs = await Certificate.find({ exam })
      .populate('participant', 'name email')
      .sort('-issuedAt');
    res.json({ success: true, certificates: certs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /certificates/:id — revoke a certificate
router.delete('/:id', protect, async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Certificate revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
