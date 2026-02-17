import { chromium } from 'playwright';

const MS_EMAIL = 'jarvis.nova722@gmail.com';
const MS_PASS = 'QN6cZCRnRsPBMHEpyeGreyVINa';

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // Login
    await page.goto('https://login.live.com/');
    await page.locator('input[type="email"], #usernameEntry').first().fill(MS_EMAIL);
    await page.locator('button:has-text("Next"), input[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    const usePwd = page.getByText('Use your password');
    if (await usePwd.isVisible({ timeout: 5000 }).catch(() => false)) { await usePwd.click(); await page.waitForTimeout(3000); }
    await page.locator('input[type="password"], #passwordEntry').first().fill(MS_PASS);
    await page.locator('button:has-text("Next"), button:has-text("Sign in"), input[type="submit"]').first().click();
    await page.waitForTimeout(5000);
    try {
        const stayBtn = page.locator('button:has-text("Yes")').first();
        if (await stayBtn.isVisible({ timeout: 5000 })) { await stayBtn.click({ noWaitAfter: true }); await page.waitForTimeout(10000); }
    } catch {}

    // Go to Word
    await page.goto('https://word.cloud.microsoft/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(30000);

    // Debug frame structure
    const frames = page.frames();
    console.log(`\n=== FRAME ANALYSIS: ${frames.length} frames ===`);
    for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        console.log(`\n--- Frame ${i}: name="${f.name()}" url="${f.url().substring(0, 80)}..." ---`);
        
        const tabs = await f.locator('[role="tab"]').all();
        if (tabs.length > 0) {
            console.log(`  [role="tab"] count: ${tabs.length}`);
            for (const t of tabs) { console.log(`    tab: "${(await t.textContent())?.trim()}"`); }
        }
        
        const buttons = await f.locator('button').all();
        if (buttons.length > 0) {
            console.log(`  button count: ${buttons.length}`);
            for (const b of buttons.slice(0, 20)) {
                const txt = (await b.textContent())?.trim();
                const label = await b.getAttribute('aria-label');
                if (txt || label) console.log(`    btn: text="${txt?.substring(0, 40)}" aria="${label}"`);
            }
        }
        
        // Check for "Insert" text
        const insertEls = await f.locator('text=Insert').all();
        if (insertEls.length > 0) console.log(`  "Insert" text found ${insertEls.length} times`);
        
        const addinsEls = await f.locator('text=Add-ins').all();
        if (addinsEls.length > 0) console.log(`  "Add-ins" text found ${addinsEls.length} times`);
    }

    await browser.close();
})();
