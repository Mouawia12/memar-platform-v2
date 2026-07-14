const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Add missing state vars
const oldVars = "  _filterCat: '',\r\n  _filterSt: '',\r\n";
const newVars = "  _filterCat: '',\r\n  _filterSt: '',\r\n  _filterEng: '',\r\n  _filterYear: '',\r\n  _filterProg: '',\r\n  _filterPay: '',\r\n  _showAdvanced: false,\r\n  _savedFilters: JSON.parse(localStorage.getItem('prj_saved_filters') || '[]'),\r\n";

if (code.includes(oldVars)) {
  code = code.replace(oldVars, newVars);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ State vars added');
} else {
  console.log('Could not find old vars pattern. Searching...');
  const idx = code.indexOf("_filterSt: ''");
  console.log('_filterSt at index:', idx);
  if (idx > -1) {
    // Get line ending
    const lineEnd = code.indexOf('\n', idx);
    code = code.substring(0, lineEnd+1) + 
      "  _filterEng: '',\n  _filterYear: '',\n  _filterProg: '',\n  _filterPay: '',\n  _showAdvanced: false,\n  _savedFilters: JSON.parse(localStorage.getItem('prj_saved_filters') || '[]'),\n" +
      code.substring(lineEnd+1);
    fs.writeFileSync('erp/erp_app.js', code);
    console.log('✅ State vars added (fallback)');
  }
}
