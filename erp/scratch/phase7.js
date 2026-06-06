const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const newInternalLogic = `  rInternalTab(p) {
    // Only visible for admins or owners (this is also checked in the UI tabs)
    if (DATA.user?.role !== 'admin' && DATA.user?.role !== 'owner') {
      return '<div class="empty"><p>ليس لديك صلاحية لعرض هذه الصفحة</p></div>';
    }

    const evalP = p.evaluation || { profitability: 0, execution_ease: 0, delay_level: 0, change_requests: 0 };
    const evalC = p.client_eval || { payment_commitment: 0, cooperation: 0, response_speed: 0, vip: false };
    const notes = p.internal_notes || [];

    const drawStars = (val, field, type) => {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += \`<span style="cursor:pointer;font-size:18px;color:\${i <= val ? 'var(--warning)' : 'var(--border)'}" onclick="Projects.saveEvaluation(\${p.id}, '\${type}', '\${field}', \${i})">★</span>\`;
      }
      return stars;
    };

    let html = \`
<div class="g2" style="margin-bottom:20px">
  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--info-50);color:var(--info)">📊</div>تقييم المشروع</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">الربحية</span>
        <div style="direction:ltr">\${drawStars(evalP.profitability, 'profitability', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">سهولة التنفيذ</span>
        <div style="direction:ltr">\${drawStars(evalP.execution_ease, 'execution_ease', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">مستوى التأخير</span>
        <div style="direction:ltr">\${drawStars(evalP.delay_level, 'delay_level', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">كثرة التعديلات</span>
        <div style="direction:ltr">\${drawStars(evalP.change_requests, 'change_requests', 'evaluation')}</div>
      </div>
    </div>
  </div>

  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--purple-50);color:var(--purple)">👤</div>تقييم العميل</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">الالتزام بالدفعات</span>
        <div style="direction:ltr">\${drawStars(evalC.payment_commitment, 'payment_commitment', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">التعاون والسلاسة</span>
        <div style="direction:ltr">\${drawStars(evalC.cooperation, 'cooperation', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">سرعة الاستجابة</span>
        <div style="direction:ltr">\${drawStars(evalC.response_speed, 'response_speed', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px dashed var(--border)">
        <span style="font-size:13px;font-weight:700;color:var(--text)">تصنيف كعميل VIP 🌟</span>
        <label class="switch">
          <input type="checkbox" \${evalC.vip ? 'checked' : ''} onchange="Projects.saveEvaluation(\${p.id}, 'client_eval', 'vip', this.checked)">
          <span class="slider round"></span>
        </label>
      </div>
    </div>
  </div>
</div>

<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--danger-50);color:var(--danger)">🔒</div>ملاحظات داخلية (سرية)</div>
  </div>
  
  <div style="display:flex;gap:8px;margin-bottom:20px">
    <input type="text" id="internal_note_text" class="tf" style="flex:1;border:1px solid var(--border)" placeholder="اكتب ملاحظة للإدارة فقط...">
    <button class="btn btn-primary btn-sm" onclick="Projects.addInternalNote(\${p.id})">إضافة ملاحظة</button>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px">
    \${notes.length ? notes.map((n, i) => \`
      <div style="padding:12px;background:var(--bg);border-radius:8px;border-left:3px solid var(--danger);display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;color:var(--text-4);margin-bottom:4px">\${n.date} - بواسطة: \${n.by}</div>
          <div style="font-size:13.5px;color:var(--text-2);line-height:1.5">\${n.text}</div>
        </div>
        <button class="btn btn-ghost btn-xs" onclick="Projects.deleteInternalNote(\${p.id}, \${i})" style="color:var(--danger);padding:4px" title="حذف">🗑️</button>
      </div>
    \`).join('') : '<div class="empty" style="padding:20px;font-size:13px"><p>لا توجد ملاحظات داخلية مسجلة</p></div>'}
  </div>
</div>
\`;
    return html;
  },

  saveEvaluation(pid, type, field, val) {
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p[type]) {
      p.evaluation = { profitability: 0, execution_ease: 0, delay_level: 0, change_requests: 0 };
      p.client_eval = { payment_commitment: 0, cooperation: 0, response_speed: 0, vip: false };
    }
    
    p[type][field] = val;
    this.saveProjects(prj);
    this.rPView(pid);
  },

  addInternalNote(pid) {
    const text = document.getElementById('internal_note_text')?.value.trim();
    if (!text) return;

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.internal_notes) p.internal_notes = [];
    
    p.internal_notes.unshift({
      text,
      by: DATA.user?.name || 'مدير',
      date: new Date().toISOString().split('T')[0]
    });

    this.saveProjects(prj);
    this.rPView(pid);
  },

  deleteInternalNote(pid, index) {
    if(!confirm('حذف الملاحظة السرية؟')) return;
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p || !p.internal_notes) return;
    
    p.internal_notes.splice(index, 1);
    this.saveProjects(prj);
    this.rPView(pid);
  },
`;

const oldInternalPlaceholderRegex = /  rInternalTab\(p\) \{\s*return '<div class="card"><div class="empty" style="padding:40px"><p>الملاحظات الداخلية \(سيتم برمجته في المرحلة 7\)<\/p><\/div><\/div>';\s*\},/;

if (oldInternalPlaceholderRegex.test(code)) {
  code = code.replace(oldInternalPlaceholderRegex, newInternalLogic);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ Phase 7 applied successfully');
} else {
  console.log('❌ Could not find rInternalTab placeholder to replace.');
}
