import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

const BRIEF_EXCERPT = `JURISDICTIONAL STATEMENT

This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292 because it is an appeal of an order that denied Reyna's assertion of qualified immunity.

STATEMENT OF THE CASE

On May 17, 2015, a shooting occurred outside the Twin Peaks restaurant in Waco, Texas. The Supreme Court has long recognized that the Fourth Amendment requires arrests be supported by probable cause. Illinois v. Gates, 462 U.S. 213, 232 (1983). In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court held that a complaint must contain enough facts to state a claim. See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

Under Fed. R. Civ. P. 12(b)(6), a court may dismiss a complaint for failure to state a claim. The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13. The Fourth Amendment, U.S. Const. amend. IV, requires probable cause. See Maryland v. Pringle, 540 U.S. 366, 371 (2003).

As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996), qualified immunity shields government officials from civil liability. See also Papasan v. Allain, 478 U.S. 265, 286 (1986). The court relied on Mitchell v. Forsyth, 472 U.S. 511 (1985). In Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010), this Court held that officers must have individualized probable cause. The Restatement (Second) of Torts § 119 provides that a person is liable for false imprisonment.`;

const REC_DIR = './recordings';

let stepNum = 0;
async function snap(page: any, label: string) {
  stepNum++;
  const fname = `step${stepNum}-${label}.png`;
  await page.screenshot({ path: path.join(REC_DIR, fname) });
  console.log(`  📸 ${fname}`);
}

(async () => {
  console.log('=== Word Online Real Test ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // 1. Go to office.com
    console.log('1. Navigating to office.com...');
    await page.goto('https://www.office.com');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await snap(page, 'office-home');

    // 2. Click Sign In
    console.log('2. Looking for Sign In...');
    const signInBtn = page.locator('a:has-text("Sign in"), button:has-text("Sign in"), a[data-bi-cn="Sign in"]').first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInBtn.click();
      await page.waitForTimeout(3000);
    }
    await snap(page, 'after-signin-click');

    // 3. Email input
    console.log('3. Email input...');
    const emailInput = page.locator('input[type="email"], input[name="loginfmt"]').first();
    if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await emailInput.fill(MS_EMAIL);
      await page.waitForTimeout(500);
      await snap(page, 'email-filled');
      await page.locator('#idSIButton9').click();
      await page.waitForTimeout(4000);
    } else {
      console.log('  No email input found');
    }
    await snap(page, 'after-email-submit');

    // 4. Password input - may need to click "Use your password" first
    console.log('4. Password input...');
    // Try clicking "Use your password" link if it appears
    try {
      const usePasswordLink = page.locator('#idA_PWD_SwitchToPassword');
      if (await usePasswordLink.isVisible({ timeout: 5000 })) {
        console.log('  Clicking "Use your password"...');
        await usePasswordLink.click();
        await page.waitForTimeout(3000);
      }
    } catch {}
    // Also try text match
    try {
      const usePasswordText = page.getByText('Use your password');
      if (await usePasswordText.isVisible({ timeout: 3000 })) {
        console.log('  Clicking "Use your password" (text match)...');
        await usePasswordText.click();
        await page.waitForTimeout(3000);
      }
    } catch {}
    const passInput = page.locator('input[type="password"], input[name="passwd"]').first();
    if (await passInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await passInput.fill(MS_PASS);
      await page.waitForTimeout(500);
      await snap(page, 'password-filled');
      // Button may be "Sign in", "Next", or id=idSIButton9
      const signInBtn = page.locator('#idSIButton9, input[type="submit"], button:has-text("Sign in"), button:has-text("Next")').first();
      await signInBtn.click();
      await page.waitForTimeout(4000);
    } else {
      console.log('  No password input found');
    }
    await snap(page, 'after-password-submit');

    // 5. Handle "Stay signed in?"
    console.log('5. Stay signed in?');
    const stayBtn = page.locator('#idSIButton9, #acceptButton, button:has-text("Yes")').first();
    if (await stayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await stayBtn.click();
      await page.waitForTimeout(4000);
    }
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    await snap(page, 'logged-in');

    // 6. Navigate to Word
    console.log('6. Opening Word...');
    await page.goto('https://word.cloud.microsoft/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await snap(page, 'word-home');

    // 7. Create new blank document
    console.log('7. Creating new document...');
    // Try multiple selectors for the "New blank document" button
    const newDocSelectors = [
      'button:has-text("Blank document")',
      '[aria-label*="Blank document"]',
      '[aria-label*="blank document"]',
      '[data-automationid="newButton"]',
      'text=New blank document',
      'text=Blank document',
      '.ms-Button:has-text("New")',
    ];
    
    for (const sel of newDocSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`  Found: ${sel}`);
        await el.click();
        await page.waitForTimeout(8000);
        break;
      }
    }
    await snap(page, 'new-document');

    // 8. Wait for document editor to load
    console.log('8. Waiting for editor...');
    await page.waitForTimeout(5000);
    await snap(page, 'editor-loaded');

    // Print all visible text for debugging
    const pageText = await page.locator('body').innerText().catch(() => 'COULD NOT GET TEXT');
    console.log(`  Page title: ${await page.title()}`);
    console.log(`  Body text preview: ${pageText.substring(0, 300)}`);

    // 9. Try to type in the editor
    console.log('9. Typing in editor...');
    // Word Online uses an iframe - find it
    const frames = page.frames();
    console.log(`  Found ${frames.length} frames`);
    
    let editorFrame = null;
    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('word') || url.includes('WOPIFrame') || url.includes('edit')) {
        console.log(`  Frame: ${url.substring(0, 100)}`);
      }
      const editor = frame.locator('[contenteditable="true"]').first();
      if (await editor.isVisible({ timeout: 1000 }).catch(() => false)) {
        editorFrame = frame;
        console.log('  Found contenteditable frame!');
        break;
      }
    }

    if (editorFrame) {
      const editor = editorFrame.locator('[contenteditable="true"]').first();
      await editor.click();
      await page.waitForTimeout(1000);
      await page.keyboard.type(BRIEF_EXCERPT, { delay: 2 });
      await page.waitForTimeout(3000);
      await snap(page, 'text-typed');
    } else {
      // Try clicking in the main page area and typing
      console.log('  No contenteditable frame found, trying main page...');
      await page.click('body');
      await page.keyboard.type(BRIEF_EXCERPT.substring(0, 200), { delay: 5 });
      await page.waitForTimeout(2000);
      await snap(page, 'text-attempt');
    }

    // 10. Open Insert tab → Add-ins
    console.log('10. Opening Insert tab...');
    for (const frame of page.frames()) {
      const insertTab = frame.locator('button:has-text("Insert"), [aria-label="Insert"]').first();
      if (await insertTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await insertTab.click();
        await page.waitForTimeout(2000);
        console.log('  Clicked Insert tab');
        break;
      }
    }
    await snap(page, 'insert-tab');

    // 11. Click Add-ins
    console.log('11. Looking for Add-ins...');
    for (const frame of page.frames()) {
      const addins = frame.locator('button:has-text("Add-ins"), [aria-label*="Add-ins"], button:has-text("My Add-ins")').first();
      if (await addins.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addins.click();
        await page.waitForTimeout(3000);
        console.log('  Clicked Add-ins');
        break;
      }
    }
    await snap(page, 'addins-dialog');

    // 12. Upload manifest
    console.log('12. Uploading manifest...');
    // Look for "Upload My Add-in" or "MY ADD-INS" tab in any frame
    for (const frame of page.frames()) {
      const myAddins = frame.locator('text=MY ADD-INS, text=My Add-ins, a:has-text("MY ADD-INS")').first();
      if (await myAddins.isVisible({ timeout: 3000 }).catch(() => false)) {
        await myAddins.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    for (const frame of page.frames()) {
      const uploadBtn = frame.locator('text=Upload My Add-in, a:has-text("upload"), button:has-text("Upload")').first();
      if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await uploadBtn.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    // Find file input
    for (const frame of page.frames()) {
      const fileInput = frame.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('./dist/manifest.xml');
        console.log('  Manifest file selected');
        await page.waitForTimeout(2000);
        
        // Click Upload button
        const uploadConfirm = frame.locator('button:has-text("Upload"), input[value="Upload"]').first();
        if (await uploadConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
          await uploadConfirm.click();
          await page.waitForTimeout(5000);
        }
        break;
      }
    }
    await snap(page, 'manifest-uploaded');

    // 13. Interact with our add-in task pane
    console.log('13. Looking for TOA task pane...');
    await page.waitForTimeout(5000);
    
    for (const frame of page.frames()) {
      const scanBtn = frame.locator('#scanButton');
      if (await scanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  Found our add-in task pane!');
        await snap(page, 'taskpane-visible');
        await scanBtn.click();
        await page.waitForTimeout(5000);
        await snap(page, 'after-scan');
        
        const genBtn = frame.locator('#generateButton');
        if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await genBtn.click();
          await page.waitForTimeout(5000);
          await snap(page, 'after-generate');
        }
        break;
      }
    }

    await snap(page, 'final');
    await page.waitForTimeout(3000);

  } catch (err: any) {
    console.error(`ERROR: ${err.message}`);
    await snap(page, 'error');
  }

  console.log('\nClosing browser...');
  await page.close();
  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
  const latest = files.sort().pop();
  if (latest) {
    const src = path.join(REC_DIR, latest);
    const dest = path.join(REC_DIR, 'word-online-v2.webm');
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log(`Video saved: word-online-v2.webm (${size} KB)`);
  }
})();
