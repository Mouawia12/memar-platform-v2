const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Step 1: Find and replace the broken inline advanced filters ternary
// Replace: ${this._showAdvanced ? '<div ... : ''}
const showAdvIdx = code.indexOf("${this._showAdvanced ?");
if (showAdvIdx === -1) { console.log('ERROR: _showAdvanced not found'); process.exit(1); }
console.log('Found _showAdvanced at index', showAdvIdx);

// Find end of this expression: ends with : ''}
// Search for the pattern "' : ''}" after this index
let searchFrom = showAdvIdx + 20;
let endIdx = -1;
// The ternary ends with  : ''}\n  (or something)
// Find next occurrence of ": ''}" after the showAdvanced
for (let i = searchFrom; i < code.length - 10; i++) {
  if (code.substring(i, i+6) === "' : ''") {
    endIdx = i + 7; // includes the }
    break;
  }
}
if (endIdx === -1) { console.log('ERROR: cannot find end of first ternary'); process.exit(1); }
console.log('End of advanced ternary at index', endIdx);

// Replace the entire block
code = code.substring(0, showAdvIdx) + "${this._showAdvanced ? this.rAdvFilters() : ''}" + code.substring(endIdx);

// Step 2: Now find and replace the broken chips ternary
const chipsIdx = code.indexOf("${this.hasActiveFilters() ? '<div");
if (chipsIdx > -1) {
  let chipsEnd = -1;
  for (let i = chipsIdx + 20; i < code.length - 10; i++) {
    if (code.substring(i, i+6) === "' : ''") {
      chipsEnd = i + 7;
      break;
    }
  }
  if (chipsEnd > -1) {
    code = code.substring(0, chipsIdx) + "${this.hasActiveFilters() ? this.rActiveChips(total, allPrj.length) : ''}" + code.substring(chipsEnd);
    console.log('Replaced chips ternary');
  }
} else {
  console.log('chips ternary not found (may already be fixed)');
}

// Step 3: Add rAdvFilters() and rActiveChips() methods
// Insert before mProj method
const mProjMarker = "  mProj(preCId=null,editId=null) {";
const mProjIdx = code.indexOf(mProjMarker);
if (mProjIdx === -1) { console.log('ERROR: mProj not found'); process.exit(1); }

const newMethods = `  rAdvFilters() {
    const emps = this.users().filter(u=>['arch_eng','struct_eng','drafter'].includes(u.role));
    const empOpts = emps.map(e => '<option value="'+e.id+'" '+(this._filterEng===e.id?'selected':'')+'>'+e.name+'</option>').join('');
    const yearOpts = ['2026','2025','2024','2023'].map(y => '<option value="'+y+'" '+(this._filterYear===y?'selected':'')+'>'+y+'</option>').join('');
    const progOpts = [['0','لم يبدأ (0%)'],['1-50','1% — 50%'],['51-99','51% — 99%'],['100','مكتمل (100%)']].map(([v,l]) => '<option value="'+v+'" '+(this._filterProg===v?'selected':'')+'>'+l+'</option>').join('');
    const payOpts = [['unpaid','غير مدفوع'],['partial','مدفوع جزئياً'],['paid','مدفوع بالكامل'],['overdue','متأخر']].map(([v,l]) => '<option value="'+v+'" '+(this._filterPay===v?'selected':'')+'>'+l+'</option>').join('');
    let savedHTML = '';
    if(this._savedFilters.length) {
      savedHTML = '<div style="border-right:1px solid var(--border);height:20px;margin:0 4px"></div>' +
        '<span style="font-size:11px;color:var(--text-3);font-weight:600">محفوظة:</span>' +
        '<div class="prj-saved-list">' +
        this._savedFilters.map((f,i) => '<span class="prj-saved-pill" onclick="Projects.loadSavedFilter('+i+')">'+f.name+' <span class="x" onclick="event.stopPropagation();Projects.deleteSavedFilter('+i+')">x</span></span>').join('') +
        '</div>';
    }
    return '<div class="prj-adv-filters">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div style="font-size:13px;font-weight:800;color:var(--text)">فلاتر متقدمة</div>' +
        '<button class="btn btn-xs btn-ghost" onclick="Projects._showAdvanced=false;Projects.render()">اغلاق</button>' +
      '</div>' +
      '<div class="prj-adv-grid">' +
        '<div><label class="prj-adv-label">المهندس المسؤول</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterEng=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+empOpts+'</select></div>' +
        '<div><label class="prj-adv-label">السنة</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterYear=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+yearOpts+'</select></div>' +
        '<div><label class="prj-adv-label">نسبة الإنجاز</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterProg=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+progOpts+'</select></div>' +
        '<div><label class="prj-adv-label">حالة الدفع</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterPay=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+payOpts+'</select></div>' +
      '</div>' +
      '<div class="prj-adv-actions">' +
        '<button class="btn btn-xs btn-outline" onclick="Projects.saveCurrentFilter()" style="gap:4px">حفظ الفلتر</button>' +
        '<button class="btn btn-xs btn-ghost" onclick="Projects.resetFilters()" style="color:var(--danger)">اعادة تعيين</button>' +
        savedHTML +
      '</div></div>';
  },
  rActiveChips(total, allTotal) {
    let chips = [];
    if(this._search) chips.push('<span class="prj-filter-chip" onclick="Projects._search=\\'\\';Projects._page=1;Projects.render()">بحث: '+this._search+' <span class="x">x</span></span>');
    if(this._filterCat) chips.push('<span class="prj-filter-chip" onclick="Projects._filterCat=\\'\\';Projects._page=1;Projects.render()">'+this._filterCat+' <span class="x">x</span></span>');
    if(this._filterSt) chips.push('<span class="prj-filter-chip" onclick="Projects._filterSt=\\'\\';Projects._page=1;Projects.render()">'+(this.PSTAT[this._filterSt]?.l||this._filterSt)+' <span class="x">x</span></span>');
    if(this._filterEng) chips.push('<span class="prj-filter-chip" onclick="Projects._filterEng=\\'\\';Projects._page=1;Projects.render()">مهندس <span class="x">x</span></span>');
    if(this._filterYear) chips.push('<span class="prj-filter-chip" onclick="Projects._filterYear=\\'\\';Projects._page=1;Projects.render()">'+this._filterYear+' <span class="x">x</span></span>');
    if(this._filterProg) chips.push('<span class="prj-filter-chip" onclick="Projects._filterProg=\\'\\';Projects._page=1;Projects.render()">انجاز <span class="x">x</span></span>');
    if(this._filterPay) chips.push('<span class="prj-filter-chip" onclick="Projects._filterPay=\\'\\';Projects._page=1;Projects.render()">دفع <span class="x">x</span></span>');
    return '<div class="prj-results-bar"><div>'+this.getActiveFilterCount()+' فلتر نشط — '+total+' نتيجة من '+allTotal+' مشروع</div><div style="display:flex;gap:4px;flex-wrap:wrap">'+chips.join('')+'</div></div>';
  },
`;

code = code.substring(0, mProjIdx) + newMethods + code.substring(mProjIdx);

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 2 fixed - methods added');
