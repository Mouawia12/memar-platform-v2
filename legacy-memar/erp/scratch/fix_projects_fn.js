const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// The issue: DATA.projects items (P1-P6) have different property names:
// DATA.projects uses: { name, client, type, status, location, stages }
// Local projects use: { cNm, svc, cat, status, loc, steps }
// The projects() function syncs them but uses the wrong statusMap
// AND the items that already exist in localStorage still have the old structure

// Fix: in projects(), when syncing from globalPrj, also check for items
// that might already be in localStorage but have missing fields

const oldProjectsFn = `  projects() { 
    let localPrj = JSON.parse(localStorage.getItem('memar_projects') || '[ ]');
    let globalPrj = window.DB_TABLES?.projects || window.DATA?.projects || [];
    let changed = false;
    
    globalPrj.forEach(gp => {
      let exists = localPrj.find(lp => lp.id == gp.id || (lp.svc === gp.name && lp.cId == gp.client_id));
      if (!exists) {
        let statusMap = { 'active': 'active', 'pending': 'pending', 'completed': 'done', 'on_hold': 'hold', 'cancelled': 'cancelled', 'inquiry': 'review' };
        localPrj.push({
          id: gp.id || this.nid(localPrj),
          cId: gp.client_id || 1,
          cNm: gp.client || gp.client_name || 'عميل مسجل',
          cat: gp.type || 'سكني',
          svc: gp.name || gp.name_ar || 'مشروع جديد',
          status: statusMap[gp.status] || 'pending',
          emp: gp.manager ? [gp.manager] : [],
          cost: 0, paid: 0,
          sDate: gp.start || gp.start_date || new Date().toISOString().split('T')[0],
          eDate: gp.end || gp.end_date || '',
          loc: gp.location || gp.location_ar || '',
          notes: 'تمت المزامنة تلقائياً من المنصة',
          cAt: new Date().toISOString().split('T')[0],
          docs: [],
          steps: (gp.stages || []).map(st => ({ t: st.n, ok: st.s === 'done', dt: null }))
        });
        changed = true;
      }
    });

    if (changed) this.saveProjects(localPrj);
    return localPrj; 
  },`;

const newProjectsFn = `  projects() { 
    let localPrj = JSON.parse(localStorage.getItem('memar_projects') || '[]');
    let globalPrj = window.DB_TABLES?.projects || window.DATA?.projects || [];
    let changed = false;
    const statusMap = { 'active': 'active', 'pending': 'pending', 'completed': 'done', 'on_hold': 'hold', 'cancelled': 'cancelled', 'inquiry': 'review' };
    
    globalPrj.forEach(gp => {
      let exists = localPrj.find(lp => lp.id == gp.id || (lp.svc === gp.name && lp.cId == gp.client_id));
      if (!exists) {
        localPrj.push({
          id: gp.id || this.nid(localPrj),
          cId: gp.client_id || gp.client || 1,
          cNm: gp.client || gp.client_name || 'عميل مسجل',
          cat: gp.type || 'سكني',
          svc: gp.name || gp.name_ar || 'مشروع جديد',
          status: statusMap[gp.status] || gp.status || 'pending',
          emp: gp.manager ? [gp.manager] : [],
          cost: 0, paid: 0,
          sDate: gp.start || gp.start_date || new Date().toISOString().split('T')[0],
          eDate: gp.end || gp.end_date || '',
          loc: gp.location || gp.location_ar || '',
          notes: 'تمت المزامنة تلقائياً من المنصة',
          cAt: gp.start || new Date().toISOString().split('T')[0],
          docs: [],
          steps: (gp.stages || []).map(st => ({ t: st.n, ok: st.s === 'done', dt: null }))
        });
        changed = true;
      } else {
        // Fix items that have undefined fields
        if (!exists.cNm || exists.cNm === 'undefined') {
          exists.cNm = gp.client || gp.client_name || 'عميل مسجل';
          exists.cat = exists.cat && exists.cat !== 'undefined' ? exists.cat : (gp.type || 'سكني');
          exists.svc = exists.svc && exists.svc !== 'undefined' ? exists.svc : (gp.name || gp.name_ar || 'مشروع جديد');
          exists.loc = exists.loc || gp.location || '';
          exists.cAt = exists.cAt || gp.start || new Date().toISOString().split('T')[0];
          if (!exists.steps || !exists.steps.length) {
            exists.steps = (gp.stages || []).map(st => ({ t: st.n, ok: st.s === 'done', dt: null }));
          }
          // Fix old CSS status codes
          const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
          if (cssToKey[exists.status]) exists.status = cssToKey[exists.status];
          changed = true;
        }
      }
    });

    if (changed) this.saveProjects(localPrj);
    return localPrj; 
  },`;

if (code.includes(oldProjectsFn)) {
  code = code.replace(oldProjectsFn, newProjectsFn);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ projects() function fixed!');
} else {
  console.log('❌ Could not find exact projects() function. Trying line-by-line...');
  // Fallback: find and replace just the key parts
  const idx1 = code.indexOf("  projects() { \r\n    let localPrj");
  const idx2 = code.indexOf("    return localPrj; \r\n  },\r\n  saveProjects");
  if (idx1 > -1 && idx2 > -1) {
    const endIdx = idx2 + "    return localPrj; \r\n  },".length;
    code = code.substring(0, idx1) + newProjectsFn + code.substring(endIdx);
    fs.writeFileSync('erp/erp_app.js', code);
    console.log('✅ projects() function fixed (fallback method)!');
  } else {
    console.log('idx1:', idx1, 'idx2:', idx2);
    console.log('❌ Cannot find projects() boundaries');
  }
}
