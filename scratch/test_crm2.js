const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  await page.goto('http://localhost:4000/erp', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const crmTab = document.querySelector('[data-page="crm"]');
    if (crmTab) crmTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
    if (typeof mLead === 'function') {
      mLead();
      console.log('Opened new lead modal.');
    } else {
      console.log('mLead function not found.');
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  
  const modalHTML = await page.evaluate(() => {
    const modal = document.getElementById('modal-body');
    return modal ? modal.innerHTML.substring(0, 200) : 'No modal body';
  });
  console.log('Modal HTML:', modalHTML);

  await browser.close();
})();
