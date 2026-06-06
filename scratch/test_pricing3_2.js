const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="p-pricing3"></div>');
dom.window.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null
};
const code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', 'utf8');
try {
  dom.window.eval(code + '; Pricing3.render();');
  console.log('Inner HTML length:', dom.window.document.getElementById('p-pricing3').innerHTML.length);
} catch (e) {
  console.error('Error:', e);
}
