const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Add missing methods before rAdvFilters
const marker = "  rAdvFilters() {";
const idx = code.indexOf(marker);
if (idx === -1) { console.log('ERROR: rAdvFilters not found'); process.exit(1); }

const missingMethods = `  resetFilters() {
    this._search=''; this._filterCat=''; this._filterSt='';
    this._filterEng=''; this._filterYear=''; this._filterProg=''; this._filterPay='';
    this._page=1; this.render();
  },
  hasActiveFilters() {
    return !!(this._search || this._filterCat || this._filterSt || this._filterEng || this._filterYear || this._filterProg || this._filterPay);
  },
  getActiveFilterCount() {
    let c=0;
    if(this._search) c++; if(this._filterCat) c++; if(this._filterSt) c++;
    if(this._filterEng) c++; if(this._filterYear) c++; if(this._filterProg) c++; if(this._filterPay) c++;
    return c;
  },
  saveCurrentFilter(name) {
    if(!name) { name = prompt('اسم الفلتر المحفوظ:'); if(!name) return; }
    const f = { name, search:this._search, cat:this._filterCat, st:this._filterSt, eng:this._filterEng, year:this._filterYear, prog:this._filterProg, pay:this._filterPay, ts:Date.now() };
    this._savedFilters.push(f);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    if(typeof toast!=='undefined') toast('تم حفظ الفلتر: '+name);
    this.render();
  },
  loadSavedFilter(idx) {
    const f = this._savedFilters[idx]; if(!f) return;
    this._search=f.search||''; this._filterCat=f.cat||''; this._filterSt=f.st||'';
    this._filterEng=f.eng||''; this._filterYear=f.year||''; this._filterProg=f.prog||''; this._filterPay=f.pay||'';
    this._page=1; this.render();
  },
  deleteSavedFilter(idx) {
    this._savedFilters.splice(idx,1);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    this.render();
  },
`;

// Check if resetFilters already exists as a method definition
if (code.indexOf('  resetFilters()') > -1 && code.indexOf('  resetFilters()') < idx) {
  console.log('resetFilters already exists before rAdvFilters');
} else {
  code = code.substring(0, idx) + missingMethods + code.substring(idx);
}

// Also check if _savedFilters is defined
if (code.indexOf('_savedFilters') === -1 || code.indexOf("_savedFilters: JSON") === -1) {
  // Add it with the state vars
  const showAdvIdx = code.indexOf("_showAdvanced: false,");
  if (showAdvIdx > -1) {
    const insertAt = showAdvIdx + "_showAdvanced: false,".length;
    code = code.substring(0, insertAt) + "\n  _savedFilters: JSON.parse(localStorage.getItem('prj_saved_filters') || '[]')," + code.substring(insertAt);
    console.log('Added _savedFilters');
  }
}

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Missing methods added');
