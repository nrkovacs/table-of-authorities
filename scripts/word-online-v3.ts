import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

const BRIEF_TEXT = `JURISDICTIONAL STATEMENT

This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292 because it is an appeal of an order that denied Reyna's assertion of qualified immunity.

STATEMENT OF THE CASE

On May 17, 2015, a shooting occurred outside the Twin Peaks restaurant in Waco, Texas. The Supreme Court has long recognized that the Fourth Amendment requires arrests be supported by probable cause. Illinois v. Gates, 462 U.S. 213, 232 (1983). In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court held that a complaint must contain enough facts to state a claim. See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

Under Fed. R. Civ. P. 12(b)(6), a court may dismiss a complaint for failure to state a claim. The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13. The Fourth Amendment, U.S. Const. amend. IV, requires probable cause. See Maryland v. Pringle, 540 U.S. 366, 371 (2003).

As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996), qualified immunity shields government officials from civil liability. See also Papasan v. Allain, 478 U.S. 265, 286 (1986). The court relied on Mitchell v. Forsyth, 472 U.S. 511 (1985). In Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010), this Court held that officers must have individualized probable cause. The Restatement (Second) of Torts § 119 provides that a person is liable for false imprisonment.`;

const REC = './recordings';
let step = 0;
async function snap(page: any, label: string) {
  step++;
  const f = `${REC}/s${step}-${label}.png`;
  try {
    await page.screenshot({ path: f, timeout: 15000 });
    console.log(`  📸 s${step}-${label}`);
  } catch {
    console.log(`  ⚠️ screenshot ${label} timed out`);
  }
}

(async () => {
  console.log('=== Word Online Test v3 ===\n');
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    recordVideo: { dir: REC, size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  try {
    // 1. Sign in via login.live.com directly
    console.log('1. Going to Microsoft login...');
    await page.goto('https://login.live.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await snap(page, 'login-page');

    // Email
    console.log('2. Entering email...');
    await page.fill('input[type="email"], input[name="loginfmt"]', MS_EMAIL);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(4000);
    await snap(page, 'after-email');

    // Handle "Use your password" if shown
    const usePwd = page.getByText('Use your password');
    if (await usePwd.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Clicking "Use your password"...');
      await usePwd.click();
      await page.waitForTimeout(3000);
    }

    // Password
    console.log('3. Entering password...');
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.waitFor({ state: 'visible', timeout: 10000 });
    await pwdInput.fill(MS_PASS);
    await page.waitForTimeout(500);
    await snap(page, 'pwd-filled');
    
    // Click Next/Sign in
    await page.getByRole('button', { name: /Next|Sign in/i }).click();
    await page.waitForTimeout(5000);
    await snap(page, 'after-pwd');

    // "Stay signed in?"
    const stayBtn = page.getByRole('button', { name: /Yes|Accept|Next/i });
    if (await stayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  Staying signed in...');
      await stayBtn.click({ noWaitAfter: true });
      await page.waitForTimeout(15000);
    }
    await snap(page, 'signed-in');
    console.log(`  URL: ${page.url()}`);

    // 2. Navigate to Word Online
    console.log('4. Opening Word Online...');
    await page.goto('https://word.cloud.microsoft/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(10000);
    await snap(page, 'word-home');
    console.log(`  URL: ${page.url()}`);
    console.log(`  Title: ${await page.title()}`);

    // 3. Create new blank document
    console.log('5. Creating blank document...');
    // Try clicking on "New blank document" or similar
    const selectors = [
      '[aria-label*="Blank document"]',
      '[aria-label*="blank document"]',
      'button:has-text("Blank document")',
      'text=Blank document',
      '[data-automationid="newButton"]',
      'img[alt*="Blank"]',
    ];
    let clicked = false;
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          console.log(`  Found: ${sel}`);
          await el.click();
          clicked = true;
          break;
        }
      } catch {}
    }
    if (!clicked) {
      // Maybe we need to look for "New" button first
      try {
        await page.locator('button:has-text("New"), text=New').first().click();
        await page.waitForTimeout(2000);
        await page.locator('text=Blank document').first().click();
      } catch {}
    }
    
    await page.waitForTimeout(10000);
    await snap(page, 'blank-doc');
    console.log(`  URL: ${page.url()}`);

    // 4. Type brief into editor
    console.log('6. Finding editor and typing brief...');
    // Word Online uses iframes - find the editing surface
    let typed = false;
    const allFrames = page.frames();
    console.log(`  ${allFrames.length} frames found`);
    
    for (const frame of allFrames) {
      try {
        const editor = frame.locator('[contenteditable="true"], .OutlineElement').first();
        if (await editor.isVisible({ timeout: 2000 })) {
          console.log(`  Found editor in frame: ${frame.url().substring(0, 80)}`);
          await editor.click();
          await page.waitForTimeout(500);
          // Type slowly enough for Word to keep up
          await page.keyboard.type(BRIEF_TEXT, { delay: 3 });
          typed = true;
          break;
        }
      } catch {}
    }
    
    if (!typed) {
      // Fallback: just click somewhere and type
      console.log('  Fallback: clicking page center and typing...');
      await page.mouse.click(500, 400);
      await page.waitForTimeout(1000);
      await page.keyboard.type(BRIEF_TEXT, { delay: 3 });
    }
    
    await page.waitForTimeout(3000);
    await snap(page, 'text-typed');

    // 5. Open Insert tab
    console.log('7. Opening Insert > Add-ins...');
    for (const frame of page.frames()) {
      try {
        const insertTab = frame.locator('[aria-label="Insert"], button[name="Insert"], text=Insert').first();
        if (await insertTab.isVisible({ timeout: 3000 })) {
          await insertTab.click();
          await page.waitForTimeout(2000);
          console.log('  Clicked Insert');
          break;
        }
      } catch {}
    }
    await snap(page, 'insert-tab');

    // Click Add-ins
    for (const frame of page.frames()) {
      try {
        const addins = frame.locator('[aria-label*="Add-ins"], button:has-text("Add-ins"), text=Add-ins').first();
        if (await addins.isVisible({ timeout: 3000 })) {
          await addins.click();
          await page.waitForTimeout(3000);
          console.log('  Clicked Add-ins');
          break;
        }
      } catch {}
    }
    await snap(page, 'addins');

    // MY ADD-INS tab
    for (const frame of page.frames()) {
      try {
        const myTab = frame.locator('text=MY ADD-INS, text=My Add-ins').first();
        if (await myTab.isVisible({ timeout: 3000 })) {
          await myTab.click();
          await page.waitForTimeout(2000);
          console.log('  Clicked MY ADD-INS');
          break;
        }
      } catch {}
    }

    // Upload My Add-in
    for (const frame of page.frames()) {
      try {
        const upload = frame.locator('text=Upload My Add-in, a:has-text("Upload")').first();
        if (await upload.isVisible({ timeout: 3000 })) {
          await upload.click();
          await page.waitForTimeout(2000);
          console.log('  Clicked Upload');
          break;
        }
      } catch {}
    }
    await snap(page, 'upload-dialog');

    // Set file and upload
    for (const frame of page.frames()) {
      const fileInput = frame.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('./dist/manifest.xml');
        await page.waitForTimeout(1000);
        console.log('  Manifest selected');
        
        const uploadBtn = frame.locator('button:has-text("Upload"), input[value="Upload"]').first();
        if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await uploadBtn.click();
          await page.waitForTimeout(5000);
          console.log('  Uploaded!');
        }
        break;
      }
    }
    await snap(page, 'after-upload');

    // 6. Use the add-in
    console.log('8. Interacting with TOA add-in...');
    await page.waitForTimeout(5000);
    
    for (const frame of page.frames()) {
      const scanBtn = frame.locator('#scanButton');
      if (await scanBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  TOA task pane found!');
        await snap(page, 'taskpane');
        
        await scanBtn.click();
        console.log('  Scanning...');
        await page.waitForTimeout(5000);
        await snap(page, 'scanned');
        
        const genBtn = frame.locator('#generateButton');
        if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await genBtn.click();
          console.log('  Generating TOA...');
          await page.waitForTimeout(5000);
          await snap(page, 'generated');
        }
        break;
      }
    }

    await snap(page, 'final');
    await page.waitForTimeout(3000);

  } catch (err: any) {
    console.error(`ERROR: ${err.message}`);
    await snap(page, 'error').catch(() => {});
  }

  console.log('\nDone. Closing...');
  await page.close();
  await ctx.close();
  await browser.close();

  const vids = fs.readdirSync(REC).filter(f => f.endsWith('.webm'));
  const latest = vids.sort().pop();
  if (latest) {
    const dest = `${REC}/word-online.webm`;
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(`${REC}/${latest}`, dest);
    console.log(`Video: ${dest} (${(fs.statSync(dest).size/1024).toFixed(0)} KB)`);
  }
})();
