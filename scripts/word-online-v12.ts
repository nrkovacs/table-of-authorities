import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

const BRIEF_TEXT = `JURISDICTIONAL STATEMENT
This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292 because it is an appeal of an order that denied Reyna's assertion of qualified immunity.

STATEMENT OF THE CASE
The Supreme Court has long recognized that the Fourth Amendment requires that arrests be supported by probable cause. Illinois v. Gates, 462 U.S. 213, 232 (1983). In Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007), the Court held that a complaint must contain "enough facts to state a claim to relief that is plausible on its face." See also Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

Under Fed. R. Civ. P. 12(b)(6), a court may dismiss a complaint for failure to state a claim upon which relief can be granted. Iqbal, 556 U.S. at 678. The arrests were made pursuant to TEX. CRIM. PROC. CODE § 2.13. However, the Fourth Amendment, U.S. Const. amend. IV, requires probable cause. See Maryland v. Pringle, 540 U.S. 366, 371 (2003).

As this Court recognized in Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996), qualified immunity shields government officials. See also Papasan v. Allain, 478 U.S. 265, 286 (1986). The court relied on Mitchell v. Forsyth, 472 U.S. 511 (1985). In Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010), this Court held that officers must have individualized probable cause. The Restatement (Second) of Torts § 119 provides the standard.`;

const REC_DIR = './recordings';

(async () => {
    console.log('--- Word Online Automation (v12: Semantic Role Mode) ---');
    if (!fs.existsSync(REC_DIR)) fs.mkdirSync(REC_DIR);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        recordVideo: { dir: REC_DIR, size: { width: 1440, height: 900 } },
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        console.log('1. Login sequence...');
        await page.goto('https://login.live.com/');
        
        // Email
        await page.getByRole('textbox', { name: /email|phone|skype/i }).fill(MS_EMAIL);
        await page.getByRole('button', { name: /next/i }).click();
        await page.waitForTimeout(3000);
        
        // Handle "Use your password" instead of code
        const usePwd = page.getByText(/use your password/i);
        if (await usePwd.isVisible({ timeout: 5000 }).catch(() => false)) {
            await usePwd.click();
            await page.waitForTimeout(2000);
        }
        
        // Password
        await page.getByRole('textbox', { name: /password/i }).fill(MS_PASS);
        await page.getByRole('button', { name: /sign in/i }).click();
        
        // Stay signed in
        const stayBtn = page.getByRole('button', { name: /yes/i });
        if (await stayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await stayBtn.click({ noWaitAfter: true });
            await page.waitForTimeout(5000);
        }

        console.log('2. Opening Document...');
        await page.goto('https://word.cloud.microsoft/new');
        await page.waitForTimeout(30000); 

        console.log('3. Typing Content...');
        // Click document canvas
        await page.mouse.click(720, 500);
        await page.keyboard.type(BRIEF_TEXT, { delay: 2 });
        
        console.log('4. Waiting for Document to Settle...');
        await page.waitForSelector(':has-text("Saved")', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(3000);

        console.log('5. Clicking Insert > Add-ins...');
        await page.getByRole('tab', { name: /insert/i }).click();
        await page.waitForTimeout(1500);
        await page.getByRole('button', { name: /add-ins/i }).click();
        
        console.log('6. Sideloading via Modal...');
        await page.waitForTimeout(8000);
        
        let sideloaded = false;
        for (const frame of page.frames()) {
            try {
                const myAddins = frame.getByText(/my add-ins/i);
                if (await myAddins.isVisible({ timeout: 2000 })) {
                    await myAddins.click();
                    const upload = frame.getByText(/upload my add-in/i);
                    if (await upload.isVisible({ timeout: 2000 })) {
                        await upload.click();
                        await frame.locator('input[type="file"]').setInputFiles('./dist/manifest.xml');
                        await frame.getByRole('button', { name: /upload/i }).click();
                        sideloaded = true;
                        break;
                    }
                }
            } catch {}
        }

        console.log('7. Finalizing TOA...');
        await page.waitForTimeout(10000);
        for (const frame of page.frames()) {
            const scan = frame.locator('#scanButton');
            if (await scan.isVisible({ timeout: 2000 }).catch(() => false)) {
                await scan.click();
                await page.waitForTimeout(3000);
                await frame.locator('#generateButton').click();
                console.log('SUCCESS: TOA generated in Word Online.');
                break;
            }
        }

        await page.screenshot({ path: path.join(REC_DIR, 'v12-final.png') });

    } catch (err: any) {
        console.error('FAILED:', err.message);
        await page.screenshot({ path: path.join(REC_DIR, 'v12-error.png') }).catch(() => {});
    }

    await context.close();
    await browser.close();
    
    const vids = fs.readdirSync(REC_DIR).filter(f => f.endsWith('.webm'));
    if (vids.length > 0) {
        fs.renameSync(path.join(REC_DIR, vids[0]), path.join(REC_DIR, 'word-online-v12.webm'));
    }
})();
