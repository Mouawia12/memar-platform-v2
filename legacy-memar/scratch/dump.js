const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="p-pricing3"></div></body></html>', { runScripts: 'dangerously' });
dom.window.localStorage = { getItem: () => null, setItem: () => null };
dom.window.eval(fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', 'utf8'));
dom.window.Pricing3.render();
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/scratch/dump.html', dom.serialize());
