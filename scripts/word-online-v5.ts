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
    console.log('--- Word Online Automation Start (v5) ---');
    
    if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR);

    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: 100 // Slow down for video clarity and stability
    });
    
    const context = await browser.newContext({
        recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
        viewport: { width: 1440, height: 900 }
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        console.log('Step 1: Navigating to Word Online...');
        // Go directly to Word to trigger the specific auth flow
        await page.goto('https://www.microsoft365.com/launch/word?auth=1');
        
        console.log('Step 2: Entering email...');
        await page.waitForSelector('input[name="loginfmt"]');
        await page.fill('input[name="loginfmt"]', MS_EMAIL);
        await page.click('input[type="submit"]');
        await page.waitForTimeout(3000);

        // Check for "Use your password" link
        console.log('Checking for "Use your password" link...');
        const usePwd = page.locator('text=Use your password, #idA_PWD_SwitchToPassword');
        if (await usePwd.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  Found link, clicking...');
            await usePwd.click();
            await page.waitForTimeout(3000);
        }

        console.log('Step 3: Entering password...');
        await page.waitForSelector('input[name="passwd"]');
        await page.fill('input[name="passwd"]', MS_PASS);
        await page.click('input[type="submit"]');
        await page.waitForTimeout(5000);

        console.log('Step 4: Handling "Stay signed in?"...');
        const stayBtn = page.locator('text=Yes, #idSIButton9').first();
        if (await stayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await stayBtn.click();
            await page.waitForTimeout(8000);
        }

        console.log('Step 5: Word Online Landing...');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(REC_DIR, 'v5-word-home.png') });

        console.log('Step 6: Creating new blank document...');
        const newDocSelectors = [
            '[data-automationid="newButton"]',
            '[aria-label*="Blank document"]',
            'text=Blank document',
            '.ms-Icon--Add'
        ];
        
        let docClicked = false;
        for (const selector of newDocSelectors) {
            try {
                const el = page.locator(selector).first();
                if (await el.isVisible({ timeout: 3000 })) {
                    await el.click();
                    docClicked = true;
                    break;
                }
            } catch {}
        }
        
        if (!docClicked) {
            console.log('  Could not find "New" button, trying direct navigation...');
            await page.goto('https://word.cloud.microsoft/new');
        }

        console.log('  Waiting for document editor...');
        await page.waitForTimeout(15000);
        await page.screenshot({ path: path.join(REC_DIR, 'v5-document-loaded.png') });

        console.log('Step 7: Typing content...');
        // Word Online is notorious for nested iframes
        const typeInEditor = async () => {
            const allFrames = page.frames();
            for (const frame of allFrames) {
                try {
                    const editor = frame.locator('[contenteditable="true"]').first();
                    if (await editor.isVisible({ timeout: 2000 })) {
                        console.log(`  Found editor in frame: ${frame.name() || frame.url().substring(0, 30)}`);
                        await editor.click();
                        await page.keyboard.type(BRIEF_TEXT, { delay: 10 });
                        return true;
                    }
                } catch {}
            }
            return false;
        };

        if (!(await typeInEditor())) {
            console.log('  Frame typing failed, trying main page click-then-type...');
            await page.mouse.click(700, 400);
            await page.keyboard.type(BRIEF_TEXT, { delay: 10 });
        }
        await page.waitForTimeout(5000);

        console.log('Step 8: Opening Insert > Add-ins...');
        const clickInsert = async () => {
            const tabs = ['Insert', 'INSERT'];
            for (const tab of tabs) {
                const el = page.locator(`text=${tab}, [aria-label="${tab}"]`).first();
                if (await el.isVisible({ timeout: 2000 })) {
                    await el.click();
                    return true;
                }
            }
            return false;
        };
        await clickInsert();
        await page.waitForTimeout(2000);

        const addinsBtn = page.locator('text=Add-ins, [aria-label*="Add-ins"]').first();
        await addinsBtn.click();
        await page.waitForTimeout(8000);
        await page.screenshot({ path: path.join(REC_DIR, 'v5-addins-dialog.png') });

        console.log('Step 9: Sideloading Add-in...');
        // Try to click "My Add-ins" tab in dialog
        const myAddins = page.locator('text=MY ADD-INS, text=My Add-ins').first();
        if (await myAddins.isVisible({ timeout: 3000 }).catch(() => false)) {
            await myAddins.click();
            await page.waitForTimeout(2000);
        }

        const uploadLink = page.locator('text=Upload My Add-in').first();
        if (await uploadLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await uploadLink.click();
            await page.waitForTimeout(2000);
            
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles('./dist/manifest.xml');
            await page.click('button:has-text("Upload")');
            console.log('  Manifest uploaded successfully.');
        } else {
             console.log('  Could not find "Upload My Add-in" link.');
        }

        console.log('Step 10: Running TOA Generator...');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: path.join(REC_DIR, 'v5-taskpane-check.png') });

        // Search for our taskpane scan button across all frames
        const finalFrames = page.frames();
        console.log(`Searching across ${finalFrames.length} frames for #scanButton...`);
        for (const frame of finalFrames) {
            try {
                const scanBtn = frame.locator('#scanButton');
                if (await scanBtn.isVisible({ timeout: 2000 })) {
                    console.log('  Found Scan button! Triggering TOA process...');
                    await scanBtn.click();
                    await page.waitForTimeout(5000);
                    
                    const genBtn = frame.locator('#generateButton');
                    await genBtn.click();
                    console.log('  TOA Generated in real Word Online!');
                    await page.waitForTimeout(8000);
                    break;
                }
            } catch {}
        }

        console.log('Final success screenshot...');
        await page.screenshot({ path: path.join(REC_DIR, 'v5-final.png') });
        await page.waitForTimeout(3000);

    } catch (err: any) {
        console.error('ERROR during automation:', err.message);
        await page.screenshot({ path: path.join(REC_DIR, 'v5-error.png') });
    }

    console.log('Cleaning up...');
    await context.close();
    await browser.close();
    
    const vids = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
    if (vids.length > 0) {
        fs.renameSync(path.join(REC_DIR, vids[0]), path.join(REC_DIR, 'word-online-v5.webm'));
        console.log('Video saved to word-online-v5.webm');
    }
})();
