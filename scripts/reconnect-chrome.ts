import { chromium } from 'playwright';

(async () => {
    // Connect to the existing Chrome instance
    const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
    const contexts = browser.contexts();
    console.log(`Connected! ${contexts.length} contexts`);
    
    const pages = contexts[0]?.pages() || [];
    console.log(`${pages.length} pages`);
    
    let loginPage = pages.find(p => p.url().includes('login.live'));
    if (loginPage) {
        console.log('Found login page:', loginPage.url().substring(0, 60));
        
        // Click Yes on "Stay signed in"
        const yesBtn = loginPage.locator('button:has-text("Yes")').first();
        if (await yesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Clicking Yes...');
            await yesBtn.click({ noWaitAfter: true });
            await loginPage.waitForTimeout(5000);
        } else {
            console.log('No Yes button visible, navigating directly...');
        }
        
        // Navigate to Word Online
        console.log('Navigating to Word Online...');
        await loginPage.goto('https://word.cloud.microsoft/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Waiting 30s for editor...');
        await loginPage.waitForTimeout(30000);
        console.log('Current URL:', loginPage.url().substring(0, 80));
        await loginPage.screenshot({ path: './recordings/v12-word-loaded.png' });
        
        // Type the brief
        console.log('Typing brief...');
        await loginPage.mouse.click(720, 500);
        await loginPage.keyboard.type(`JURISDICTIONAL STATEMENT
This Court has jurisdiction over this appeal pursuant to 28 U.S.C. § 1292. Illinois v. Gates, 462 U.S. 213, 232 (1983). Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009). Fed. R. Civ. P. 12(b)(6). Maryland v. Pringle, 540 U.S. 366, 371 (2003). U.S. Const. amend. IV. Morin v. Caire, 77 F.3d 116, 120 (5th Cir. 1996). Papasan v. Allain, 478 U.S. 265, 286 (1986). Mitchell v. Forsyth, 472 U.S. 511 (1985). Gentilello v. Rege, 623 F.3d 540, 544 (5th Cir. 2010). Restatement (Second) of Torts § 119.`, { delay: 5 });
        
        console.log('Waiting for save...');
        await loginPage.waitForTimeout(5000);
        await loginPage.screenshot({ path: './recordings/v12-text-typed.png' });
        
        // Now try clicking Insert tab
        console.log('Attempting Insert tab...');
        // Dump accessibility tree first
        const snapshot = await loginPage.accessibility.snapshot();
        console.log('Accessibility tree root children:', JSON.stringify(snapshot?.children?.map(c => c.name + ':' + c.role).slice(0, 20)));
        
        await loginPage.screenshot({ path: './recordings/v12-before-insert.png' });
    }
    
    await browser.close();
})();
