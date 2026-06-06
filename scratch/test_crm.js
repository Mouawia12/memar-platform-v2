const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:4000/erp', { waitUntil: 'networkidle0' });
  
  console.log('Clicking CRM tab...');
  await page.evaluate(() => {
    const crmTab = document.querySelector('[data-page="crm"]');
    if (crmTab) crmTab.click();
    else console.log('CRM tab not found');
  });

  await new Promise(r => setTimeout(r, 2000));
  
  const crmHTML = await page.evaluate(() => {
    const pCrm = document.getElementById('p-crm');
    return pCrm ? pCrm.innerHTML.substring(0, 500) : 'p-crm not found';
  });
  
  console.log('CRM Container HTML snippet:', crmHTML);
  
  await browser.close();
})();
