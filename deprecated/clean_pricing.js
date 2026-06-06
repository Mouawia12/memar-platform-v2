const fs = require('fs');
let c = fs.readFileSync('erp/erp_app.js', 'utf8');

c = c.replace(/pricing: 'محرك التسعير 1', pricing2: 'محرك التسعير 2', pricing3: 'محرك التسعير 3', pricing_ref: 'التسعير المرجعي \(القديم\)',/, "pricing3: 'محرك التسعير',");

c = c.replace(/pricing:\s*\(\)\s*=>\s*Pricing\.render\(\),\s*pricing2:\s*\(\)\s*=>\s*Pricing2\.render\(\),\s*/g, '');
c = c.replace(/pricing_ref:\s*\(\)\s*=>\s*window\.LegacyPricing\.renderEngine\(\),/g, '');

fs.writeFileSync('erp/erp_app.js', c);
console.log('Cleaned erp_app.js routing for pricing.');
