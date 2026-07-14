const fs = require('fs');
let c = fs.readFileSync('erp/pricing3.js', 'utf8');

let fixes = 0;

const replacements = [
  'renderNewHeader() {',
  'renderNewTabs() {',
  'renderNewCategories() {',
  'renderNewContent() {',
  'openQuotationCreator() {',
  'closeQuotationCreator() {',
  'openQuotationCreatorOld() {',
  'bindEvents() {'
];

replacements.forEach(rep => {
  const regex = new RegExp('\\\\s+\\\\}\\\\s+' + rep.replace('() {', '\\\\(\\\\) \\\\{'));
  if (regex.test(c)) {
    c = c.replace(regex, '\\n  },\\n\\n  ' + rep);
    fixes++;
  }
});

fs.writeFileSync('erp/pricing3.js', c, 'utf8');
console.log('Fixed ' + fixes + ' methods');
