const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8').split('\n');

const brokenErp = lines.findIndex(l => l.includes('<script src="erp.js?v=20260416c"></script>'));
if (brokenErp !== -1) {
    lines[brokenErp] = '<script src="erp.js?v=' + Date.now() + '"></script>';
} else {
    // If we missed it, try another one
    const simpleErp = lines.findIndex(l => l.includes('<script src="erp.js"></script>'));
    if (simpleErp !== -1) {
        lines[simpleErp] = '<script src="erp.js?v=' + Date.now() + '"></script>';
    }
}

const brokenPricing = lines.findIndex(l => l.includes('<script src="erp.js?v=2"></script>'));
if (brokenPricing !== -1) {
    lines[brokenPricing] = '<script src="pricing.js"></script>';
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', lines.join('\n'));
console.log('Fixed index.html!');
