import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://login.live.com/');
    await page.waitForTimeout(5000);
    console.log('Page Title:', await page.title());
    console.log('Page URL:', page.url());
    const inputs = await page.locator('input').all();
    console.log('Inputs found:', inputs.length);
    for (const input of inputs) {
        console.log(' - Name:', await input.getAttribute('name'), 'Type:', await input.getAttribute('type'), 'Id:', await input.getAttribute('id'));
    }
    await page.screenshot({ path: 'debug-login.png' });
    await browser.close();
})();
