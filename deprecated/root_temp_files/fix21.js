const fs = require('fs');
let c = fs.readFileSync('erp/pricing3.js', 'utf8');

c = c.replace(/  \}\\r?\\n\\r?\\n  renderNewHeader\(\) \{/, "  },\\n\\n  renderNewHeader() {");
c = c.replace(/  \}\\r?\\n\\r?\\n  renderNewTabs\(\) \{/, "  },\\n\\n  renderNewTabs() {");
c = c.replace(/  \}\\r?\\n\\r?\\n  renderNewCategories\(\) \{/, "  },\\n\\n  renderNewCategories() {");
c = c.replace(/  \}\\r?\\n\\r?\\n  renderNewContent\(\) \{/, "  },\\n\\n  renderNewContent() {");
c = c.replace(/  \}\\r?\\n\\r?\\n  openQuotationCreator\(\) \{/, "  },\\n\\n  openQuotationCreator() {");
c = c.replace(/  \}\\r?\\n\\r?\\n  bindEvents\(\) \{/, "  },\\n\\n  bindEvents() {");

fs.writeFileSync('erp/pricing3.js', c, 'utf8');
console.log('Fixed missing commas');
