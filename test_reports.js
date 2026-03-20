const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    try {
        await page.goto('http://localhost:5173/login');
        await page.fill('input[type="email"]', 'saderi.danilo@gmail.com');
        await page.fill('input[type="password"]', 'supremo2323');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        console.log('Navigating to reports...');
        await page.goto('http://localhost:5173/relatorios');
        await page.waitForTimeout(3000);
        
        console.log('Page title:', await page.title());
    } catch (err) {
        console.error('TEST ERROR:', err);
    } finally {
        await browser.close();
    }
})();
