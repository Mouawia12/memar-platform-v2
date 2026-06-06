const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./erp/index.html', 'utf8');

const url = 'file:///' + path.resolve('./erp/index.html').replace(/\\/g, '/');

const dom = new JSDOM(html, {
  url: url,
  runScripts: 'dangerously',
  resources: 'usable'
});

// Mock everything ERP.init() needs so it doesn't throw
dom.window.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
  clear: () => null
};

// Start a timer
setTimeout(() => {
  const topbarBtn = dom.window.document.getElementById('topbar-user-btn');
  console.log('Topbar Button HTML:', topbarBtn ? topbarBtn.innerHTML : 'NOT FOUND');
  
  const title = dom.window.document.getElementById('page-title');
  console.log('Page Title:', title ? title.textContent : 'NOT FOUND');

  const hrPage = dom.window.document.getElementById('p-hr');
  console.log('HR Page active?', hrPage ? hrPage.classList.contains('active') : false);

  process.exit(0);
}, 3000);
