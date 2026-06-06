const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  const fileUrl = 'file:///' + path.resolve('./erp/index.html').replace(/\\/g, '/');
  console.log('Navigating to', fileUrl);
  
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  console.log('Evaluating...');
  const erpType = await page.evaluate(() => typeof ERP);
  console.log('typeof ERP:', erpType);
  
  const title = await page.evaluate(() => document.getElementById('page-title')?.textContent);
  console.log('Title before click:', title);

  // Click on hr
  await page.evaluate(() => {
    const el = document.querySelector('[data-page="hr"]');
    if(el) el.click();
  });
  
  // wait a bit
  await new Promise(r => setTimeout(r, 1000));
  
  const titleAfter = await page.evaluate(() => document.getElementById('page-title')?.textContent);
  console.log('Title after click:', titleAfter);
  
  const hrHTML = await page.evaluate(() => document.getElementById('p-hr')?.innerHTML.length);
  console.log('p-hr innerHTML length:', hrHTML);
  
  const hrActive = await page.evaluate(() => document.getElementById('p-hr')?.classList.contains('active'));
  console.log('p-hr active?', hrActive);

  await page.screenshot({ path: 'test_screenshot.png' });
  console.log('Screenshot saved to test_screenshot.png');
  
  await browser.close();
})();
