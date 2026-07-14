const fs = require('fs');
let js = fs.readFileSync('erp_app.js', 'utf8');
const parts = js.split('const WebBuilder = {');
if (parts.length === 2) {
  const newImpl = `const WebBuilder = {
  render() {
      const el = document.getElementById('p-web_builder');
      if(!el) return;
      let html = \`
        <div class="section-header" style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="section-title">🎨 المحرر المرئي للموقع (Visual Page Builder)</div>
            <div class="section-subtitle">اضغط على أي نص لتعديله، أو استخدم أشرطة التحكم لتحريك الأقسام.</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" style="border-color:var(--border);" onclick="window.open('../website/index.html', '_blank')">👁️ معاينة الموقع الحي</button>
            <button class="btn btn-primary btn-lg" onclick="WebBuilder.triggerSave()">💾 حفظ ونشر التعديلات</button>
          </div>
        </div>
        <div style="width:100%; height:calc(100vh - 170px); border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow:var(--sh-sm);">
           <iframe id="builder-iframe" src="../website/index.html?mode=builder" style="width:100%; height:100%; border:none;"></iframe>
        </div>
      \`;
      el.innerHTML = html;
      window.removeEventListener('message', WebBuilder.handleMessage);
      window.addEventListener('message', WebBuilder.handleMessage);
  },
  triggerSave() {
      const frame = document.getElementById('builder-iframe');
      if(frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ type: 'REQUEST_SAVE' }, '*');
      }
  },
  handleMessage(e) {
      if(e.data && e.data.type === 'SAVE_WEBSITE') {
          localStorage.setItem('memar_published_site', e.data.payload);
          if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ ونشر الموقع بنجاح! 🚀', 'success');
          if(window.SystemLogger) window.SystemLogger.log('UPDATE_WEBSITE', 'SYSTEM', 'ALL', 'تم تعديل واجهة الموقع عبر المحرر المرئي');
      }
  }
};
window.WebBuilder = WebBuilder;
`;
  fs.writeFileSync('erp_app.js', parts[0] + newImpl);
  console.log('Replaced successfully');
} else {
  console.log('Could not split. Length: ' + parts.length);
}
