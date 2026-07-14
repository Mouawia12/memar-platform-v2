const fs = require('fs');
const content = fs.readFileSync('erp/erp_app.js', 'utf8');

const deletedCode = `  submitForm() {
    const toName = document.getElementById('req-to').value;
    const title = document.getElementById('req-title').value.trim();
    const desc = document.getElementById('req-desc').value.trim();
    
    if(!title || !desc) {
      alert('يرجى ملء جميع الحقول (العنوان والتفاصيل).');
      return;
    }
    
    let requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    requests.push({
      id: 'RQ' + Date.now().toString().slice(-4),
      type: 'custom',
      title: title,
      desc: desc,
      fromName: DATA.user.name || 'الإدارة العامة',
      fromRole: DATA.user.role || 'مسؤول',
      toName: toName,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
    
    ERP.closeModal();
    this.activeTab = 'sent';
    this.render();
    toast('تم إرسال الطلب بنجاح للجهة المعنية');
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: CHATBOT ADMIN
─────────────────────────────────────────────────────── */
const ChatbotAdmin = {
  render() {
    const pg = document.getElementById('p-chatbot');
    const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
    const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
    
    // Convert qa object to array
    const qaArray = Object.keys(qa).map(k => ({ key: k, text: qa[k].text, qr: qa[k].qr || [] }));
    
    pg.innerHTML = \`
      <div class="section-header" style="margin-bottom:20px">
        <div>
          <div class="section-title">🤖 إدارة المساعد الذكي</div>
          <div class="section-subtitle">إدارة المعرفة الفنية وتدريب المساعد الذكي</div>
        </div>
        <button class="btn btn-primary" onclick="ChatbotAdmin.addQAPrompt()">➕ إضافة سؤال وجواب</button>
      </div>

      <div class="grid-2">
        <!-- Q&A Configuration -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📚 قاعدة المعرفة (Q&A)</div>
            <span class="badge badge-blue">\${qaArray.length} عناصر مخصصة</span>
          </div>
          <div class="card-body">
            <div class="table-wrap">
            <table style="width:100%">
              <thead><tr><th>الكلمة المفتاحية / السؤال</th><th>الرد (معاينة)</th><th>إجراءات</th></tr></thead>
              <tbody>
                \${qaArray.map(item => \`
                  <tr>
                    <td class="td-bold" style="white-space:nowrap">\${ERP.h(item.key)}</td>
                    <td class="td-muted">\${ERP.h(item.text).substring(0, 30)}...</td>
                    <td style="white-space:nowrap; display:flex; gap: 4px;">
                       <button class="btn btn-sm btn-ghost" onclick="ChatbotAdmin.editQA('\${ERP.h(item.key)}')">تحرير</button>
                       <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="ChatbotAdmin.deleteQA('\${ERP.h(item.key)}')">حذف</button>
                    </td>
                  </tr>
                \`).join('')}
                \${qaArray.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا توجد قاعدة معرفة مخصصة.</td></tr>' : ''}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <!-- Unanswered / Flagged -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚠️ أسئلة لم يتم الرد عليها</div>
            <span class="badge \${unanswered.length>0?'badge-red':'badge-green'}">\${unanswered.length} سؤال</span>
          </div>
          <div class="card-body">
             <div style="display:flex;flex-direction:column;gap:12px; max-height:400px; overflow-y:auto; padding-right:4px;">
               \${unanswered.length === 0 ? '<div style="text-align:center;color:var(--text-4)">لا توجد أسئلة معلقة حالياً.</div>' : ''}
               \${unanswered.map((u, i) => \`
                 <div style="border:1px solid var(--danger);background:#FEF2F2;border-radius:var(--r);padding:12px">
                    <div style="font-size:12.5px;font-weight:700;margin-bottom:6px">" \${ERP.h(u.text)} "</div>
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">\${new Date(u.date).toLocaleString('ar-KW')}</div>
                    <div style="display:flex;gap:8px">
                       <button class="btn btn-sm btn-primary" onclick="ChatbotAdmin.trainFromUnanswered(\${i})">تدريب البوت</button>
                       <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="ChatbotAdmin.dismissUnanswered(\${i})">إزالة</button>
                    </div>
                 </div>
               \`).join('')}
             </div>
          </div>
        </div>
      </div>
    \`;
  },
  
  addQAPrompt() {
     const html = \`
       <div style="display:flex;flex-direction:column;gap:10px">
         <label style="font-size:12px;font-weight:700">الكلمة المفتاحية (Topic/Keyword)</label>
         <input id="qa-key" class="form-input" type="text" placeholder="مثال: الدوام, الشروط, الضمان..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">رد المساعد التلقائي</label>
         <textarea id="qa-text" class="form-input" rows="4" placeholder="يسعدني إبلاغك بأن..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;"></textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" placeholder="شكراً لك, ما هي التفاصيل" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     \`;
     ERP.openModal('إضافة رد مخصص', html, '<button class="btn btn-primary" onclick="ChatbotAdmin.saveQA()">حفظ التدريب</button>');
  },

  editQA(key) {
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
     if(!qa[key]) return;
     const text = qa[key].text;
     const qr = (qa[key].qr || []).join(', ');
     
     const html = \`
       <div style="display:flex;flex-direction:column;gap:10px">
         <input type="hidden" id="qa-old-key" value="\${key}">
         <label style="font-size:12px;font-weight:700">الكلمة المفتاحية (Topic/Keyword)</label>
         <input id="qa-key" class="form-input" type="text" value="\${key}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">رد المساعد التلقائي</label>
         <textarea id="qa-text" class="form-input" rows="4" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;">\${text}</textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" value="\${qr}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     \`;
     ERP.openModal('تحرير رد مخصص', html, '<button class="btn btn-primary" onclick="ChatbotAdmin.saveQA(true)">تحديث الرد</button>');
  },

  saveQA(isEdit=false) {
     const key = document.getElementById('qa-key').value.trim();
     const text = document.getElementById('qa-text').value.trim();
     const qrStr = document.getElementById('qa-qr').value.trim();
     const oldKeyInput = document.getElementById('qa-old-key');
     const oldKey = oldKeyInput ? oldKeyInput.value : null;

     if(!key || !text) return alert('يجب التأكد من الكلمة المفتاحية وإدخال الرد');
     
     const qr = qrStr ? qrStr.split(',').map(s=>s.trim()).filter(s=>s) : [];
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');

     if (isEdit && oldKey && oldKey !== key) {
       delete qa[oldKey];
     }

     qa[key] = { text, qr };
     localStorage.setItem('memar_chatbot_qa', JSON.stringify(qa));
     
     if (window.MemarDB) {
       window.MemarDB.upsert('system_settings', { key: 'memar_chatbot_qa', value: JSON.stringify(qa) }, 'key');
     }
     
     if(!isEdit) {
       let activity = JSON.parse(localStorage.getItem('memar_crm_activities') || '[]');
       activity.unshift({id: 'QA'+Date.now(), type: 'note', desc: 'تم تدريب المساعد على: '+key, by: DATA.user.name, date: new Date().toISOString()});
       localStorage.setItem('memar_crm_activities', JSON.stringify(activity));
     }
     
     ERP.closeModal();
     this.render();
  },

  deleteQA(key) {
     if(!confirm('هل أنت متأكد من حذف الرد المخصص: ' + key + '؟')) return;
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
     delete qa[key];
     localStorage.setItem('memar_chatbot_qa', JSON.stringify(qa));
     
     if (window.MemarDB) {
       window.MemarDB.upsert('system_settings', { key: 'memar_chatbot_qa', value: JSON.stringify(qa) }, 'key');
     }
     let activity = JSON.parse(localStorage.getItem('memar_crm_activities') || '[]');
     activity.unshift({id: 'QA'+Date.now(), type: 'note', desc: 'تم حذف الرد المخصص: '+key, by: (window.DATA && window.DATA.user ? window.DATA.user.name : 'مسؤول النظام'), date: new Date().toISOString()});
     localStorage.setItem('memar_crm_activities', JSON.stringify(activity));

     ERP.closeModal();
     this.render();
  },

  dismissUnanswered(index) {
     const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
     unanswered.splice(index, 1);
     localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
     this.render();
  },

  trainFromUnanswered(index) {
     const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
     const item = unanswered[index];
     if(!item) return;
     
     const html = \`
       <div style="display:flex;flex-direction:column;gap:10px">
         <label style="font-size:12px;font-weight:700">السؤال الذي سأله العميل (استخدمه ككلمة مفتاحية)</label>
         <input id="qa-key" class="form-input" type="text" value="\${item.text}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">ردك لتدريب المساعد (ماذا ينبغي أن يقول؟)</label>
         <textarea id="qa-text" class="form-input" rows="4" placeholder="اكتب ردك هنا لتدريب البوت..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;"></textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" placeholder="" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     \`;`;

const insertedPattern = `  openClientProfile(id) {
    this._activeClient = id;
    this._viewMode = 'profile';
    this._activeProfileTab = 'overview';
    this.render();
  },

  closeClientProfile() {
    this._activeClient = null;
    this._viewMode = 'list';
    this._activeProfileTab = null;
    this.render();
  },
  
`;

const repIdx = content.indexOf(insertedPattern);
if (repIdx > -1) {
    const fixedContent = content.substring(0, repIdx) + deletedCode + content.substring(repIdx + insertedPattern.length);
    fs.writeFileSync('erp/erp_app.js', fixedContent);
    console.log('Restored correctly.');
} else {
    console.log('Not found!');
}
