const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');
const { generateCertificateHTML } = require('../templates/certificate');

const outputDir = path.join(__dirname, '../public/certificates');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const generateCertificatePDF = async (certData, template = 'modern') => {
  const html = generateCertificateHTML(certData, template);
  const fileName = `cert_${certData.certificateId}.pdf`;
  const outPath = path.join(outputDir, fileName);

  // Get the correct executable path depending on environment
  let executablePath;
  if (process.env.NODE_ENV === 'production') {
    // On Render — use @sparticuz/chromium which bundles its own Chrome
    executablePath = await chromium.executablePath();
  } else {
    // Local Windows development — use your local Chrome
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
    defaultViewport: chromium.defaultViewport,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 300));

    await page.pdf({
      path: outPath,
      width: '297mm',
      height: '210mm',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return { path: outPath, fileName };
  } finally {
    await browser.close();
  }
};

module.exports = { generateCertificatePDF };