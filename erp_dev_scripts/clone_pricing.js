const fs = require('fs');
let code = fs.readFileSync('pricing.js', 'utf8');

// Replace identifiers
code = code.replace(/PricingDB/g, 'PricingDB2');
code = code.replace(/PricingState/g, 'PricingState2');
code = code.replace(/PriceCalc/g, 'PriceCalc2');

// Careful with 'Pricing.' vs 'Pricing2.'
// Pricing is used a lot.
code = code.replace(/Pricing\./g, 'Pricing2.');
// Also replace function references in HTML strings
code = code.replace(/Pricing2\.render/g, 'Pricing2.render');

// Fix the object definition
code = code.replace(/const Pricing = {/g, 'const Pricing2 = {');

// Fix LocalStorage keys
code = code.replace(/memar_pricing_db/g, 'memar_pricing2_db');
code = code.replace(/memar_pricing_admin/g, 'memar_pricing2_admin');

// Fix DOM target
code = code.replace(/getElementById\('p-pricing'\)/g, "getElementById('p-pricing2')");

// Final lines
code = code.replace(/window\.Pricing2 = Pricing2;/, 'window.Pricing2 = Pricing2;');
code = code.replace(/window\.Pricing = Pricing;/, 'window.Pricing2 = Pricing2;');

fs.writeFileSync('pricing2.js', code);
console.log('Successfully cloned pricing.js to pricing2.js');
