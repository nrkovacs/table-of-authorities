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
    console.log('--- Word Online Automation Start (v6) ---');
    if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        console.log('Step 1: Navigating to login.live.com...');
        await page.goto('https://login.live.com/', { waitUntil: 'networkidle' });
        
        console.log('Step 2: Entering email...');
        const emailInput = page.locator('input[type="email"], input[name="loginfmt"]');
        await emailInput.waitFor({ state: 'visible' });
        await emailInput.fill(MS_EMAIL);
        await page.click('input[type="submit"], #idSIButton9, button:has-text("Next")');
        await page.waitForTimeout(3000);

        // Click "Use your password" if it appears
        try {
            const usePwd = page.locator('text=Use your password');
            if (await usePwd.isVisible({ timeout: 5000 })) {
                await usePwd.click();
                await page.waitForTimeout(2000);
            }
        } catch {}

        console.log('Step 3: Entering password...');
        const passInput = page.locator('input[type="password"], input[name="passwd"]');
        await passInput.waitFor({ state: 'visible' });
        await passInput.fill(MS_PASS);
        await page.click('input[type="submit"], #idSIButton9, button:has-text("Sign in")');
        await page.waitForTimeout(5000);

        console.log('Step 4: Handling "Stay signed in?"...');
        try {
            const stayBtn = page.locator('text=Yes, #idSIButton9').first();
            if (await stayBtn.isVisible({ timeout: 5000 })) {
                await stayBtn.click();
                await page.waitForTimeout(5000);
            }
        } catch {}

        console.log('Step 5: Navigating to Word document editor directly...');
        // Create a new document by navigating to the new doc URL
        await page.goto('https://word.cloud.microsoft/new', { waitUntil: 'networkidle' });
        console.log('  Waiting for editor to initialize...');
        await page.waitForTimeout(20000);
        await page.screenshot({ path: path.join(REC_DIR, 'v6-editor.png') });

        console.log('Step 6: Typing brief text...');
        // Click document area and type
        await page.mouse.click(720, 450);
        await page.keyboard.type(BRIEF_TEXT, { delay: 5 });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(REC_DIR, 'v6-text.png') });

        console.log('Step 7: Sideloading Add-in...');
        // Click Insert tab - selectors for ribbon can be tricky
        const insertSelectors = ['#InsertTab', 'button:has-text("Insert")', '[aria-label="Insert"]', 'text=Insert'];
        for (const sel of insertSelectors) {
            try {
                const el = page.locator(sel).first();
                if (await el.isVisible({ timeout: 2000 })) {
                    await el.click();
                    console.log(`  Clicked Insert via ${sel}`);
                    break;
                }
            } catch {}
        }
        await page.waitForTimeout(2000);

        const addinsSelectors = ['button:has-text("Add-ins")', '[aria-label*="Add-ins"]', 'text=Add-ins'];
        for (const sel of addinsSelectors) {
            try {
                const el = page.locator(sel).first();
                if (await el.isVisible({ timeout: 2000 })) {
                    await el.click();
                    console.log(`  Clicked Add-ins via ${sel}`);
                    break;
                }
            } catch {}
        }
        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(REC_DIR, 'v6-addins-dialog.png') });

        // Sideload manifest
        console.log('  Uploading manifest.xml...');
        const myAddins = page.locator('text=MY ADD-INS, text=My add-ins').first();
        if (await myAddins.isVisible({ timeout: 5000 }).catch(() => false)) {
            await myAddins.click();
            await page.waitForTimeout(2000);
            
            const uploadLink = page.locator('text=Upload My Add-in').first();
            if (await uploadLink.isVisible()) {
                await uploadLink.click();
                await page.waitForTimeout(2000);
                const fileInput = page.locator('input[type="file"]');
                await fileInput.setInputFiles('./dist/manifest.xml');
                await page.click('button:has-text("Upload")');
                console.log('  Manifest sideloaded!');
            }
        }

        console.log('Step 8: Interacting with task pane...');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(REC_DIR, 'v6-taskpane.png') });

        const frames = page.frames();
        for (const frame of frames) {
            const scanBtn = frame.locator('#scanButton');
            if (await scanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('  Task pane found in frame!');
                await scanBtn.click();
                await page.waitForTimeout(5000);
                const genBtn = frame.locator('#generateButton');
                await genBtn.click();
                console.log('  TOA Generated!');
                await page.waitForTimeout(10000);
                break;
            }
        }

        console.log('Final screenshot...');
        await page.screenshot({ path: path.join(REC_DIR, 'v6-final.png') });

    } catch (err: any) {
        console.error('ERROR:', err.message);
        await page.screenshot({ path: path.join(REC_DIR, 'v6-error.png') });
    }

    await context.close();
    await browser.close();
    
    const vids = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
    if (vids.length > 0) {
        fs.renameSync(path.join(REC_DIR, vids[0]), path.join(REC_DIR, 'word-online-v6.webm'));
    }
})();
