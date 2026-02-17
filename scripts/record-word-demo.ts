import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

(async () => {
  console.log('Starting Word demo recording...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: './recordings',
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 },
  });
  
  const page = await context.newPage();
  
  const demoPath = `file://${path.resolve('./demo/demo.html')}`;
  console.log(`Opening: ${demoPath}`);
  
  await page.goto(demoPath);
  await page.waitForLoadState('networkidle');
  
  // Let the page render fully
  await page.waitForTimeout(2000);
  console.log('Page loaded. Starting interactions...');
  
  // Scroll the document a bit to show the legal text
  await page.evaluate(() => {
    const docArea = document.querySelector('.document-area');
    if (docArea) docArea.scrollTop = 100;
  });
  await page.waitForTimeout(1500);
  
  // Click "Scan Document"
  console.log('Clicking Scan Document...');
  await page.click('#scanBtn');
  
  // Wait for scanning to complete (the button re-enables and stats appear)
  await page.waitForSelector('.stats.visible', { timeout: 15000 });
  console.log('Scan complete.');
  await page.waitForTimeout(2000);
  
  // Scroll the document to show highlighted citations
  await page.evaluate(() => {
    const firstHighlight = document.querySelector('.highlight');
    if (firstHighlight) firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(2000);
  
  // Click "Generate TOA"
  console.log('Clicking Generate TOA...');
  await page.click('#generateBtn');
  
  // Wait for TOA output
  await page.waitForSelector('.toa-output.visible', { timeout: 10000 });
  console.log('TOA generated.');
  await page.waitForTimeout(2000);
  
  // Scroll through the TOA output in the taskpane
  await page.evaluate(() => {
    const toaOutput = document.getElementById('toaOutput');
    if (toaOutput) {
      toaOutput.scrollTop = 0;
    }
  });
  await page.waitForTimeout(1500);
  
  await page.evaluate(() => {
    const toaOutput = document.getElementById('toaOutput');
    if (toaOutput) {
      toaOutput.scrollTo({ top: toaOutput.scrollHeight, behavior: 'smooth' });
    }
  });
  await page.waitForTimeout(2500);
  
  // Final pause
  await page.waitForTimeout(1500);
  
  console.log('Recording complete. Closing browser...');
  
  // Close - this finalizes the video
  await page.close();
  await context.close();
  await browser.close();
  
  // Find and rename the video
  const files = fs.readdirSync('./recordings').filter(f => f.endsWith('.webm'));
  const latest = files.sort().pop();
  if (latest) {
    const src = path.join('./recordings', latest);
    const dest = './recordings/word-demo.webm';
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
    console.log(`Video saved: ${dest} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
  } else {
    console.error('No video file found!');
  }
})();
