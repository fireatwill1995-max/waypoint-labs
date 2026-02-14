/**
 * Convert mining_australia_report.html to PDF on user's Desktop.
 * Usage: node scripts/mining-to-pdf.js
 */
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const htmlPath = path.join(projectRoot, 'scripts', 'mining_australia_report.html');
const desktopPath = path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop');
const fallbackDesktop = path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop');
const outputDir = fs.existsSync(desktopPath) ? desktopPath : fallbackDesktop;
const pdfPath = path.join(outputDir, 'Waypoint_Labs_Mining_Australia.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(1);
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/').replace(/^\/+/, '');

(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  });
  await browser.close();
  console.log('PDF saved to:', pdfPath);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
