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
    console.log('--- Word Online Automation Start ---');
    
    if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR);

    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
        viewport: { width: 1440, height: 900 }
    });
    
    const page = await context.newPage();
    page.setDefaultTimeout(45000);

    try {
        console.log('Step 1: Navigating to Microsoft login...');
        await page.goto('https://login.microsoftonline.com/');
        
        console.log('Step 2: Entering email...');
        await page.fill('input[name="loginfmt"]', MS_EMAIL);
        await page.click('input[value="Next"], #idSIButton9, button:has-text("Next")');
        await page.waitForTimeout(3000);

        // Check for "Use your password" instead of code
        const usePassword = page.locator('text=Use your password, #idA_PWD_SwitchToPassword');
        if (await usePassword.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  Clicking "Use your password"...');
            await usePassword.click();
            await page.waitForTimeout(2000);
        }

        console.log('Step 3: Entering password...');
        await page.fill('input[name="passwd"]', MS_PASS);
        await page.click('input[value="Sign in"], #idSIButton9, button:has-text("Sign in")');
        await page.waitForTimeout(3000);

        console.log('Step 4: Handling "Stay signed in?"...');
        const stayBtn = page.locator('input[value="Yes"], #idSIButton9, button:has-text("Yes")');
        if (await stayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await stayBtn.click();
            await page.waitForTimeout(5000);
        }

        console.log('Step 5: Navigating to Word Online...');
        await page.goto('https://www.microsoft365.com/launch/word?auth=1');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(REC_DIR, 'word-home.png') });

        console.log('Step 6: Creating new blank document...');
        const newBtn = page.locator('[data-automationid="newButton"], [aria-label*="Blank document"], text=Blank document').first();
        await newBtn.click();
        
        console.log('  Waiting for document editor to load (can take a while)...');
        await page.waitForTimeout(15000);
        await page.screenshot({ path: path.join(REC_DIR, 'document-loaded.png') });

        console.log('Step 7: Typing brief text...');
        // Try to find the editor frame
        let editorFound = false;
        const frames = page.frames();
        for (const frame of frames) {
            const editor = frame.locator('[contenteditable="true"], #WACViewPanel_EditingElement').first();
            if (await editor.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('  Found editor in frame!');
                await editor.click();
                await page.keyboard.type(BRIEF_TEXT, { delay: 10 });
                editorFound = true;
                break;
            }
        }

        if (!editorFound) {
            console.log('  Editor not found in frames, trying main page keyboard...');
            await page.mouse.click(600, 400); // Click in the middle of the document area
            await page.keyboard.type(BRIEF_TEXT, { delay: 10 });
        }
        await page.waitForTimeout(3000);

        console.log('Step 8: Opening Add-ins menu...');
        // Look for Insert tab
        const insertTab = page.locator('button:has-text("Insert"), [aria-label="Insert"]').first();
        await insertTab.click();
        await page.waitForTimeout(2000);

        const addinsBtn = page.locator('button:has-text("Add-ins"), [aria-label*="Add-ins"]').first();
        await addinsBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(REC_DIR, 'addins-dialog.png') });

        console.log('Step 9: Uploading manifest...');
        // Sideloading usually involves clicking "My Add-ins" then "Upload My Add-in"
        const myAddins = page.locator('text=MY ADD-INS, text=My add-ins').first();
        if (await myAddins.isVisible()) await myAddins.click();
        await page.waitForTimeout(2000);

        const uploadLink = page.locator('text=Upload My Add-in').first();
        if (await uploadLink.isVisible()) await uploadLink.click();
        await page.waitForTimeout(2000);

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles('./dist/manifest.xml');
            await page.click('button:has-text("Upload")');
            console.log('  Manifest uploaded.');
        }

        console.log('Step 10: Running the TOA Generator...');
        await page.waitForTimeout(10000); // Wait for task pane
        await page.screenshot({ path: path.join(REC_DIR, 'taskpane-loaded.png') });

        // Interact with our task pane (it will be in an iframe)
        const updatedFrames = page.frames();
        for (const frame of updatedFrames) {
            const scanBtn = frame.locator('#scanButton');
            if (await scanBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('  Found Scan button in task pane!');
                await scanBtn.click();
                await page.waitForTimeout(5000);
                
                const genBtn = frame.locator('#generateButton');
                if (await genBtn.isVisible().catch(() => false)) {
                    await genBtn.click();
                    console.log('  TOA Generated!');
                    await page.waitForTimeout(5000);
                }
                break;
            }
        }

        console.log('Final screenshot...');
        await page.screenshot({ path: path.join(REC_DIR, 'final-result.png') });
        await page.waitForTimeout(2000);

    } catch (err: any) {
        console.error('CRITICAL ERROR:', err.message);
        await page.screenshot({ path: path.join(REC_DIR, 'error.png') });
    }

    console.log('Closing browser...');
    await context.close();
    await browser.close();
    
    // Rename the video
    const videoFiles = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
        fs.renameSync(path.join(REC_DIR, videoFiles[0]), path.join(REC_DIR, 'word-online-v4.webm'));
        console.log('Video saved to word-online-v4.webm');
    }
})();
