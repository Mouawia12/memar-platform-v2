const fs = require('fs');
let c = fs.readFileSync('erp/pricing3.js', 'utf8');

const t = `  openQuotationCreator() {
    PricingState3.isQuotationMode = true;
    Pricing3.render();
  }

  closeQuotationCreator() {
    PricingState3.isQuotationMode = false;
    Pricing3.render();
  }

  openQuotationCreatorOld() {`;

const r = `  openQuotationCreator() {
    PricingState3.isQuotationMode = true;
    Pricing3.render();
  },

  closeQuotationCreator() {
    PricingState3.isQuotationMode = false;
    Pricing3.render();
  },

  openQuotationCreatorOld() {`;

const t_win = t.replace(/\\n/g, '\\r\\n');
const r_win = r.replace(/\\n/g, '\\r\\n');

if (c.includes(t)) {
  c = c.replace(t, r);
  fs.writeFileSync('erp/pricing3.js', c, 'utf8');
  console.log('SUCCESS');
} else if (c.includes(t_win)) {
  c = c.replace(t_win, r_win);
  fs.writeFileSync('erp/pricing3.js', c, 'utf8');
  console.log('SUCCESS');
} else {
  // Let's use regex
  let newC = c.replace(/openQuotationCreator\(\) \{\s+PricingState3.isQuotationMode = true;\s+Pricing3.render\(\);\s+\}\s+closeQuotationCreator\(\) \{\s+PricingState3.isQuotationMode = false;\s+Pricing3.render\(\);\s+\}\s+openQuotationCreatorOld\(\) \{/, r);
  if (newC !== c) {
    fs.writeFileSync('erp/pricing3.js', newC, 'utf8');
    console.log('SUCCESS REGEX');
  } else {
    console.log('NOT FOUND');
  }
}
