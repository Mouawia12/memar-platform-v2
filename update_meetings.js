const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const endCallBtnOld = `<button title="إنهاء المكالمة" onclick="CRMMeetings.render()" style="background:#ef4444;border:none;color:#fff;font-size:20px;cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:10px">📞</button>`;
const endCallBtnNew = `<button title="إنهاء المكالمة وإضافة ملخص" onclick="CRMMeetings.showWrapUpModal('\${id}')" style="background:#ef4444;border:none;color:#fff;font-size:20px;cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:10px;box-shadow:0 0 10px rgba(239,68,68,0.5)">📞</button>`;

const newMethods = `
  showWrapUpModal(meetingId) {
    const body = \`
      <div style="background:var(--bg); border-radius:12px; padding:20px;">
        <h4 style="margin-bottom:12px; font-weight:800;">📝 ملخص الاجتماع وتحديث الـ CRM</h4>
        <div style="margin-bottom:16px;">
          <label class="form-label">أهم الملاحظات والقرارات التي تم اتخاذها:</label>
          <textarea id="wrapup_notes" class="form-input" style="height:100px; resize:vertical; font-size:13px;" placeholder="اكتب ملخص الاجتماع هنا..."></textarea>
        </div>
        <div style="margin-bottom:16px; background:#fff; padding:12px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-weight:700; margin-bottom:8px; font-size:13px;">⚙️ الإجراءات الآلية (Workflow):</div>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
            <input type="checkbox" id="wrapup_action_task" checked>
            <span style="font-size:13px;">إنشاء مهمة متابعة تلقائية للفريق</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="wrapup_action_crm" checked>
            <span style="font-size:13px;">تحديث سجل العميل في الـ CRM بالملخص</span>
          </label>
        </div>
      </div>
    \`;
    ERP.openModal('إنهاء الاجتماع', body, \`
      <button class="btn btn-secondary" onclick="ERP.closeModal(); CRMMeetings.render()">إغلاق فقط</button>
      <button class="btn btn-primary" onclick="CRMMeetings.submitWrapUp('\${meetingId}')">💾 حفظ وإنهاء</button>
    \`);
  },

  submitWrapUp(meetingId) {
    const notes = document.getElementById('wrapup_notes').value;
    const createTask = document.getElementById('wrapup_action_task').checked;
    const updateCrm = document.getElementById('wrapup_action_crm').checked;
    
    if (createTask) {
      let tasks = window.DB_TABLES.tasks || [];
      tasks.unshift({
        id: 'T-MTG-' + Date.now().toString().slice(-4),
        title: 'متابعة ما بعد الاجتماع',
        desc: notes || 'متابعة قرارات الاجتماع.',
        status: 'todo',
        priority: 'high',
        date: new Date().toISOString()
      });
      window.DB_TABLES.tasks = tasks;
    }
    
    if (updateCrm && notes) {
      let acts = DB.activities();
      acts.push({
        id: DB.nid(acts),
        leadId: 1, // Mock
        type: 'meeting',
        note: \`[ملخص اجتماع]: \${notes}\`,
        date: new Date().toISOString().split('T')[0],
        by: window.DATA.user.name || 'النظام'
      });
      DB.s('activities', acts);
    }
    
    toast('تم إنهاء الاجتماع وحفظ الملخص وتشغيل الـ Workflow!');
    ERP.closeModal();
    this.render();
  }
};`;

code = code.replace(endCallBtnOld, endCallBtnNew);
code = code.replace(/    `;\r?\n  }\r?\n};\r?\n/m, "    `;\n  },\n" + newMethods + "\n");

fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
