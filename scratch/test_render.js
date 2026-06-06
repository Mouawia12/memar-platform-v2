const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="p-pricing3"></div><div id="p-pricing2"></div></body></html>', {
  runScripts: "dangerously",
  resources: "usable"
});

dom.window.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null
};

const code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', 'utf8');

dom.window.eval(code);

dom.window.Pricing3.render();
console.log("Rendered HTML length:", dom.window.document.getElementById('p-pricing3').innerHTML.length);
if (dom.window.document.getElementById('p-pricing3').innerHTML.includes('⚠️ خطأ')) {
  console.log("Found error in HTML:", dom.window.document.getElementById('p-pricing3').innerHTML);
}
