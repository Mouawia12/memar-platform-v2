/**
 * Complete repair of erp_app.js
 * Replaces the broken lines 1-55 with correct code
 */

const fs = require('fs');
const code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const lines = code.split('\n');

// The structure we need:
// Line 1: const ERP = {
// Lines 2-6: getUserName
// Lines 7-9: properties
// Lines 10-35: applyRBACUI
// Lines 36-55: checkStageDelays (BROKEN)
// Line 56+: init() and rest

// Find where init() starts (should be around line 57)
let initLine = -1;
for (let i = 50; i < 70; i++) {
  if (lines[i] && lines[i].trim().startsWith('init()')) {
    initLine = i;
    break;
  }
}

console.log('init() found at line:', initLine + 1);
console.log('Line content:', lines[initLine]);

// The correct replacement for lines 0 to initLine-3 (before the comment "/* ── Init")
const correctHeader = `const ERP = {
  getUserName(id) {
    if (!id) return 'غير محدد';
    const u = (window.DB_TABLES.users || []).find(x => x.id === id);
    return u ? u.full_name : 'غير محدد';
  },
  currentPage: 'dashboard',
  charts: {},
  sortables: [],

  /* ── RBAC: Role-Based Access Control ── */
  applyRBACUI() {
    try {
      const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
      const role = u.role || DATA.user?.role || 'admin';
      const accessMap = {
        admin:      null,
        engineer:   ['dashboard','tasks','projects','appointments','crm_meetings','audit'],
        sales:      ['dashboard','crm','clients','appointments','requests'],
        accountant: ['dashboard','payroll','reports','audit'],
      };
      const allowed = accessMap[role];
      if (!allowed) return;
      document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        const pg = el.dataset.page;
        if (!allowed.includes(pg)) el.style.display = 'none';
      });
      document.querySelectorAll('.sidebar-block').forEach(block => {
        const visible = block.querySelectorAll('.nav-item[data-page]:not([style*="none"])');
        if (!visible.length) block.style.display = 'none';
      });
    } catch(e) {}
  },

  /* ── Delay Detection System ── */
  checkStageDelays() {
    try {
      let delayCount = 0;
      (DATA.projects || []).forEach(p => {
        let isChanged = false;
        (p.stages || []).forEach(s => {
          if (s.s === 'active' && s.act > s.exp) {
            s.s = 'delayed';
            isChanged = true;
            delayCount++;
          }
        });
        if (isChanged && !(DATA.notifications || []).some(n => n.title && n.title.includes(p.num))) {
          DATA.notifications = DATA.notifications || [];
          DATA.notifications.unshift({
            id: 'N' + Date.now() + Math.random(), read: false, icon: '🚨',
            bg: '#FEE2E2', title: 'تأخير في مشروع ' + p.num,
            text: 'تم رصد تأخير في أداء المرحلة، يجب التدخل فوراً.', time: 'الآن'
          });
        }
      });
      if (delayCount > 0) setTimeout(() => this.toast('النظام الذكي: تم رصد تأخير في ' + delayCount + ' مشروع', 'err'), 2000);
    } catch(e) {}
  },

`;

// Find the line with "/* ── Init" or "init() {"
let splitPoint = -1;
for (let i = 50; i < 70; i++) {
  if (lines[i] && (lines[i].includes('/* ── Init') || lines[i].trim() === 'init() {')) {
    splitPoint = i;
    break;
  }
}

if (splitPoint === -1) {
  // Try finding via content
  for (let i = 40; i < 80; i++) {
    if (lines[i] && lines[i].includes('init()') && lines[i].trim().endsWith('{')) {
      splitPoint = i;
      break;
    }
  }
}

console.log('Split point (start of init):', splitPoint + 1);
if (splitPoint !== -1) {
  console.log('Split line content:', lines[splitPoint]);
}

// Reconstruct the file
const restOfFile = lines.slice(splitPoint).join('\n');
const newCode = correctHeader + restOfFile;

// Verify syntax
try {
  new Function(newCode);
  console.log('✅ Syntax check: PASSED');
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', newCode);
  console.log('✅ File saved successfully');
  console.log('New file lines:', newCode.split('\n').length);
} catch(e) {
  console.log('❌ Syntax check: FAILED -', e.message);
  // Don't save broken file
}
