import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

const BRIEF_EXCERPT = `JURISDICTIONAL STATEMENT

This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292 because it is an appeal of an order that denied Reyna's assertion of qualified immunity. Reyna timely appealed by filing his notice of appeal within 30 days of the district court's order of September 6, 2019.

ISSUES PRESENTED

This qualified immunity appeal raises questions regarding the application of probable cause in multi-suspect cases.

STATEMENT OF THE CASE

On May 17, 2015, a shooting occurred outside the Twin Peaks restaurant in Waco, Texas, resulting in the deaths of nine people and injuries to twenty others. In the aftermath, law enforcement officers arrested 193 individuals. Plaintiffs Bradley Terwilliger, Benjamin Matcek, and Jimmy Dan Smith were among those arrested.

The Supreme Court has long recognized that "the Fourth Amendment requires that arrests be supported by probable cause." Illinois v. Gates, 462 U.S. 213, 232 (1983). In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court held that a complaint must contain "enough facts to state a claim to relief that is plausible on its face." See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

Under Fed. R. Civ. P. 12(b)(6), a court may dismiss a complaint for failure to state a claim upon which relief can be granted. The standard requires the plaintiff to plead "factual content that allows the court to draw the reasonable inference that the defendant is liable for the misconduct alleged." Iqbal, 556 U.S. at 678.

The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13, which authorizes peace officers to make arrests. However, the Fourth Amendment, U.S. Const. amend. IV, requires that an officer have probable cause to believe that the person arrested has committed a crime. See Maryland v. Pringle, 540 U.S. 366, 371 (2003).

As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996), qualified immunity shields government officials from civil liability when their conduct does not violate clearly established statutory or constitutional rights. See also Papasan v. Allain, 478 U.S. 265, 286 (1986).

The district court denied Reyna's motion to dismiss, finding that plaintiffs had adequately alleged a violation of their Fourth Amendment rights. The court relied on Mitchell v. Forsyth, 472 U.S. 511 (1985), which established that denial of qualified immunity is immediately appealable under the collateral order doctrine.

In Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010), this Court held that officers must have individualized probable cause before making an arrest. The Restatement (Second) of Torts § 119 provides that a person is liable for false imprisonment if he acts intending to confine another.`;

(async () => {
  console.log('Launching browser for Word Online demo...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: './recordings',
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Step 1: Go to Word Online directly
    console.log('Navigating to Word Online...');
    await page.goto('https://www.office.com/launch/word');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if we need to log in
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Entering email...');
      await emailInput.fill(MS_EMAIL);
      await page.waitForTimeout(500);
      await page.locator('input[type="submit"], #idSIButton9').click();
      await page.waitForTimeout(3000);
    }

    // Enter password
    const passInput = page.locator('input[type="password"]');
    if (await passInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('Entering password...');
      await passInput.fill(MS_PASS);
      await page.waitForTimeout(500);
      await page.locator('input[type="submit"], #idSIButton9').click();
      await page.waitForTimeout(3000);
    }

    // Handle "Stay signed in?" prompt
    const staySignedIn = page.locator('#idSIButton9, #acceptButton, input[value="Yes"]');
    if (await staySignedIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking "Yes" on stay signed in...');
      await staySignedIn.click();
      await page.waitForTimeout(3000);
    }

    // Wait for Word Online to load
    console.log('Waiting for Word Online...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Take a screenshot to see where we are
    await page.screenshot({ path: './recordings/step1-after-login.png' });
    console.log('Screenshot saved: step1-after-login.png');

    // Try to create a new blank document
    console.log('Looking for new document option...');
    // Word Online landing page usually has a "New blank document" or similar
    const newDocBtn = page.locator('text=Blank document, text=New blank document, [aria-label*="Blank document"], [aria-label*="New blank"]').first();
    if (await newDocBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await newDocBtn.click();
      await page.waitForTimeout(5000);
    } else {
      // Try navigating directly to create a new doc
      console.log('Trying direct navigation to new document...');
      await page.goto('https://word.cloud.microsoft/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: './recordings/step2-word-home.png' });

      // Look for create new
      const createBtn = page.locator('[data-automationid="newButton"], text=New, text=Blank document, [aria-label*="blank"]').first();
      if (await createBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: './recordings/step3-document.png' });
    console.log('Screenshot saved: step3-document.png');

    // Type or paste the legal brief text into the document
    console.log('Pasting brief text into document...');
    // Word Online's editor is usually a contenteditable div
    const editor = page.locator('[contenteditable="true"], .WACEditing, #WACViewPanel_EditingElement, [role="textbox"]').first();
    if (await editor.isVisible({ timeout: 15000 }).catch(() => false)) {
      await editor.click();
      await page.waitForTimeout(1000);

      // Type the brief text (using keyboard for reliability)
      await page.keyboard.type(BRIEF_EXCERPT.substring(0, 500), { delay: 5 });
      await page.waitForTimeout(1000);

      // Paste the rest
      await page.evaluate((text) => {
        const el = document.querySelector('[contenteditable="true"], .WACEditing, [role="textbox"]');
        if (el) {
          // Use execCommand for paste
          document.execCommand('insertText', false, text);
        }
      }, BRIEF_EXCERPT.substring(500));
      await page.waitForTimeout(2000);
    } else {
      console.log('Could not find editor element, trying keyboard approach...');
      await page.keyboard.type(BRIEF_EXCERPT.substring(0, 200), { delay: 10 });
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: './recordings/step4-text-pasted.png' });
    console.log('Brief text pasted. Screenshot saved.');

    // Now try to sideload the add-in
    console.log('Opening Insert tab for add-in sideloading...');
    // Click Insert tab
    const insertTab = page.locator('text=Insert, [aria-label="Insert"], button:has-text("Insert")').first();
    if (await insertTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await insertTab.click();
      await page.waitForTimeout(2000);
    }

    // Look for Add-ins / My Add-ins button
    const addinsBtn = page.locator('text=Add-ins, text=My Add-ins, [aria-label*="Add-ins"], [aria-label*="add-in"]').first();
    if (await addinsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addinsBtn.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: './recordings/step5-addins.png' });
    console.log('Add-ins dialog. Screenshot saved.');

    // Look for "Upload My Add-in" or "MY ADD-INS" tab
    const uploadTab = page.locator('text=MY ADD-INS, text=Upload My Add-in, text=My add-ins').first();
    if (await uploadTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadTab.click();
      await page.waitForTimeout(2000);
    }

    // Upload manifest
    const uploadLink = page.locator('text=Upload My Add-in, text=upload, a:has-text("Upload")').first();
    if (await uploadLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await uploadLink.click();
      await page.waitForTimeout(2000);
    }

    // File input for manifest upload
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles('./dist/manifest.xml');
      await page.waitForTimeout(2000);
      console.log('Manifest uploaded!');

      // Click Upload/OK button
      const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("OK")').first();
      if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await uploadBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: './recordings/step6-addin-loaded.png' });
    console.log('Add-in sideloaded. Screenshot saved.');

    // Wait for task pane to appear and interact
    await page.waitForTimeout(5000);
    await page.screenshot({ path: './recordings/step7-taskpane.png' });

    // Try clicking Scan Document in the task pane (it may be in an iframe)
    const frames = page.frames();
    console.log(`Found ${frames.length} frames`);
    for (const frame of frames) {
      const scanBtn = frame.locator('#scanButton, text=Scan Document');
      if (await scanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Found Scan Document button in frame!');
        await scanBtn.click();
        await page.waitForTimeout(5000);
        
        const genBtn = frame.locator('#generateButton, text=Generate TOA');
        if (await genBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await genBtn.click();
          await page.waitForTimeout(5000);
        }
        break;
      }
    }

    await page.screenshot({ path: './recordings/step8-final.png' });
    console.log('Final screenshot saved.');

    // Final pause for video
    await page.waitForTimeout(3000);

  } catch (err: any) {
    console.error('Error:', err.message);
    await page.screenshot({ path: './recordings/error.png' });
  }

  console.log('Closing browser...');
  await page.close();
  await context.close();
  await browser.close();

  // Find and rename video
  const files = fs.readdirSync('./recordings').filter(f => f.endsWith('.webm'));
  const latest = files.sort().pop();
  if (latest) {
    const src = path.join('./recordings', latest);
    const dest = './recordings/word-online-demo.webm';
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(src, dest);
    console.log(`Video saved: ${dest} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
  }
})();
