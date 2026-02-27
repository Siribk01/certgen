/**
 * Certificate HTML — A4 landscape 297mm × 210mm (1122 × 794px at 96dpi)
 *
 * CENTERING METHOD: position:absolute + top:50% + transform:translateY(-50%)
 * This is the ONLY method guaranteed to vertically centre content within an
 * absolutely-positioned zone in Puppeteer's Chromium.
 * display:table / flexbox do NOT work reliably for height-filling in Puppeteer.
 *
 * LAYOUT:
 *   .body   — position:absolute; top:0; bottom:180px  (content zone)
 *   .body-inner — position:absolute; top:50%; transform:translateY(-50%)  (centred)
 *   .footer — position:absolute; bottom:0; height:180px  (always visible)
 *
 * FONT SIZES (scaled for 1122×794px page):
 *   Logo: 110px tall
 *   School name: 32px
 *   Certificate title: 68px
 *   Participant name: 58px
 *   Body text: 18px
 */

const PAT = c => ({
  none: '',
  dots: `background-image:radial-gradient(${c}25 1.5px,transparent 1.5px);background-size:24px 24px;`,
  lines: `background-image:repeating-linear-gradient(45deg,${c}18 0,${c}18 1px,transparent 0,transparent 50%);background-size:18px 18px;`,
  grid: `background-image:linear-gradient(${c}18 1px,transparent 1px),linear-gradient(90deg,${c}18 1px,transparent 1px);background-size:30px 30px;`,
  cross: `background-image:repeating-linear-gradient(0deg,transparent,transparent 28px,${c}16 28px,${c}16 30px),repeating-linear-gradient(90deg,transparent,transparent 28px,${c}16 28px,${c}16 30px);`,
});

const fmtDate = d => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return ''; }
};

const generateCertificateHTML = (data, template = 'modern') => {
  const {
    participantName = 'Participant Name',
    examTitle = 'Course Title',
    instructorName = '',
    organization = '',
    score, grade, examDate, issueDate,
    certificateId = 'CERT-000',
    primaryColor = '#1a73e8',
    fontFamily = 'inter',
    backgroundPattern = 'none',
    logoUrl = '',
    signatureUrl = '',
    certificateTitle = '',
    certificateSubtitle = '',
    certificateFooterNote = '',
    signatureLabel = 'Course Instructor',
    sealText = 'Verified Certificate',
    showScore = true,
    showGrade = true,
    showExamDate = true,
    showInstructor = true,
    showOrganization = true,
    showSeal = true,
    customFieldDefs = [],
    customFieldValues = {},
  } = data;

  const pc = primaryColor;
  const pat = PAT(pc)[backgroundPattern] || '';
  const issDate = fmtDate(issueDate) || fmtDate(new Date());
  const exDate = fmtDate(examDate);

  const certTitle = certificateTitle || 'Certificate of Achievement';
  const certSubtitle = certificateSubtitle || 'This is to certify that';
  const sealLabel = sealText || 'Verified Certificate';
  const sigLabel = signatureLabel || 'Course Instructor';

  // System fonts only — Google Fonts never load in Puppeteer's sandbox
  const FONTS = {
    inter: { body: 'Arial, Helvetica, sans-serif', heading: 'Georgia, "Times New Roman", serif' },
    playfair: { body: 'Georgia, "Times New Roman", serif', heading: 'Georgia, "Times New Roman", serif' },
    merriweather: { body: 'Georgia, "Times New Roman", serif', heading: 'Georgia, "Times New Roman", serif' },
    montserrat: { body: 'Arial, Helvetica, sans-serif', heading: '"Palatino Linotype", Palatino, Georgia, serif' },
  };
  const { body: bf, heading: hf } = FONTS[fontFamily] || FONTS.inter;

  // Custom fields
  const customRows = (customFieldDefs || [])
    .filter(f => f.showOnCertificate)
    .map(f => {
      const v = customFieldValues instanceof Map
        ? customFieldValues.get(f.key)
        : (customFieldValues || {})[f.key];
      return v ? { label: f.label, value: v } : null;
    }).filter(Boolean);

  const details = [
    showScore && score !== undefined && { label: 'Score', value: `${score}%` },
    showGrade && grade && { label: 'Grade', value: grade },
    showExamDate && exDate && { label: 'Exam Date', value: exDate },
    ...customRows,
  ].filter(Boolean);

  // ── Shared snippets ───────────────────────────────────────────────────────

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-height:110px;max-width:300px;object-fit:contain;display:block;margin:0 auto 16px;">`
    : '';

  const makeSchool = (color) => (showOrganization && organization)
    ? `<div style="font-family:${bf};font-size:32px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:${color};margin-bottom:14px;line-height:1.2;">${organization}</div>`
    : '';

  const makeSig = (lineColor, lineH, imgFilter) => signatureUrl
    ? `<img src="${signatureUrl}" alt="Signature" style="height:65px;max-width:220px;object-fit:contain;display:block;margin:0 auto 8px;${imgFilter ? 'filter:' + imgFilter + ';' : ''}">`
    : `<div style="width:200px;height:${lineH}px;background:${lineColor};margin:0 auto 8px;"></div>`;

  // Footer: 3-column table — seal uses nested <table> (no flexbox)
  const makeFooter = ({ lineColor, lineH = 2, imgFilter = '', nameColor, roleColor, sealColor, lblColor, valColor }) => {
    const sigHTML = makeSig(lineColor, lineH, imgFilter);
    const sealHTML = showSeal
      ? `<table style="border-collapse:collapse;margin:0 auto;"><tr>
           <td style="width:88px;height:88px;border-radius:50%;border:3px solid ${sealColor};background:${sealColor}18;text-align:center;vertical-align:middle;padding:0;">
             <div style="font-family:${bf};font-size:10px;color:${sealColor};font-weight:800;text-transform:uppercase;letter-spacing:.5px;line-height:1.5;padding:10px;">${sealLabel}</div>
           </td>
         </tr></table>`
      : `<div style="height:88px;"></div>`;

    return `
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
  <tr>
    <td style="width:33%;text-align:center;vertical-align:bottom;padding:0 20px 0 0;">
      ${sigHTML}
      <div style="width:200px;height:1px;background:${lineColor}70;margin:0 auto 8px;"></div>
      <div style="font-family:${bf};font-size:15px;font-weight:700;color:${nameColor};">${showInstructor && instructorName ? instructorName : '&nbsp;'}</div>
      <div style="font-family:${bf};font-size:13px;color:${roleColor};margin-top:4px;">${sigLabel}</div>
    </td>
    <td style="width:33%;text-align:center;vertical-align:bottom;padding:0 10px;">
      ${sealHTML}
    </td>
    <td style="width:33%;text-align:center;vertical-align:bottom;padding:0 0 0 20px;">
      <div style="font-family:${bf};font-size:12px;text-transform:uppercase;letter-spacing:2px;color:${lblColor};margin-bottom:6px;">Issued On</div>
      <div style="font-family:${hf};font-size:18px;font-weight:700;color:${valColor};margin-bottom:5px;">${issDate}</div>
      <div style="font-family:${bf};font-size:11px;color:${lblColor};letter-spacing:.5px;">ID: ${certificateId}</div>
    </td>
  </tr>
</table>`;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ELEGANT (dark)
  // ══════════════════════════════════════════════════════════════════════════
  if (template === 'elegant') {

    const pills = details.map(d =>
      `<span class="pill">${d.label}: ${d.value}</span>`
    ).join('');

    const footer = makeFooter({
      lineColor: pc,
      lineH: 1,
      imgFilter: 'brightness(0) invert(1)',
      nameColor: '#ffffff',
      roleColor: 'rgba(255,255,255,.6)',
      sealColor: pc,
      lblColor: 'rgba(255,255,255,.5)',
      valColor: '#ffffff'
    });

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}

html,body{
  width:297mm;
  height:210mm;
  overflow:hidden;
  font-family:${bf};
}

/* PAGE */
.page{
  position:relative;
  width:297mm;
  height:210mm;
  background:
    radial-gradient(circle at 50% 35%, ${pc}20 0%, transparent 60%),
    linear-gradient(160deg,#141e30 0%,#243b55 100%);
  color:#fff;
}

/* PREMIUM DOUBLE BORDER */
.outer-border{
  position:absolute;
  inset:10px;
  border:2px solid ${pc};
  pointer-events:none;
}
.inner-border{
  position:absolute;
  inset:22px;
  border:1px solid rgba(255,255,255,.15);
  pointer-events:none;
}

/* BODY */
.body{
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:170px;
}

.body-inner{
  position:absolute;
  top:50%;
  left:0;
  right:0;
  transform:translateY(-50%);
  text-align:center;
  padding:0 120px;
}

/* TYPOGRAPHY */
.school{
  font-size:28px;
  font-weight:800;
  letter-spacing:4px;
  text-transform:uppercase;
  color:${pc};
  margin-bottom:10px;
}

.cert-sub{
  font-size:12px;
  letter-spacing:6px;
  text-transform:uppercase;
  color:rgba(255,255,255,.55);
  margin-bottom:6px;
}

.cert-title{
  font-family:${hf};
  font-size:72px;
  font-weight:500;
  margin-bottom:10px;
  text-shadow:0 6px 25px rgba(0,0,0,.45);
}

.gold-line{
  width:180px;
  height:3px;
  background:linear-gradient(90deg,transparent,${pc},transparent);
  margin:14px auto;
}

.award-lbl{
  font-size:12px;
  letter-spacing:5px;
  text-transform:uppercase;
  color:rgba(255,255,255,.45);
  margin-bottom:10px;
}

/* NAME */
.name{
  font-family:${hf};
  font-size:64px;
  font-weight:700;
  color:#f5d78e;
  margin:10px 0;
  text-shadow:0 6px 25px rgba(0,0,0,.6);
}

/* DESCRIPTION */
.desc{
  font-size:18px;
  color:rgba(255,255,255,.75);
  margin-bottom:12px;
}

.exam-name{
  color:${pc};
  font-weight:700;
  font-style:italic;
}

/* DETAILS PILLS */
.pills{
  margin-top:10px;
}
.pill{
  display:inline-block;
  border:1.5px solid ${pc};
  color:${pc};
  padding:6px 20px;
  margin:4px;
  border-radius:20px;
  font-size:14px;
  background:rgba(255,255,255,.05);
}

/* FOOTER */
.footer{
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  height:170px;
  padding:20px 100px;
  border-top:1px solid rgba(255,255,255,.15);
  background:linear-gradient(to top,rgba(0,0,0,.35),transparent);
}

.fnote{
  font-size:13px;
  color:rgba(255,255,255,.4);
  font-style:italic;
  margin-top:8px;
}
</style>
</head>

<body>
<div class="page">

  <div class="outer-border"></div>
  <div class="inner-border"></div>

  <div class="body">
    <div class="body-inner">

      ${logoBlock}
      ${makeSchool(pc)}

      <div class="cert-sub">${certSubtitle}</div>
      <div class="cert-title">${certTitle}</div>
      <div class="gold-line"></div>

      <div class="award-lbl">Proudly Awarded To</div>
      <div class="name">${participantName}</div>

      <div class="desc">
        for outstanding performance in
        <span class="exam-name">"${examTitle}"</span>
      </div>

      ${pills ? `<div class="pills">${pills}</div>` : ''}
      ${certificateFooterNote ? `<div class="fnote">${certificateFooterNote}</div>` : ''}

    </div>
  </div>

  <div class="footer">
    ${footer}
  </div>

</div>
</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODERN
  // ══════════════════════════════════════════════════════════════════════════
  if (template === 'modern') {

    const detailRows = details.map(d =>
      `<tr>
      <td class="label">${d.label}</td>
      <td class="value">${d.value}</td>
    </tr>`
    ).join('');

    const footer = makeFooter({
      lineColor: pc,
      lineH: 2,
      imgFilter: '',
      nameColor: '#1a1a2e',
      roleColor: '#777',
      sealColor: pc,
      lblColor: '#aaa',
      valColor: '#1a1a2e',
    });

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}

html,body{
  width:297mm;
  height:210mm;
  overflow:hidden;
  font-family:${bf};
}

.page{
  position:relative;
  width:297mm;
  height:210mm;
  background:
    radial-gradient(circle at 85% 20%, ${pc}15 0%, transparent 40%),
    linear-gradient(135deg,#f4f7ff 0%,#ffffff 60%);
}

/* OUTER FRAME */
.frame{
  position:absolute;
  inset:12px;
  border:3px solid ${pc};
}

.inner-frame{
  position:absolute;
  inset:22px;
  border:1px solid ${pc}40;
}

/* BODY */
.body{
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:180px;
}

.body-inner{
  position:absolute;
  top:50%;
  left:0;
  right:0;
  transform:translateY(-50%);
  text-align:center;
  padding:0 110px;
}

/* TYPOGRAPHY */
.school{
  font-size:28px;
  font-weight:900;
  letter-spacing:3px;
  text-transform:uppercase;
  color:${pc};
  margin-bottom:12px;
}

.cert-sub{
  font-size:13px;
  letter-spacing:6px;
  text-transform:uppercase;
  color:#bbb;
  margin-bottom:6px;
}

.cert-title{
  font-family:${hf};
  font-size:64px;
  font-weight:700;
  margin-bottom:8px;
  background:linear-gradient(135deg,#1a1a2e 30%,${pc});
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}

.divider{
  width:110px;
  height:3px;
  background:${pc};
  margin:14px auto;
}

.pre-name{
  font-size:15px;
  color:#999;
  margin-bottom:6px;
}

.name{
  font-family:${hf};
  font-size:56px;
  font-weight:500;
  color:#1a1a2e;
  border-bottom:2px solid ${pc}40;
  display:inline-block;
  padding-bottom:6px;
  margin-bottom:10px;
}

.completing{
  font-size:17px;
  color:#555;
  margin-bottom:8px;
}

.exam-name{
  color:${pc};
  font-weight:700;
  font-style:italic;
}

table{
  margin:12px auto 0;
  border-collapse:collapse;
}

.label{
  font-size:14px;
  color:#888;
  text-align:right;
  padding:6px 18px;
  font-weight:700;
  text-transform:uppercase;
}

.value{
  font-size:16px;
  color:#1a1a2e;
  font-weight:700;
  padding:6px 18px;
}

.footer{
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  height:180px;
  padding:20px 100px;
  border-top:2px solid ${pc}30;
  background:linear-gradient(to top,#f0f3ff,transparent);
}
</style>
</head>

<body>
<div class="page">
  <div class="frame"></div>
  <div class="inner-frame"></div>

  <div class="body">
    <div class="body-inner">

      ${logoBlock}
      ${makeSchool(pc)}

      <div class="cert-sub">${certSubtitle}</div>
      <div class="cert-title">${certTitle}</div>
      <div class="divider"></div>

      <div class="pre-name">is proudly presented to</div>
      <div class="name">${participantName}</div>

      <div class="completing">
        for successfully completing<br>
        <span class="exam-name">"${examTitle}"</span>
      </div>

      ${details.length ? `<table><tbody>${detailRows}</tbody></table>` : ''}

    </div>
  </div>

  <div class="footer">
    ${footer}
  </div>

</div>
</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASSIC
  // ══════════════════════════════════════════════════════════════════════════
  // CLASSIC
  const gold = '#8B6B1E';

  if (template === 'classic') {

    const detailPills = details.map(d =>
      `<span class="meta-item">${d.label}: <strong>${d.value}</strong></span>`
    ).join('<span class="sep">|</span>');

    const footer = makeFooter({
      lineColor: gold,
      lineH: 1,
      imgFilter: '',
      nameColor: '#3d2b00',
      roleColor: '#888',
      sealColor: gold,
      lblColor: '#aaa',
      valColor: '#3d2b00',
    });

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}

html,body{
  width:297mm;
  height:210mm;
  overflow:hidden;
  font-family:${bf};
}

.page{
  position:relative;
  width:297mm;
  height:210mm;
  background:
    radial-gradient(circle at center,#fffdf6 0%,#f7eddc 100%);
}

/* DOUBLE GOLD BORDER */
.border-outer{
  position:absolute;
  inset:10px;
  border:6px double ${gold};
}
.border-inner{
  position:absolute;
  inset:26px;
  border:1.5px solid ${gold}80;
}

.body{
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:180px;
}

.body-inner{
  position:absolute;
  top:50%;
  left:0;
  right:0;
  transform:translateY(-50%);
  text-align:center;
  padding:0 120px;
}

/* CLASSIC TYPOGRAPHY */
.school{
  font-size:40px;
  font-weight:900;
  letter-spacing:4px;
  text-transform:uppercase;
  color:${gold};
  margin-bottom:8px;
}

.ornament{
  font-size:24px;
  color:${gold};
  letter-spacing:12px;
  margin-bottom:6px;
}

.cert-title{
  font-family:${hf};
  font-size:60px;
  font-weight:700;
  color:#3d2b00;
  margin-bottom:6px;
}

.sub{
  font-size:16px;
  color:#777;
  font-style:italic;
  margin-bottom:8px;
}

.name{
  font-family:${hf};
  font-size:54px;
  font-weight:600;
  color:#3d2b00;
  margin:10px 0;
}

.exam{
  font-size:17px;
  color:#555;
}

.exam em{
  color:${gold};
  font-weight:700;
}

.meta{
  font-size:14px;
  color:#666;
  margin-top:10px;
}

.meta-item{
  margin:0 8px;
}

.sep{
  color:#ccc;
}

.footer{
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  height:180px;
  padding:20px 100px;
  border-top:1px solid ${gold}40;
}
</style>
</head>

<body>
<div class="page">

  <div class="border-outer"></div>
  <div class="border-inner"></div>

  <div class="body">
    <div class="body-inner">

      ${logoBlock}
      ${makeSchool(gold)}

      <div class="ornament">✦ ✧ ✦</div>
      <div class="cert-title">${certTitle}</div>
      <div class="sub">This certificate is proudly presented to</div>

      <div class="name">${participantName}</div>

      <div class="exam">
        for outstanding achievement in<br>
        <em>"${examTitle}"</em>
      </div>

      ${details.length ? `<div class="meta">${detailPills}</div>` : ''}

    </div>
  </div>

  <div class="footer">
    ${footer}
  </div>

</div>
</body>
</html>`;
  }
};

module.exports = { generateCertificateHTML };