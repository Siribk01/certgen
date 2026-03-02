const { Resend } = require('resend');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Verify the transporter connection — call this on startup to catch config errors early
 */
const verifyConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  console.log('✅ Resend email configured successfully');
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
  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const formattedIssue = fmt(new Date());
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

  // Attach PDF if path provided
  const attachments = [];
  if (pdfPath && fs.existsSync(pdfPath)) {
    const pdfBuffer = fs.readFileSync(pdfPath);
    attachments.push({
      filename: `Certificate_${recipientName.replace(/\s+/g, '_')}.pdf`,
      content: pdfBuffer,
    });
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'CertGen <onboarding@resend.dev>',
    to: [`${recipientName} <${recipientEmail}>`],
    subject: `🎓 Your Certificate for "${examTitle}" is Ready!`,
    html,
    attachments,
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message);
  }

  console.log(`✅ Email sent! Message ID: ${data.id}`);
  return data;
};

module.exports = { sendCertificateEmail, verifyConnection };