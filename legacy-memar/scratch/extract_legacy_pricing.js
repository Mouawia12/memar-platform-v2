const fs = require('fs');

const src = 'C:/Users/ayman/Desktop/memar-platform/memar group/شغل انتي جرافيتي/mimar-integrated5.html';
const c = fs.readFileSync(src, 'utf8');

// 1. Data Constants
let dataStr = '';
const catsIdx = c.indexOf('const CATS=');
if(catsIdx > -1) {
  const endIdx = c.indexOf('// ── KUWAIT OFFICIAL HOLIDAYS ──');
  dataStr = c.substring(catsIdx, endIdx).trim();
}

// 2. Functions
let funcsStr = '';
const startFuncs = c.indexOf('// ─────────── PRICING ENGINE ───────────');
const endFuncs = c.indexOf('</script>', startFuncs);

if(startFuncs > -1 && endFuncs > -1) {
  funcsStr = c.substring(startFuncs, endFuncs).trim();
}

// Ensure DB object mock for mQuote to work
const mockDbStr = `
const DB = {
  settings: () => ({ bankName1: 'Bank 1', bankName2: 'Bank 2', cashName: 'Cash', officeName: 'مجموعة معمار', phone: '66227785', email: 'memar@example.com' }),
  clients: () => [],
  projects: () => [],
  s: function(k, v) { localStorage.setItem('memar_'+k, JSON.stringify(v)); },
  _k: function(k) { return 'memar_'+k; }
};
`;

const out = `
// ==========================================
// LEGACY PRICING ENGINE (Extracted from mimar-integrated5)
// ==========================================

const LegacyPricingState = {
  params: { peCat: 'سكن خاص', peTab: 'services', cat: 'سكن خاص' }
};
const S = LegacyPricingState;

// --- DATA ---
${dataStr}

// --- MOCK DB ---
${mockDbStr}

// --- CORE FUNCTIONS ---
function toast(msg, type) {
  if(window.showToast) window.showToast(msg, type==='err'?'error':type);
  else alert(msg);
}
function go(page, params) {
  LegacyPricingState.params = params || {};
  document.getElementById('p-pricing_ref').innerHTML = window.LegacyPricing.renderEngine();
}
function openM(title, body, cb, size) {
  if(window.ERP && window.ERP.openModal) {
    const cbBtn = cb ? \`<button class="btn btn-primary" onclick="window._tmp_cb()">تأكيد</button>\` : '';
    window.ERP.openModal(title, body, cbBtn);
    window._tmp_cb = () => { if(cb) cb(); if(window.ERP.closeModal) window.ERP.closeModal(); };
  } else {
    alert('Modal: ' + title);
  }
}
function closeM() {
  if(window.ERP && window.ERP.closeModal) window.ERP.closeModal();
}
function today() { return new Date().toISOString().split('T')[0]; }

// Helpers used in pricing
const fmtM = n => \`\${(n||0).toLocaleString('ar-KW')} د.ك\`;
const fmtD = d => d ? new Date(d).toLocaleDateString('ar-KW',{year:'numeric',month:'short',day:'numeric'}) : '—';

// --- EXTRACTED LOGIC ---
${funcsStr}

// --- INIT COMPONENT ---
window.LegacyPricing = {
  renderServices: function() {
    return typeof rSvcs === 'function' ? rSvcs() : '';
  },
  renderEngine: function() {
    return typeof rPricingEngine === 'function' ? rPricingEngine() : '';
  }
};
`;

fs.writeFileSync('erp/pricing_reference.js', out, 'utf8');
console.log('pricing_reference.js successfully rewritten! extracted ' + dataStr.length + ' bytes of data and ' + funcsStr.length + ' bytes of functions.');
