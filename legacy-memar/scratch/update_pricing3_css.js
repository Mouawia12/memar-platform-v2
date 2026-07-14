const fs = require('fs');

let content = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', 'utf8');

const newCSS = `
<style id="Pricing3-styles">
#p-pricing3 {
  --bg:     #F0F4F8;
  --bg2:    #E8EDF3;
  --card:   #ffffff;
  --card2:  #F8FAFC;
  --navy:   #1B3A6B;
  --navy2:  #2952A3;
  --navy3:  #EEF2F9;
  --gold:   #B8922A;
  --gold2:  #D4A843;
  --gbg:    #FFF8E8;
  --gb:     #F0DCA0;
  --tx:     #1A2332;
  --tx2:    #4B5563;
  --mt:     #9CA3AF;
  --brd:    #E5E7EB;
  --brd2:   #D1D5DB;
  --ok:     #059669;
  --okb:    #ECFDF5;
  --okbr:   #A7F3D0;
  --warn:   #D97706;
  --warnb:  #FFFBEB;
  --warnbr: #FCD34D;
  --err:    #DC2626;
  --errb:   #FEF2F2;
  --errbr:  #FECACA;
  --inf:    #2563EB;
  --infb:   #EFF6FF;
  --infbr:  #BFDBFE;
  --pur:    #7C3AED;
  --purb:   #F5F3FF;
  --purbr:  #DDD6FE;
  --r:   12px;
  --rs:  8px;
  --sh:  0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
  --sh2: 0 4px 16px rgba(0,0,0,.10);
  --sh3: 0 8px 30px rgba(0,0,0,.13);

  --p2-primary: var(--navy);
  --p2-success: var(--ok);
  --p2-danger: var(--err);
  --p2-warn: var(--warn);
  --p2-gray: var(--mt);
}

/* Base Mapping */
.p2-wrap { display:flex; flex-direction:column; gap:16px; min-height:calc(100vh - 120px); background:var(--bg); padding:24px; font-family:'Cairo',sans-serif; }
.p2-left { display:flex; flex-direction:column; gap:16px; }
.p2-right { position:sticky; top:0; height:calc(100vh - 120px); overflow-y:auto; background:var(--card); border-right:1px solid var(--brd); box-shadow:var(--sh); }
.p2-step { background:var(--card); border-radius:var(--r); border:1px solid var(--brd); overflow:hidden; transition:box-shadow .2s; box-shadow:var(--sh); }
.p2-step:hover { box-shadow:var(--sh2); }
.p2-step-hdr { display:flex; align-items:center; gap:12px; padding:16px 20px; background:linear-gradient(135deg,var(--navy3),var(--card)); border-bottom:1px solid var(--brd); }
.p2-step-num { width:32px; height:32px; border-radius:50%; background:var(--navy); color:#fff; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.p2-step-title { font-weight:700; font-size:14px; color:var(--tx); }
.p2-step-sub { font-size:12px; color:var(--mt); margin-top:2px; }
.p2-step-body { padding:16px 20px; }

/* Grid & Cards */
.cat-grid { display:flex; flex-wrap:wrap; gap:8px; }
.cat-card { display:flex; align-items:center; gap:8px; border:1px solid var(--brd); border-radius:var(--rs); padding:6px 12px; cursor:pointer; transition:all .2s; background:var(--card); }
.cat-card:hover { border-color:var(--navy); transform:translateY(-2px); box-shadow:var(--sh2); }
.cat-card.active { border-color:var(--navy); background:var(--navy3); box-shadow:0 0 0 3px color-mix(in srgb,var(--navy) 20%,transparent); }
.cat-card-icon { font-size:18px; margin-bottom:0; }
.cat-card-label { font-size:13px; font-weight:700; color:var(--tx); }
.cat-card-desc { display:none; }

.restype-pills { display:flex; gap:8px; margin-top:14px; padding-top:14px; border-top:1px dashed var(--brd); }
.restype-pill { flex:1; padding:10px 6px; border:2px solid var(--brd); border-radius:10px; text-align:center; cursor:pointer; font-size:12px; font-weight:600; color:var(--tx2); transition:all .2s; }
.restype-pill.active { border-color:var(--navy); background:var(--navy3); color:var(--navy); }
.restype-pill.disabled { opacity:.4; cursor:not-allowed; }

.area-val-display { text-align:center; margin-bottom:14px; }
.area-val-num { font-size:36px; font-weight:800; color:var(--navy); }
.area-val-unit { font-size:16px; color:var(--mt); margin-right:4px; }
.area-tier-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
.area-tier-badge.normal { background:var(--navy3); color:var(--navy); }
.area-tier-badge.custom-tier { background:var(--warnb); color:var(--warn); }
.area-presets { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.area-preset { padding:6px 14px; border:1.5px solid var(--brd); border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; color:var(--tx2); }
.area-preset:hover { border-color:var(--navy); color:var(--navy); }
.area-preset.active { background:var(--navy); border-color:var(--navy); color:#fff; }

.pkg-list { display:flex; flex-direction:column; gap:8px; }
.pkg-row { border:2px solid var(--brd); border-radius:var(--r); padding:14px 16px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:14px; position:relative; overflow:hidden; background:var(--card); }
.pkg-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--pkg-color,var(--navy)); opacity:0; transition:.2s; }
.pkg-row:hover { border-color:var(--pkg-color,var(--navy)); transform:translateX(-2px); box-shadow:var(--sh); }
.pkg-row.active { border-color:var(--pkg-color,var(--navy)); background:var(--pkg-bg,var(--navy3)); }
.pkg-row.active::before { opacity:1; }
.pkg-row-icon { font-size:28px; flex-shrink:0; }
.pkg-row-info { flex:1; min-width:0; }
.pkg-row-name { font-weight:700; font-size:14px; color:var(--tx); }
.pkg-row-desc { font-size:11px; color:var(--tx2); margin-top:2px; }
.pkg-row-svcs { font-size:10px; color:var(--mt); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pkg-row-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:var(--pkg-color,var(--navy)); color:#fff; flex-shrink:0; }
.pkg-popular-tag { position:absolute; top:8px; left:8px; font-size:9px; font-weight:800; background:var(--gold); color:#fff; padding:2px 8px; border-radius:10px; }

.svc-group-hdr { font-size:11px; font-weight:800; color:var(--mt); text-transform:uppercase; letter-spacing:.08em; padding:10px 0 6px; margin-top:4px; border-bottom:1px solid var(--bg); margin-bottom:6px; }
.svc-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1.5px solid transparent; border-radius:10px; cursor:pointer; transition:all .15s; }
.svc-item:hover { background:var(--card2); border-color:var(--brd); }
.svc-item.active { background:var(--navy3); border-color:var(--brd2); }
.svc-item-chk { width:18px; height:18px; border:2px solid var(--brd2); border-radius:5px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; }
.svc-item.active .svc-item-chk { background:var(--navy); border-color:var(--navy); color:#fff; }
.svc-item-icon { font-size:18px; flex-shrink:0; }
.svc-item-info { flex:1; min-width:0; }
.svc-item-name { font-size:13px; font-weight:600; color:var(--tx); }
.svc-item-desc { font-size:11px; color:var(--mt); margin-top:1px; }
.svc-item-price { text-align:left; flex-shrink:0; }
.svc-item-rate { font-size:11px; color:var(--tx2); }
.svc-item-amt { font-size:12px; font-weight:700; color:var(--navy); }
.svc-item-manual { font-size:10px; color:var(--err); font-weight:600; background:var(--errb); padding:2px 6px; border-radius:6px; }

.addon-grid2 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.addon-card2 { border:1.5px solid var(--brd); border-radius:10px; padding:12px 8px; text-align:center; cursor:pointer; transition:all .2s; }
.addon-card2:hover { border-color:var(--navy); transform:translateY(-1px); }
.addon-card2.active { border-color:var(--navy); background:var(--navy3); }
.addon-card2-icon { font-size:22px; margin-bottom:4px; }
.addon-card2-name { font-size:11px; font-weight:600; color:var(--tx2); }
.addon-card2-price { font-size:11px; color:var(--navy); font-weight:700; margin-top:3px; }

.client-fields { display:flex; flex-direction:column; gap:10px; }
.p2-field { display:flex; flex-direction:column; gap:4px; }
.p2-label { font-size:11px; font-weight:600; color:var(--tx2); }
.p2-input { padding:10px 14px; border:1.5px solid var(--brd); border-radius:var(--rs); font-size:13px; font-family:inherit; outline:none; transition:border .2s; background:var(--bg); color:var(--tx); }
.p2-input:focus { border-color:var(--navy); background:#fff; box-shadow:0 0 0 3px rgba(27,58,107,.07); }

.qcard { padding:0; display:flex; flex-direction:column; height:100%; border-radius:var(--r); background:var(--card); box-shadow:var(--sh); border:1px solid var(--brd); overflow:hidden; }
.qcard-hdr { padding:24px 20px 20px; color:#fff; position:relative; overflow:hidden; background:linear-gradient(135deg, var(--navy), var(--navy2)); }
.qcard-hdr::after { content:'🏛️'; position:absolute; left:-10px; bottom:-10px; font-size:110px; opacity:.06; line-height:1; }
.qcard-logo { font-size:11px; opacity:.8; margin-bottom:4px; }
.qcard-company { font-size:16px; font-weight:900; }
.qcard-en { font-size:11px; opacity:.7; margin-top:2px; }
.qcard-meta { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--brd); border-bottom:1px solid var(--brd); }
.qcard-meta-cell { padding:10px 16px; background:var(--card2); }
.qcard-meta-lbl { font-size:10px; color:var(--mt); font-weight:600; }
.qcard-meta-val { font-size:13px; font-weight:700; color:var(--tx); margin-top:2px; }
.qcard-client { padding:14px 20px; border-bottom:1px solid var(--bg); background:var(--gbg); }
.qcard-client-to { font-size:10px; color:var(--mt); }
.qcard-client-name { font-size:16px; font-weight:800; color:var(--tx); }
.qcard-body { flex:1; padding:16px 20px; overflow-y:auto; }
.qcard-sec-title { font-size:10px; font-weight:800; color:var(--mt); text-transform:uppercase; letter-spacing:.08em; margin:14px 0 8px; display:flex; align-items:center; gap:6px; }
.qcard-sec-title::after { content:''; flex:1; height:1px; background:var(--bg); }
.qline { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-radius:8px; margin-bottom:3px; font-size:13px; }
.qline:hover { background:var(--card2); }
.qline-name { color:var(--tx2); display:flex; align-items:center; gap:6px; }
.qline-amt { font-weight:700; color:var(--tx); }
.qline.discount { background:var(--okb); }
.qline.discount .qline-name { color:var(--ok); }
.qline.discount .qline-amt { color:var(--ok); }
.qline.gov { background:var(--navy3); }
.qline.manual .qline-amt { color:var(--err); font-size:11px; }

.qtotals { background:var(--card2); border-radius:12px; padding:14px 16px; margin-top:12px; }
.qtotal-row { display:flex; justify-content:space-between; font-size:12px; color:var(--tx2); padding:3px 0; }
.qtotal-row.green { color:var(--ok); font-weight:600; }
.qgrand { display:flex; justify-content:space-between; align-items:center; border-top:2px solid var(--brd); margin-top:10px; padding-top:12px; }
.qgrand-lbl { font-size:14px; font-weight:800; color:var(--tx); }
.qgrand-val { font-size:22px; font-weight:900; color:var(--gold); }
.qgrand-manual { font-size:11px; color:var(--err); font-weight:700; }

.qcard-pkg { text-align:center; margin:10px 0; }
.qcard-pkg-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; background:linear-gradient(135deg,var(--gold),var(--gold2)); color:#fff; }

.qdocs { display:flex; flex-direction:column; gap:4px; }
.qdoc-item { display:flex; align-items:center; gap:8px; font-size:12px; padding:4px 0; color:var(--tx2); }
.qdoc-item.req { color:var(--ok); font-weight:600; }

.qtimeline { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.qtl-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--tx2); padding:6px 8px; background:var(--card2); border-radius:8px; }
.qtl-days { font-weight:700; color:var(--navy); }

.qconds { font-size:11px; color:var(--tx2); padding:10px 12px; background:var(--card2); border-radius:8px; border-right:3px solid var(--brd2); }
.qconds li { padding:3px 0; }
.qnotes { font-size:12px; color:var(--warn); padding:10px 12px; background:var(--warnb); border-radius:8px; border-right:3px solid var(--warnbr); }

.qcard-validity { text-align:center; font-size:11px; color:var(--mt); padding:12px 16px; border-top:1px solid var(--bg); margin-top:8px; }
.qcard-actions { padding:12px 16px; border-top:1px solid var(--brd); display:flex; flex-direction:column; gap:8px; }

/* Buttons */
.qbtn { display:flex; align-items:center; justify-content:center; gap:8px; padding:7px 14px; border-radius:var(--rs); font-size:12.5px; font-weight:700; cursor:pointer; border:1.5px solid transparent; transition:all .2s; font-family:inherit; }
.qbtn-wa { background:var(--okb); color:var(--ok); border-color:var(--okbr); }
.qbtn-wa:hover { background:var(--ok); color:#fff; }
.qbtn-pdf { background:linear-gradient(135deg,var(--navy),var(--navy2)); color:#fff; }
.qbtn-pdf:hover { box-shadow:var(--sh2); }
.qbtn-row { display:flex; gap:8px; }
.qbtn-copy { flex:1; background:var(--card); border-color:var(--brd); color:var(--tx2); }
.qbtn-copy:hover { border-color:var(--navy); color:var(--navy); background:var(--navy3); }
.qbtn-save { flex:1; background:var(--okb); color:var(--ok); border-color:var(--okbr); }
.qbtn-save:hover { background:var(--ok); color:#fff; }

.p2-toolbar { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(135deg,var(--navy),var(--navy2)); border-radius:14px; margin-bottom:4px; color:#fff; }
.p2-toolbar-title { font-size:18px; font-weight:900; }
.p2-toolbar-sub { font-size:12px; opacity:.7; margin-top:2px; }
.p2-toolbar-actions { display:flex; align-items:center; gap:10px; }
.p2-admin-badge { font-size:11px; padding:4px 12px; border-radius:20px; background:rgba(255,255,255,.15); color:#fff; font-weight:600; border:1px solid rgba(255,255,255,.2); }
.admin-mode-active .p2-step { border-color:var(--warn) !important; }

.admin-inp { width:60px; padding:3px 6px; border:1px solid var(--brd2); border-radius:6px; font-size:11px; text-align:center; background:var(--bg); color:var(--tx); }
.admin-row-acts { display:flex; gap:4px; margin-top:4px; }
.admin-btn { padding:3px 8px; border-radius:6px; font-size:10px; font-weight:600; cursor:pointer; border:1px solid var(--brd); background:var(--card); color:var(--tx2); }
.admin-btn:hover { background:var(--bg); color:var(--navy); }
.admin-btn.danger { color:var(--err); border-color:var(--errbr); }
.admin-btn.hide { color:var(--warn); border-color:var(--warnbr); }

.svc-item.hidden-svc { opacity:.4; background:var(--warnb); border-style:dashed; border-color:var(--warnbr); }

.p2-select-bar { display:flex; gap:6px; margin-bottom:10px; }
.p2-select-btn { padding:5px 12px; border:1.5px solid var(--brd); border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; background:var(--card); color:var(--tx2); transition:all .2s; }
.p2-select-btn:hover { border-color:var(--navy); color:var(--navy); }
.p2-custom-tier-warning { padding:12px 16px; background:var(--warnb); border:1px solid var(--warnbr); border-radius:10px; font-size:12px; color:var(--warn); font-weight:600; text-align:center; }

.qcard-sec-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--brd); padding-bottom:4px; margin-top:16px; }
.sec-toggle { cursor:pointer; background:none; border:none; opacity:0.3; font-size:14px; transition:all 0.2s; padding:4px; }
.sec-toggle:hover { opacity:1; transform:scale(1.1); }
.hidden-sec .qcard-sec-content { display:none; }
.hidden-sec .qcard-sec-title { color: var(--mt) !important; text-decoration: line-through; }
@media print { .hidden-sec { display:none !important; } .sec-toggle { display:none !important; } .qcard-sec-hdr { border:none; margin-bottom:4px; padding-bottom:0; } }
</style>
`;

let startIndex = content.indexOf('<style id="Pricing3-styles">');
let endIndex = content.indexOf('</style>', startIndex) + 8;

content = content.substring(0, startIndex) + newCSS + content.substring(endIndex);

// Also replace linear-gradient from #1E293B to #334155 with var(--navy) and var(--navy2)
content = content.replace(/linear-gradient\(135deg,#1E293B,#334155\)/g, 'linear-gradient(135deg,var(--navy),var(--navy2))');
content = content.replace(/background:var\(--p2-primary\);color:#fff/g, 'background:var(--navy);color:#fff');
content = content.replace(/color:#1E293B/g, 'color:var(--tx)');
content = content.replace(/color:#64748B/g, 'color:var(--tx2)');

// Ensure it adds Pricing Engine 3 properly
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/pricing3.js', content);
console.log('Done');
