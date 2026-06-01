const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
  
  await page.goto('file:///c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();
