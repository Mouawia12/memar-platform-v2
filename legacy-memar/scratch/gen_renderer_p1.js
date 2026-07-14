// Part 1: CSS + render() + renderHeader() + renderCategoryTabs()
const fs = require('fs');
let content = fs.readFileSync('erp/pricing2.js', 'utf8');

const CSS = `
<style id="pricing2-styles">
:root{--p2-primary:#4F46E5;--p2-success:#059669;--p2-danger:#EF4444;--p2-warn:#D97706;--p2-gray:#64748B;}
.p2-wrap{display:grid;grid-template-columns:1fr 420px;gap:0;min-height:calc(100vh - 120px);background:#F1F5F9;}
.p2-left{overflow-y:auto;padding:28px 24px;display:flex;flex-direction:column;gap:16px;}
.p2-right{position:sticky;top:0;height:calc(100vh - 120px);overflow-y:auto;background:#fff;border-right:1px solid #E2E8F0;box-shadow:-4px 0 24px rgba(0,0,0,.06);}
.p2-step{background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;transition:box-shadow .2s;}
.p2-step:hover{box-shadow:0 4px 20px rgba(79,70,229,.08);}
.p2-step-hdr{display:flex;align-items:center;gap:12px;padding:16px 20px;background:linear-gradient(135deg,#F8FAFF,#fff);border-bottom:1px solid #E2E8F0;}
.p2-step-num{width:32px;height:32px;border-radius:50%;background:var(--p2-primary);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.p2-step-title{font-weight:700;font-size:14px;color:#1E293B;}
.p2-step-sub{font-size:12px;color:#94A3B8;margin-top:2px;}
.p2-step-body{padding:16px 20px;}
.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.cat-card{border:2px solid #E2E8F0;border-radius:12px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .2s;background:#fff;}
.cat-card:hover{border-color:var(--cat-color,var(--p2-primary));transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1);}
.cat-card.active{border-color:var(--cat-color,var(--p2-primary));background:color-mix(in srgb,var(--cat-color,var(--p2-primary)) 8%,#fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--cat-color,var(--p2-primary)) 20%,transparent);}
.cat-card-icon{font-size:26px;margin-bottom:6px;}
.cat-card-label{font-size:13px;font-weight:700;color:#1E293B;}
.cat-card-desc{font-size:10px;color:#94A3B8;margin-top:2px;}
.restype-pills{display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px dashed #E2E8F0;}
.restype-pill{flex:1;padding:10px 6px;border:2px solid #E2E8F0;border-radius:10px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#64748B;transition:all .2s;}
.restype-pill.active{border-color:var(--p2-primary);background:#EEF2FF;color:var(--p2-primary);}
.restype-pill.disabled{opacity:.4;cursor:not-allowed;}
.area-slider-wrap{padding:8px 0;}
.area-val-display{text-align:center;margin-bottom:14px;}
.area-val-num{font-size:36px;font-weight:800;color:var(--p2-primary);}
.area-val-unit{font-size:16px;color:#94A3B8;margin-right:4px;}
.area-tier-info{display:flex;justify-content:center;gap:16px;margin-top:8px;}
.area-tier-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;}
.area-tier-badge.normal{background:#EEF2FF;color:var(--p2-primary);}
.area-tier-badge.custom-tier{background:#FEF3C7;color:var(--p2-warn);}
.area-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.area-preset{padding:6px 14px;border:1.5px solid #E2E8F0;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:#475569;}
.area-preset:hover{border-color:var(--p2-primary);color:var(--p2-primary);}
.area-preset.active{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.pkg-list{display:flex;flex-direction:column;gap:8px;}
.pkg-row{border:2px solid #E2E8F0;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;}
.pkg-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--pkg-color,var(--p2-primary));opacity:0;transition:.2s;}
.pkg-row:hover{border-color:var(--pkg-color,var(--p2-primary));transform:translateX(-2px);}
.pkg-row.active{border-color:var(--pkg-color,var(--p2-primary));background:var(--pkg-bg,#EEF2FF);}
.pkg-row.active::before{opacity:1;}
.pkg-row-icon{font-size:28px;flex-shrink:0;}
.pkg-row-info{flex:1;min-width:0;}
.pkg-row-name{font-weight:700;font-size:14px;color:#1E293B;}
.pkg-row-desc{font-size:11px;color:#64748B;margin-top:2px;}
.pkg-row-svcs{font-size:10px;color:#94A3B8;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pkg-row-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--pkg-color,var(--p2-primary));color:#fff;flex-shrink:0;}
.pkg-popular-tag{position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;background:#F59E0B;color:#fff;padding:2px 8px;border-radius:10px;}
.svc-group-hdr{font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;padding:10px 0 6px;margin-top:4px;border-bottom:1px solid #F1F5F9;margin-bottom:6px;}
.svc-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid transparent;border-radius:10px;cursor:pointer;transition:all .15s;}
.svc-item:hover{background:#F8FAFF;border-color:#E2E8F0;}
.svc-item.active{background:#EEF2FF;border-color:#C7D2FE;}
.svc-item-chk{width:18px;height:18px;border:2px solid #CBD5E1;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.svc-item.active .svc-item-chk{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.svc-item-icon{font-size:18px;flex-shrink:0;}
.svc-item-info{flex:1;min-width:0;}
.svc-item-name{font-size:13px;font-weight:600;color:#1E293B;}
.svc-item-desc{font-size:11px;color:#94A3B8;margin-top:1px;}
.svc-item-price{text-align:left;flex-shrink:0;}
.svc-item-rate{font-size:11px;color:#64748B;}
.svc-item-amt{font-size:12px;font-weight:700;color:var(--p2-primary);}
.svc-item-manual{font-size:10px;color:var(--p2-danger);font-weight:600;background:#FEE2E2;padding:2px 6px;border-radius:6px;}
.svc-duration{font-size:10px;color:#94A3B8;margin-top:2px;}
.addon-grid2{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.addon-card2{border:1.5px solid #E2E8F0;border-radius:10px;padding:12px 8px;text-align:center;cursor:pointer;transition:all .2s;}
.addon-card2:hover{border-color:var(--p2-primary);transform:translateY(-1px);}
.addon-card2.active{border-color:var(--p2-primary);background:#EEF2FF;}
.addon-card2-icon{font-size:22px;margin-bottom:4px;}
.addon-card2-name{font-size:11px;font-weight:600;color:#374151;}
.addon-card2-price{font-size:11px;color:var(--p2-primary);font-weight:700;margin-top:3px;}
.toggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.toggle-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;background:#F8FAFC;}
.toggle-item-lbl{font-size:12px;font-weight:600;color:#374151;}
.client-fields{display:flex;flex-direction:column;gap:10px;}
.p2-field{display:flex;flex-direction:column;gap:4px;}
.p2-label{font-size:11px;font-weight:600;color:#64748B;}
.p2-input{padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border .2s;}
.p2-input:focus{border-color:var(--p2-primary);box-shadow:0 0 0 3px rgba(79,70,229,.1);}
.qcard{padding:0;display:flex;flex-direction:column;height:100%;}
.qcard-hdr{padding:24px 20px 20px;color:#fff;position:relative;overflow:hidden;}
.qcard-hdr::after{content:'م';position:absolute;left:-10px;top:-10px;font-size:120px;font-weight:900;opacity:.08;}
.qcard-logo{font-size:11px;opacity:.8;margin-bottom:4px;}
.qcard-company{font-size:16px;font-weight:800;}
.qcard-en{font-size:11px;opacity:.7;margin-top:2px;}
.qcard-meta{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E2E8F0;border-bottom:1px solid #E2E8F0;}
.qcard-meta-cell{padding:10px 16px;background:#F8FAFC;}
.qcard-meta-lbl{font-size:10px;color:#94A3B8;font-weight:600;}
.qcard-meta-val{font-size:13px;font-weight:700;color:#1E293B;margin-top:2px;}
.qcard-client{padding:14px 20px;border-bottom:1px solid #F1F5F9;background:linear-gradient(135deg,#F0FDF4,#fff);}
.qcard-client-to{font-size:10px;color:#94A3B8;}
.qcard-client-name{font-size:16px;font-weight:800;color:#1E293B;}
.qcard-body{flex:1;padding:16px 20px;overflow-y:auto;}
.qcard-sec-title{font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 8px;display:flex;align-items:center;gap:6px;}
.qcard-sec-title::after{content:'';flex:1;height:1px;background:#F1F5F9;}
.qline{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;margin-bottom:3px;font-size:13px;}
.qline:hover{background:#F8FAFC;}
.qline-name{color:#374151;display:flex;align-items:center;gap:6px;}
.qline-amt{font-weight:700;font-family:'Inter',monospace;color:#1E293B;}
.qline.discount{background:#F0FDF4;}
.qline.discount .qline-name{color:var(--p2-success);}
.qline.discount .qline-amt{color:var(--p2-success);}
.qline.gov{background:#F8FAFF;}
.qline.manual .qline-amt{color:var(--p2-danger);font-size:11px;}
.qtotals{background:#F8FAFC;border-radius:12px;padding:14px 16px;margin-top:12px;}
.qtotal-row{display:flex;justify-content:space-between;font-size:12px;color:#64748B;padding:3px 0;}
.qtotal-row.green{color:var(--p2-success);font-weight:600;}
.qgrand{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #E2E8F0;margin-top:10px;padding-top:12px;}
.qgrand-lbl{font-size:14px;font-weight:800;color:#1E293B;}
.qgrand-val{font-size:22px;font-weight:900;color:var(--p2-primary);}
.qgrand-manual{font-size:11px;color:var(--p2-danger);font-weight:700;}
.qcard-pkg{text-align:center;margin:10px 0;}
.qcard-pkg-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;}
.qdocs{display:flex;flex-direction:column;gap:4px;}
.qdoc-item{display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;color:#475569;}
.qdoc-item.req{color:var(--p2-success);font-weight:600;}
.qtimeline{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.qtl-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#64748B;padding:6px 8px;background:#F8FAFC;border-radius:8px;}
.qtl-days{font-weight:700;color:var(--p2-primary);}
.qconds{font-size:11px;color:#64748B;padding:10px 12px;background:#F8FAFC;border-radius:8px;border-right:3px solid #CBD5E1;}
.qconds li{padding:3px 0;}
.qnotes{font-size:12px;color:#92400E;padding:10px 12px;background:#FFFBEB;border-radius:8px;border-right:3px solid #FCD34D;}
.qcard-validity{text-align:center;font-size:11px;color:#94A3B8;padding:12px 16px;border-top:1px solid #F1F5F9;margin-top:8px;}
.qcard-actions{padding:12px 16px;border-top:1px solid #E2E8F0;display:flex;flex-direction:column;gap:8px;}
.qbtn{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:inherit;}
.qbtn-wa{background:#25D366;color:#fff;}
.qbtn-wa:hover{background:#1ebe5d;transform:translateY(-1px);}
.qbtn-pdf{background:var(--p2-primary);color:#fff;}
.qbtn-pdf:hover{background:#4338CA;transform:translateY(-1px);}
.qbtn-row{display:flex;gap:8px;}
.qbtn-copy{flex:1;background:#F1F5F9;color:#475569;}
.qbtn-copy:hover{background:#E2E8F0;}
.qbtn-save{flex:1;background:#F0FDF4;color:var(--p2-success);}
.qbtn-save:hover{background:#DCFCE7;}
.p2-toolbar{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(135deg,#1E293B,#334155);border-radius:14px;margin-bottom:4px;color:#fff;}
.p2-toolbar-title{font-size:18px;font-weight:800;}
.p2-toolbar-sub{font-size:12px;opacity:.7;margin-top:2px;}
.p2-toolbar-actions{display:flex;align-items:center;gap:10px;}
.p2-admin-badge{font-size:11px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.15);color:#fff;font-weight:600;}
.admin-mode-active .p2-step{border-color:#F59E0B!important;}
.admin-inp{width:60px;padding:3px 6px;border:1px solid #CBD5E1;border-radius:6px;font-size:11px;text-align:center;}
.admin-row-acts{display:flex;gap:4px;margin-top:4px;}
.admin-btn{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid #E2E8F0;background:#fff;color:#64748B;}
.admin-btn:hover{background:#F1F5F9;}
.admin-btn.danger{color:var(--p2-danger);border-color:#FCA5A5;}
.admin-btn.hide{color:#F59E0B;border-color:#FDE68A;}
.svc-item.hidden-svc{opacity:.4;background:#FFFBEB;border-style:dashed;}
.p2-select-bar{display:flex;gap:6px;margin-bottom:10px;}
.p2-select-btn{padding:5px 12px;border:1.5px solid #E2E8F0;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;background:#fff;color:#64748B;transition:all .2s;}
.p2-select-btn:hover{border-color:var(--p2-primary);color:var(--p2-primary);}
.p2-custom-tier-warning{padding:12px 16px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;font-size:12px;color:#92400E;font-weight:600;text-align:center;}
.pri-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1E293B;color:#fff;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:600;opacity:0;transition:all .3s;z-index:9999;white-space:nowrap;}
.pri-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
</style>`;

const oldRender = `  render() {
    const pg = document.getElementById('p-pricing2');
    if (!pg) return;
    try {
      pg.innerHTML = \`
        <div class="pricing-layout">
          <!-- LEFT: Configuration Panel -->
          <div class="pricing-config" id="pricing-config">
            \${this.renderHeader()}
            \${this.renderCategoryTabs()}
            \${this.renderAreaSelector()}
            \${this.renderPackages()}
            \${this.renderServicesSection()}
            \${this.renderAddonsSection()}
            \${this.renderToggles()}
            \${this.renderClientInfo()}
          </div>

          <!-- RIGHT: Quote Summary -->
          <div class="pricing-summary" id="pricing-summary-panel">
            \${this.renderSummary()}
          </div>
        </div>\`;

      this.bindEvents();
    } catch (e) {
      console.error("Pricing render error:", e);
      pg.innerHTML = \`
        <div style="padding: 40px; text-align: center; color: var(--danger);">
          <h2>⚠️ خطأ في تحميل محرك التسعير</h2>
          <p style="margin: 10px 0;">حدث خطأ أثناء تحميل بيانات التسعير. قد تكون البيانات المحفوظة تالفة أو غير متوافقة.</p>
          <pre style="text-align: left; background: #fee; padding: 10px; border-radius: 8px; margin: 20px auto; max-width: 600px; overflow-x: auto; color: #a00;">\${e.message}
\${e.stack}</pre>
          <button class="btn btn-primary" onclick="localStorage.removeItem('memar_pricing2_db'); localStorage.removeItem('memar_pricing2_admin'); location.reload();">
            🔄 استعادة الإعدادات الافتراضية
          </button>
        </div>\`;
    }
  },`;

const newRender = `  render() {
    const pg = document.getElementById('p-pricing2');
    if (!pg) return;
    // Inject CSS once
    if (!document.getElementById('pricing2-styles')) {
      document.head.insertAdjacentHTML('beforeend', \`${CSS.replace(/`/g,'\\`')}\`);
    }
    try {
      pg.innerHTML = \`<div class="p2-wrap \${PricingState2.adminMode ? 'admin-mode-active' : ''}">
          <div class="p2-left" id="p2-left">
            \${this.renderToolbar()}
            \${this.renderStep1()}
            \${this.renderStep2()}
            \${this.renderStep3()}
            \${this.renderStep4()}
            \${this.renderStep5()}
            \${this.renderStep6()}
          </div>
          <div class="p2-right" id="pricing-summary-panel">
            \${this.renderSummary()}
          </div>
        </div>\`;
      this.bindEvents();
    } catch(e) {
      console.error('Pricing2 render error:', e);
      pg.innerHTML = \`<div style="padding:40px;text-align:center;color:red;"><h2>⚠️ خطأ</h2><pre>\${e.message}</pre><button onclick="localStorage.removeItem('memar_pricing2_db');location.reload()">🔄 إعادة تعيين</button></div>\`;
    }
  },

  renderToolbar() {
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    return \`<div class="p2-toolbar" style="background:linear-gradient(135deg,\${cat?.color||'#4F46E5'},\${cat?.color||'#4F46E5'}cc);">
      <div>
        <div class="p2-toolbar-title">🧮 محرك التسعير الذكي</div>
        <div class="p2-toolbar-sub">احسب تكلفة مشروعك وأنشئ عرض سعر فوري · مجموعة معمار الهندسية</div>
      </div>
      <div class="p2-toolbar-actions">
        \${PricingState2.adminMode ? \`<button class="qbtn qbtn-save" style="padding:8px 14px;font-size:12px;" onclick="Pricing2.saveGlobalDB()">💾 حفظ التغييرات</button>\` : ''}
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="admin-mode-toggle" \${PricingState2.adminMode?'checked':''} style="width:16px;height:16px;">
          <span class="p2-admin-badge">⚙️ إدارة</span>
        </label>
      </div>
    </div>\`;
  },`;

content = content.replace(oldRender, newRender);
fs.writeFileSync('erp/pricing2.js', content, 'utf8');
console.log('Part 1 done');
