const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,           // false = STARTTLS on port 587 (do NOT use true for 587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS   // Must be a Gmail App Password, NOT your real password
    },
    tls: {
      rejectUnauthorized: false,     // ← fixes "self-signed certificate in certificate chain"
      minVersion: 'TLSv1.2'
    }
  });

/**
 * Verify the transporter connection — call this on startup to catch config errors early
 */
const verifyConnection = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  console.log('✅ Email transporter connected successfully');
};

/**
 * Send certificate email with PDF attached.
 */
const sendCertificateEmail = async ({
  recipientName, recipientEmail,
  examTitle, score, grade, examDate,
  customFieldDefs = [], customFieldValues = {},
  certificateId, pdfPath, verifyUrl
}) => {
  const transporter = createTransporter();

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const formattedIssue    = fmt(new Date());
  const formattedExamDate = fmt(examDate);

  // Build details table rows — only show fields that have values
  const detailRows = [
    `<tr><td class="dl">Exam / Course</td><td class="dv">${examTitle}</td></tr>`,
    score !== undefined
      ? `<tr><td class="dl">Score</td><td class="dv">${score}%</td></tr>` : '',
    grade
      ? `<tr><td class="dl">Grade</td><td class="dv">${grade}</td></tr>` : '',
    formattedExamDate
      ? `<tr><td class="dl">Exam Date</td><td class="dv">${formattedExamDate}</td></tr>` : '',
    `<tr><td class="dl">Issue Date</td><td class="dv">${formattedIssue}</td></tr>`,
    `<tr><td class="dl">Certificate ID</td><td class="dv" style="font-family:monospace;font-size:12px">${certificateId}</td></tr>`,
    // Custom fields
    ...customFieldDefs
      .filter(f => f.showOnCertificate)
      .map(f => {
        const val = customFieldValues[f.key];
        return val ? `<tr><td class="dl">${f.label}</td><td class="dv">${val}</td></tr>` : '';
      })
  ].filter(Boolean).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9}
    .wrap{max-width:600px;margin:0 auto;padding:32px 16px}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .hdr{background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px 32px;text-align:center}
    .hdr h1{color:#fff;font-size:24px;margin:12px 0 4px}
    .hdr p{color:rgba(255,255,255,.8);margin:0;font-size:14px}
    .body{padding:32px}
    .greet{font-size:16px;color:#333;margin-bottom:14px}
    .msg{color:#555;line-height:1.7;font-size:14px;margin-bottom:20px}
    .dtbl{width:100%;border-collapse:collapse;background:#f8f9ff;border-radius:8px;overflow:hidden;margin-bottom:20px}
    .dtbl tr{border-bottom:1px solid #eef0ff}
    .dtbl tr:last-child{border-bottom:none}
    td{padding:11px 18px;font-size:13px}
    .dl{color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.5px;width:38%}
    .dv{color:#1a1a2e;font-weight:600}
    .att{background:#fffbf0;border:1px solid #ffe082;padding:13px 18px;border-radius:8px;font-size:13px;color:#795548;margin-bottom:16px}
    .btn{display:block;text-align:center;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:8px}
    .vlink{text-align:center;font-size:11px;color:#aaa;word-break:break-all}
    .foot{background:#f8f9ff;padding:20px 32px;text-align:center}
    .foot p{font-size:11px;color:#aaa;margin:3px 0}
  </style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hdr">
      <div style="font-size:48px">🎓</div>
      <h1>Congratulations, ${recipientName}!</h1>
      <p>Your certificate of achievement is ready</p>
    </div>
    <div class="body">
      <div class="greet">Dear <strong>${recipientName}</strong>,</div>
      <div class="msg">
        We are pleased to inform you that you have successfully completed the examination
        and your certificate has been issued. Please find it attached to this email.
      </div>
      <table class="dtbl"><tbody>${detailRows}</tbody></table>
      <div class="att">📎 Your certificate is attached as a PDF. Please save it for your records.</div>
      ${verifyUrl ? `
      <a href="${verifyUrl}" class="btn">🔍 Verify Certificate Online</a>
      <p class="vlink">${verifyUrl}</p>` : ''}
    </div>
    <div class="foot">
      <p>This certificate was issued by the CertGen platform.</p>
      <p>If you have questions, please contact your course instructor.</p>
    </div>
  </div>
</div>
</body>
</html>`;

  // Log who we're sending to (helpful for debugging)
  console.log(`📧 Sending certificate email to: ${recipientEmail}`);

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"CertGen" <${process.env.EMAIL_USER}>`,
    to: `"${recipientName}" <${recipientEmail}>`,
    subject: `🎓 Your Certificate for "${examTitle}" is Ready!`,
    html,
    attachments: pdfPath ? [{
      filename: `Certificate_${recipientName.replace(/\s+/g, '_')}.pdf`,
      path: pdfPath,
      contentType: 'application/pdf'
    }] : []
  });

  console.log(`✅ Email sent! Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendCertificateEmail, verifyConnection };
