const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Replace rTimelineTab and add new methods
const newTimelineLogic = `  rTimelineTab(p) {
    const tl = p.timeline || [];
    
    // Sort timeline descending by date (or ID if we add one)
    const sortedTl = [...tl].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const typeIcons = {
      created: {i:'🌟', c:'var(--primary)', b:'var(--primary-100)'},
      quotation: {i:'📄', c:'var(--info)', b:'var(--info-50)'},
      contract: {i:'✍️', c:'var(--purple)', b:'var(--purple-50)'},
      design_start: {i:'🎨', c:'var(--accent)', b:'var(--accent-light)'},
      client_approve: {i:'👍', c:'var(--success)', b:'var(--success-50)'},
      municipality: {i:'🏛️', c:'var(--warning)', b:'var(--warning-50)'},
      license: {i:'📜', c:'var(--success)', b:'var(--success-50)'},
      delivered: {i:'🎉', c:'var(--success)', b:'var(--success-50)'},
      custom: {i:'📌', c:'var(--text-3)', b:'var(--bg)'},
      status_change: {i:'🔄', c:'var(--primary)', b:'var(--bg)'}
    };

    let html = \`
<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--warning-50);color:var(--warning)">⏳</div>الجدول الزمني للأحداث</div>
    <button class="btn btn-outline btn-xs" onclick="Projects.addTimelineEvent(\${p.id})">+ إضافة حدث</button>
  </div>
  
  <style>
    .prj-tl { position:relative; padding-right:20px; margin-top:20px }
    .prj-tl::before { content:''; position:absolute; top:0; right:6px; bottom:0; width:2px; background:var(--divider) }
    .prj-tl-item { position:relative; margin-bottom:24px; display:flex; flex-direction:column; gap:4px }
    .prj-tl-icon { position:absolute; right:-20px; top:0; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; z-index:2; border:2px solid #fff }
    .prj-tl-content { padding:14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); margin-right:24px }
    .prj-tl-header { display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; color:var(--text-4) }
    .prj-tl-title { font-weight:700; color:var(--text); font-size:14px; margin-bottom:4px }
    .prj-tl-desc { color:var(--text-2); font-size:13px; line-height:1.5 }
  </style>

  <div class="prj-tl">
    \${sortedTl.length ? sortedTl.map(e => {
      const cfg = typeIcons[e.type] || typeIcons.custom;
      return \`
      <div class="prj-tl-item">
        <div class="prj-tl-icon" style="background:\${cfg.b}; color:\${cfg.c}">\${cfg.i}</div>
        <div class="prj-tl-content">
          <div class="prj-tl-header">
            <span>👤 بواسطة: \${e.user}</span>
            <span>\${e.date}</span>
          </div>
          <div class="prj-tl-title">\${e.title || 'حدث'}</div>
          \${e.note ? \`<div class="prj-tl-desc">\${e.note}</div>\` : ''}
        </div>
      </div>
      \`;
    }).join('') : \`<div class="empty" style="padding:40px"><p>لا توجد أحداث مسجلة بعد</p></div>\`}
  </div>
</div>
\`;
    return html;
  },

  addTimelineEvent(pid) {
    ERP.openModal('إضافة حدث زمني', \`
      <div class="fg">
        <label>نوع الحدث *</label>
        <select id="tl_type" class="prj-select" style="width:100%">
          <option value="custom">مخصص</option>
          <option value="quotation">إرسال عرض سعر</option>
          <option value="contract">توقيع العقد</option>
          <option value="design_start">بدء التصميم</option>
          <option value="client_approve">موافقة العميل</option>
          <option value="municipality">تقديم للبلدية</option>
          <option value="license">إصدار الرخصة</option>
          <option value="delivered">تسليم المشروع</option>
        </select>
      </div>
      <div class="fg">
        <label>عنوان الحدث *</label>
        <input id="tl_title" placeholder="مثال: تم الانتهاء من المخطط المبدئي">
      </div>
      <div class="fg">
        <label>التاريخ *</label>
        <input type="date" id="tl_date" value="\${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="fg">
        <label>التفاصيل / ملاحظات</label>
        <textarea id="tl_note" rows="3" placeholder="أضف تفاصيل الحدث..."></textarea>
      </div>
    \`, \`
      <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="Projects.saveTimelineEvent(\${pid})">حفظ الحدث</button>
    \`);
  },

  saveTimelineEvent(pid) {
    const type = document.getElementById('tl_type').value;
    const title = document.getElementById('tl_title').value.trim();
    const date = document.getElementById('tl_date').value;
    const note = document.getElementById('tl_note').value.trim();
    
    if (!title || !date) {
      if(typeof toast !== 'undefined') toast('يرجى إدخال عنوان الحدث والتاريخ', 'err');
      return;
    }

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.timeline) p.timeline = [];
    p.timeline.push({ 
      type, 
      title, 
      date, 
      note, 
      user: DATA.user?.name || 'مستخدم', 
      status: 'done' 
    });
    
    this.saveProjects(prj);
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast('تمت إضافة الحدث للجدول الزمني', 'success');
    this.rPView(pid);
  },
`;

const oldTimelinePlaceholderRegex = /  rTimelineTab\(p\) \{\s*return '<div class="card"><div class="empty" style="padding:40px"><p>الجدول الزمني \(سيتم برمجته في المرحلة 6\)<\/p><\/div><\/div>';\s*\},/;

if (oldTimelinePlaceholderRegex.test(code)) {
  code = code.replace(oldTimelinePlaceholderRegex, newTimelineLogic);
} else {
  console.log('❌ Could not find rTimelineTab placeholder to replace.');
}

// 2. Update chPS to auto-add timeline event
const chPSOld = `  chPS(id,st) {const prj=this.projects();const i=prj.findIndex(p=>p.id===id);if(i>=0){prj[i].status=st;this.saveProjects(prj);if(typeof toast !== 'undefined')toast('تم تحديث الحالة');}},`;
const chPSNew = `  chPS(id,st) {
    const prj = this.projects();
    const i = prj.findIndex(p => p.id === id);
    if (i >= 0) {
      const p = prj[i];
      const oldSt = p.status;
      p.status = st;
      
      // Auto-add timeline event for status change
      if (oldSt !== st) {
        if (!p.timeline) p.timeline = [];
        const stName = this.PSTAT[st]?.l || st;
        p.timeline.push({
          type: 'status_change',
          title: 'تغيير حالة المشروع',
          date: new Date().toISOString().split('T')[0],
          note: \`تم تغيير الحالة إلى: \${stName}\`,
          user: DATA.user?.name || 'مستخدم',
          status: 'done'
        });
      }
      
      this.saveProjects(prj);
      if(typeof toast !== 'undefined') toast('تم تحديث الحالة');
    }
  },`;

if(code.includes(chPSOld)) {
  code = code.replace(chPSOld, chPSNew);
  console.log('✅ Updated chPS to auto-add timeline event');
} else {
  // If it's already modified or formatted differently, let's try a regex
  const chPSRegex = /  chPS\(id,st\) \{[\s\S]*?this\.saveProjects\(prj\);if\(typeof toast !== 'undefined'\)toast\('تم تحديث الحالة'\);\}\},/;
  if(chPSRegex.test(code)) {
    code = code.replace(chPSRegex, chPSNew);
    console.log('✅ Updated chPS using regex');
  } else {
     console.log('❌ Could not find chPS to replace.');
  }
}


// 3. Optional: we can also add a creation event when saving a NEW project
// Let's modify saveProj to inject the creation event
const saveProjRegex = /const obj=\{id:editId\|\|this\.nid\(prj\).*?steps:ex\?\.steps\|\|\[\]\};/;
const saveProjMatch = code.match(saveProjRegex);
if(saveProjMatch) {
  const replacement = saveProjMatch[0].replace(
    /steps:ex\?\.steps\|\|\[\]\}/,
    `steps:ex?.steps||[], timeline:ex?.timeline||[{type:'created', title:'إنشاء المشروع', date:new Date().toISOString().split('T')[0], note:'تم فتح ملف المشروع', user:DATA.user?.name||'النظام', status:'done'}]}`
  );
  code = code.replace(saveProjRegex, replacement);
  console.log('✅ Updated saveProj to include initial timeline event');
}

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 6 applied successfully');
