const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting puppeteer...');
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR LOG:', msg.text());
            }
        });

        page.on('pageerror', err => {
            console.log('PAGE EXCEPTION:', err.toString());
        });

        console.log('Navigating to http://localhost:5175/login');
        await page.goto('http://localhost:5175/login', { waitUntil: 'networkidle0' });

        console.log('Clearing local storage...');
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle0' });

        console.log('Typing credentials...');
        await page.waitForSelector('input[type="text"]');
        await page.type('input[type="text"]', 'sadmin');
        await page.type('input[type="password"]', '1');

        console.log('Clicking login...');
        await page.click('button[type="submit"]');

        console.log('Waiting for navigation...');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Navigation wait timeout (expected if SPA redirect)'));

        // Wait a bit more to see if any errors pop up
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Done capturing logs.');
        await browser.close();
    } catch (error) {
        console.error('Script failed:', error);
    }
})();
