const fs = require('fs');

// Patch index.html
let codeIndex = fs.readFileSync('erp/index.html', 'utf8');
codeIndex = codeIndex.replace('<script src="pricing2.js"></script>', '<script src="pricing2.js"></script>\n<script src="pricing_reference.js"></script>');

let navRegex = /<div class="nav-item" data-page="pricing2">\s*<span class="nav-icon">.*?<\/span>\s*<span class="nav-text">محرك التسعير 2<\/span>\s*<\/div>/g;
codeIndex = codeIndex.replace(navRegex, match => {
  return match + '\n          ' + match.replace('pricing2', 'pricing_ref').replace('محرك التسعير 2', 'التسعير المرجعي (القديم)');
});

codeIndex = codeIndex.replace('<div id="p-pricing2"     class="page"></div>', '<div id="p-pricing2"     class="page"></div>\n      <div id="p-pricing_ref"  class="page" style="padding:0;"></div>');
fs.writeFileSync('erp/index.html', codeIndex);


// Patch erp_app.js
let codeApp = fs.readFileSync('erp/erp_app.js', 'utf8');
codeApp = codeApp.replace(/'pricing2'/, "'pricing2','pricing_ref'");
codeApp = codeApp.replace(/pricing2: 'محرك التسعير 2',/, "pricing2: 'محرك التسعير 2', pricing_ref: 'التسعير المرجعي (القديم)',");
codeApp = codeApp.replace(/pricing2:\s*\(\) => Pricing2\.render\(\),/, "pricing2: () => Pricing2.render(),\n      pricing_ref: () => window.LegacyPricing.renderEngine(),");
fs.writeFileSync('erp/erp_app.js', codeApp);

console.log('Patched index and erp_app for pricing_ref');
