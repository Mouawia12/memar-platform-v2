const fs = require('fs');
let code = fs.readFileSync('erp_app.js', 'utf8');

// Valid pages array
code = code.replace(/'pricing'/, "'pricing','pricing2'");

// Titles mapping
code = code.replace(/pricing:\s*'محرك التسعير',/, "pricing: 'محرك التسعير 1', pricing2: 'محرك التسعير 2',");

// Renders mapping
code = code.replace(/pricing:\s*\(\) => Pricing\.render\(\),/, "pricing: () => Pricing.render(),\n      pricing2: () => Pricing2.render(),");

fs.writeFileSync('erp_app.js', code);
console.log('Updated erp_app.js');
