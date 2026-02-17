import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

(async () => {
    // 1. Build the project first to ensure taskpane.html exists
    console.log('Starting browser demo...');
    
    const browser = await chromium.launch({ headless: true });
    // Record at 1280x720
    const context = await browser.newContext({
        recordVideo: {
            dir: './recordings',
            size: { width: 1280, height: 720 }
        }
    });
    
    const page = await context.newPage();
    
    // Mock Office.js
    await page.addInitScript(() => {
        (window as any).Office = {
            onReady: (callback: any) => callback({ host: 'Word', platform: 'PC' }),
            context: {
                document: {
                    getFileAsync: (type: any, options: any, callback: any) => {
                        callback({ status: 'succeeded', value: { getSliceAsync: (idx: any, cb: any) => cb({ status: 'succeeded', value: { data: 'Sample legal text with citations like Brown v. Board of Education, 347 U.S. 483 (1954).' }}) } });
                    }
                }
            }
        };
    });

    // Path to the bundled taskpane.html
    const taskpanePath = `file://${path.resolve('./dist/taskpane.html')}`;
    console.log(`Navigating to ${taskpanePath}`);
    
    await page.goto(taskpanePath);
    
    // Simulate some UI interactions
    console.log('Interacting with UI...');
    await page.waitForSelector('#scanButton');
    await page.click('#scanButton');
    
    // Force enable the button since our mock might not be triggering the UI state update correctly in a headless file environment
    await page.evaluate(() => {
        const btn = document.getElementById('generateButton') as HTMLButtonElement;
        if (btn) btn.disabled = false;
    });
    
    await page.waitForTimeout(2000);
    await page.click('#generateButton');
    
    // Wait for generation
    await page.waitForTimeout(5000);
    
    // Take a screenshot just in case
    await page.screenshot({ path: './recordings/screenshot.png' });
    
    console.log('Closing browser...');
    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();
    
    // Rename the video file
    const videoFile = fs.readdirSync('./recordings').find(f => f.endsWith('.webm'));
    if (videoFile) {
        fs.renameSync(path.join('./recordings', videoFile), './recordings/demo.webm');
        console.log('Video saved to recordings/demo.webm');
    }
})();
