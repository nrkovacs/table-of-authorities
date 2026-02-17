import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

const BRIEF_TEXT = `JURISDICTIONAL STATEMENT
This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292 because it is an appeal of an order that denied Reyna's assertion of qualified immunity.

STATEMENT OF THE CASE
The Supreme Court has long recognized that "the Fourth Amendment requires that arrests be supported by probable cause." Illinois v. Gates, 462 U.S. 213, 232 (1983). In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court held that a complaint must contain "enough facts to state a claim to relief that is plausible on its face." See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

Under Fed. R. Civ. P. 12(b)(6), a court may dismiss a complaint for failure to state a claim upon which relief can be granted. Iqbal, 556 U.S. at 678. The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13. However, the Fourth Amendment, U.S. Const. amend. IV, requires probable cause. See Maryland v. Pringle, 540 U.S. 366, 371 (2003).

As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996), qualified immunity shields government officials. See also Papasan v. Allain, 478 U.S. 265, 286 (1986). The court relied on Mitchell v. Forsyth, 472 U.S. 511 (1985). In Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010), this Court held that officers must have individualized probable cause. The Restatement (Second) of Torts § 119 provides the standard.`;

const REC_DIR = './recordings';

(async () => {
    console.log('--- Word Online Automation (v10) ---');
    if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        // === LOGIN ===
        console.log('Step 1: login.live.com...');
        await page.goto('https://login.live.com/');
        
        console.log('Step 2: Email...');
        await page.locator('input[type="email"], #usernameEntry').first().fill(MS_EMAIL);
        await page.locator('button:has-text("Next"), input[type="submit"]').first().click();
        await page.waitForTimeout(3000);

        // Handle "Use your password" vs code
        const usePwd = page.getByText('Use your password');
        if (await usePwd.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  Clicking "Use your password"...');
            await usePwd.click();
            await page.waitForTimeout(3000);
        }

        console.log('Step 3: Password...');
        await page.locator('input[type="password"], #passwordEntry').first().fill(MS_PASS);
        await page.locator('button:has-text("Next"), button:has-text("Sign in"), input[type="submit"]').first().click();
        await page.waitForTimeout(5000);

        console.log('Step 4: Stay signed in?');
        try {
            const stayBtn = page.locator('button:has-text("Yes")').first();
            if (await stayBtn.isVisible({ timeout: 5000 })) {
                await stayBtn.click({ noWaitAfter: true });
                console.log('  Clicked Yes, waiting for redirect...');
                await page.waitForTimeout(10000);
            }
        } catch { console.log('  No "Stay signed in" prompt, continuing...'); }

        // === WORD ONLINE ===
        console.log('Step 5: Navigate to Word Online...');
        await page.goto('https://word.cloud.microsoft/new', { waitUntil: 'networkidle' });
        console.log('  Waiting 30s for editor...');
        await page.waitForTimeout(30000);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-01-doc-ready.png') });

        // === TYPE BRIEF ===
        console.log('Step 6: Typing Brief Text...');
        await page.mouse.click(720, 500);
        await page.waitForTimeout(1000);
        await page.keyboard.type(BRIEF_TEXT, { delay: 5 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-02-text-typed.png') });

        // === CLICK INSERT TAB (Gemini's fix: use getByRole) ===
        console.log('Step 7: Clicking Insert tab...');
        await page.waitForTimeout(1000); // Let UI settle after typing
        
        // Try multiple approaches to click Insert tab
        let insertClicked = false;
        
        // Approach 1: getByRole tab
        try {
            const insertTab = page.getByRole('tab', { name: 'Insert' });
            if (await insertTab.isVisible({ timeout: 3000 })) {
                await insertTab.click();
                insertClicked = true;
                console.log('  ✅ Clicked Insert tab via getByRole("tab")');
            }
        } catch {}
        
        // Approach 2: div[role="tab"] with text
        if (!insertClicked) {
            try {
                const insertDiv = page.locator('div[role="tab"]:has-text("Insert")');
                if (await insertDiv.isVisible({ timeout: 3000 })) {
                    await insertDiv.click();
                    insertClicked = true;
                    console.log('  ✅ Clicked Insert tab via div[role="tab"]');
                }
            } catch {}
        }
        
        // Approach 3: li or button with Insert text
        if (!insertClicked) {
            try {
                const insertEl = page.locator('li:has-text("Insert"), button:has-text("Insert")').first();
                if (await insertEl.isVisible({ timeout: 3000 })) {
                    await insertEl.click();
                    insertClicked = true;
                    console.log('  ✅ Clicked Insert via li/button');
                }
            } catch {}
        }
        
        // Approach 4: Just click the text "Insert" in the ribbon area
        if (!insertClicked) {
            try {
                const insertText = page.locator('[role="tablist"] >> text=Insert');
                if (await insertText.isVisible({ timeout: 3000 })) {
                    await insertText.click();
                    insertClicked = true;
                    console.log('  ✅ Clicked Insert via tablist text');
                }
            } catch {}
        }

        if (!insertClicked) {
            console.log('  ⚠️ Could not find Insert tab via any approach. Dumping ribbon info...');
            // Debug: list all tabs
            const tabs = await page.locator('[role="tab"]').all();
            console.log(`  Found ${tabs.length} tabs:`);
            for (const tab of tabs) {
                const text = await tab.textContent();
                console.log(`    - "${text}"`);
            }
        }

        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-03-insert-tab.png') });

        // === CLICK ADD-INS ===
        console.log('Step 8: Clicking Add-ins...');
        let addinsClicked = false;
        
        // Approach 1: getByRole button
        try {
            const addinsBtn = page.getByRole('button', { name: 'Add-ins' });
            if (await addinsBtn.isVisible({ timeout: 5000 })) {
                await addinsBtn.click();
                addinsClicked = true;
                console.log('  ✅ Clicked Add-ins via getByRole("button")');
            }
        } catch {}
        
        // Approach 2: If there's a dropdown arrow on the Add-ins button
        if (!addinsClicked) {
            try {
                const addinsMenu = page.locator('[aria-label*="Add-ins"], [title*="Add-ins"]').first();
                if (await addinsMenu.isVisible({ timeout: 3000 })) {
                    await addinsMenu.click();
                    addinsClicked = true;
                    console.log('  ✅ Clicked Add-ins via aria-label/title');
                }
            } catch {}
        }

        // Approach 3: Hexagon icon on Home tab (Gemini noted this)
        if (!addinsClicked) {
            try {
                const hexBtn = page.locator('button:has-text("Add-ins")').first();
                if (await hexBtn.isVisible({ timeout: 3000 })) {
                    await hexBtn.click();
                    addinsClicked = true;
                    console.log('  ✅ Clicked Add-ins button on Home tab');
                }
            } catch {}
        }

        if (!addinsClicked) {
            console.log('  ⚠️ Could not find Add-ins button. Dumping visible buttons...');
            const buttons = await page.locator('button').all();
            console.log(`  Found ${buttons.length} buttons. Listing those with text:`);
            for (const btn of buttons.slice(0, 50)) {
                const text = (await btn.textContent())?.trim();
                if (text) console.log(`    - "${text}"`);
            }
        }

        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-04-addins-dialog.png') });

        // === SIDELOAD MANIFEST ===
        console.log('Step 9: Sideloading manifest...');
        
        // Look for "My Add-ins" tab in the dialog
        const myAddins = page.getByText('MY ADD-INS').or(page.getByText('My add-ins')).or(page.getByText('My Add-ins'));
        if (await myAddins.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  Found "My Add-ins" tab, clicking...');
            await myAddins.first().click();
            await page.waitForTimeout(2000);
        }

        const uploadLink = page.getByText('Upload My Add-in');
        if (await uploadLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  Found "Upload My Add-in" link, clicking...');
            await uploadLink.click();
            await page.waitForTimeout(2000);
            
            const fileInput = page.locator('input[type="file"]');
            if (await fileInput.count() > 0) {
                await fileInput.setInputFiles('./dist/manifest.xml');
                console.log('  Manifest file selected.');
                
                const uploadBtn = page.getByRole('button', { name: 'Upload' });
                if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await uploadBtn.click();
                    console.log('  ✅ Manifest uploaded!');
                }
            }
        } else {
            console.log('  ⚠️ "Upload My Add-in" not found.');
        }

        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-05-after-upload.png') });

        // === INTERACT WITH TASK PANE ===
        console.log('Step 10: Looking for task pane...');
        const frames = page.frames();
        console.log(`  Checking ${frames.length} frames...`);
        let taskPaneFound = false;
        
        for (const frame of frames) {
            const scanBtn = frame.locator('#scanButton');
            if (await scanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('  ✅ Found Scan button in task pane!');
                await scanBtn.click();
                await page.waitForTimeout(5000);
                await page.screenshot({ path: path.join(REC_DIR, 'v10-06-after-scan.png') });
                
                const genBtn = frame.locator('#generateButton');
                if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await genBtn.click();
                    console.log('  ✅ TOA Generated!');
                    await page.waitForTimeout(10000);
                }
                taskPaneFound = true;
                break;
            }
        }
        
        if (!taskPaneFound) {
            console.log('  ⚠️ Task pane not found in any frame.');
        }

        await page.screenshot({ path: path.join(REC_DIR, 'v10-07-final.png') });
        console.log('✅ Automation complete.');

    } catch (err: any) {
        console.error('ERROR:', err.message);
        await page.screenshot({ path: path.join(REC_DIR, 'v10-error.png'), timeout: 10000 }).catch(() => {});
    }

    await context.close();
    await browser.close();
    
    const vids = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
    if (vids.length > 0) {
        fs.renameSync(path.join(REC_DIR, vids[0]), path.join(REC_DIR, 'word-online-v10.webm'));
    }
})();
