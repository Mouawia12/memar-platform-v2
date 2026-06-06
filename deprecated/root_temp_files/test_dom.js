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

dom.window.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
  clear: () => null
};

dom.window.console.log = function(...args) {
  console.log('[LOG]', ...args);
};
dom.window.console.error = function(...args) {
  console.log('[ERROR]', ...args);
};

dom.window.addEventListener('error', (event) => {
  console.log('[UNCAUGHT ERROR]', event.error.message, event.error.stack);
});

console.log('JSDOM loaded via', url, '- waiting for scripts to execute...');

setTimeout(() => {
  console.log('Done waiting.');
  process.exit(0);
}, 2000);
