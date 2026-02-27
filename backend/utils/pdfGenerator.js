const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { generateCertificateHTML } = require('../templates/certificate');

const outputDir = path.join(__dirname, '../public/certificates');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const generateCertificatePDF = async (certData, template = 'modern') => {
  const html = generateCertificateHTML(certData, template);
  // FIXED
  const fileName = `cert_${certData.certificateId}.pdf`;
  const outPath = path.join(outputDir, fileName);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',   // ← ADDED
    ]
  });

  try {
    const page = await browser.newPage();

    // Set A4 landscape viewport
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    await new Promise(r => setTimeout(r, 300));  // ← ADDED (layout settle)
    await page.pdf({
      path: outPath,
      width: '297mm',
      height: '210mm',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      // preferCSSPageSize removed
    });

    return { path: outPath, fileName };
  } finally {
    await browser.close();
  }
};

module.exports = { generateCertificatePDF };
