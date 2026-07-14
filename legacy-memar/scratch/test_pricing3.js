const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="p-pricing3"></div>');
global.document = dom.window.document;
global.window = dom.window;
global.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null
};
const code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', 'utf8');
try {
  const script = new dom.window.window.eval(code + '; window.Pricing3 = Pricing3;');
  dom.window.Pricing3.render();
  console.log('Inner HTML length:', document.getElementById('p-pricing3').innerHTML.length);
} catch (e) {
  console.error('Error:', e);
}
