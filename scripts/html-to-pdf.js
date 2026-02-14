/**
 * Convert report_content.html to PDF using Puppeteer (npx puppeteer).
 * Usage: node scripts/html-to-pdf.js
 * Output: User's Desktop / Waypoint_Labs_Report.pdf
 */
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const htmlPath = path.join(projectRoot, 'scripts', 'report_content.html');
const desktopPath = path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop');
const fallbackDesktop = path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop');
const outputDir = fs.existsSync(desktopPath) ? desktopPath : fallbackDesktop;
const pdfPath = path.join(outputDir, 'Waypoint_Labs_Report.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(1);
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/').replace(/^\/+/, '');

(async () => {
  try {
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
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' && e.message.includes('puppeteer')) {
      console.log('Puppeteer not installed. Installing...');
      const { execSync } = require('child_process');
      execSync('npm install puppeteer --no-save --prefix "' + projectRoot + '"', { stdio: 'inherit' });
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
    } else {
      throw e;
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
