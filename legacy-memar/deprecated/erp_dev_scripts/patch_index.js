const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Script tag
code = code.replace('<script src="pricing.js"></script>', '<script src="pricing.js"></script>\n  <script src="pricing2.js"></script>');

// Nav item
let navRegex = /<div class="nav-item" data-page="pricing">\s*<span class="nav-icon">.*?<\/span>\s*<span class="nav-text">محرك التسعير<\/span>\s*<\/div>/g;
code = code.replace(navRegex, match => {
  return match.replace('محرك التسعير', 'محرك التسعير 1') + '\n          ' + match.replace('pricing', 'pricing2').replace('محرك التسعير', 'محرك التسعير 2');
});

// Container
code = code.replace('<div id="p-pricing"      class="page"></div>', '<div id="p-pricing"      class="page"></div>\n      <div id="p-pricing2"     class="page"></div>');

fs.writeFileSync('index.html', code);
console.log('Updated index.html');
