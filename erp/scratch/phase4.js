const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Add _activeViewTab state
if(!code.includes('_activeViewTab')) {
  code = code.replace(
    /_view: localStorage.getItem\('prj_view'\) \|\| 'table',/,
    "_view: localStorage.getItem('prj_view') || 'table',\n  _activeViewTab: 'overview',"
  );
}

// 2. Add changeTab method
const changeTabMethod = `  changeTab(tab, id) {
    this._activeViewTab = tab;
    this.rPView(id);
  },
  rTimelineTab(p) {
    return '<div class="card"><div class="empty" style="padding:40px"><p>الجدول الزمني (سيتم برمجته في المرحلة 6)</p></div></div>';
  },
  rFinanceTab(p) {
    return '<div class="card"><div class="empty" style="padding:40px"><p>النظام المالي (سيتم برمجته في المرحلة 5)</p></div></div>';
  },
  rInternalTab(p) {
    return '<div class="card"><div class="empty" style="padding:40px"><p>الملاحظات الداخلية (سيتم برمجته في المرحلة 7)</p></div></div>';
  },
`;
if(!code.includes('changeTab(tab, id)')) {
  code = code.replace(/  chPS\(id,st\) \{/g, changeTabMethod + '  chPS(id,st) {');
}

// 3. Replace rPView using regex to match the exact block
const rPViewRegex = /  rPView\(id\) \{[\s\S]*?const pgEl = document\.getElementById\('p-projects'\);\s*if\(pgEl\) pgEl\.innerHTML = html;\s*\}/;

const newRPView = `  rPView(id) {
    const p=this.projects().find(x=>x.id===id);if(!p)return;
    const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
    
    // Header
    const html = \`<button class="btn bo bsm" onclick="Projects.render()" style="margin-bottom:14px;border:none;background:var(--bg);padding:6px 12px;border-radius:6px;font-weight:700">← رجوع للمشاريع</button>
<div style="background:var(--bg-card);padding:20px;border-radius:var(--r-lg);box-shadow:var(--sh-sm);margin-bottom:20px;border:1px solid var(--border)">
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:22px;font-weight:900;color:var(--text)">\${p.svc}</div>
        \${this.sBdg2(p.status)}
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;color:var(--text-3);font-size:13px;align-items:center">
        <span style="display:flex;align-items:center;gap:4px">👤 \${p.cNm}</span>
        <span style="color:var(--border)">|</span>
        <span style="display:flex;align-items:center;gap:4px">🏷️ \${p.cat}</span>
        \${p.loc ? \`<span style="color:var(--border)">|</span><span style="display:flex;align-items:center;gap:4px">📍 \${p.loc}</span>\` : ''}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select class="prj-select" onchange="Projects.chPS(\${p.id},this.value)" style="background:var(--bg);min-width:140px">\${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}" \${p.status===k?'selected':''}>\${v.l}</option>\`).join('')}</select>
      <button class="btn btn-primary" onclick="Projects.mProj(null,\${p.id})">✏️ تعديل المشروع</button>
      <button class="btn btn-outline" onclick="window.print()" title="طباعة">🖨️</button>
      <button class="btn btn-ghost" onclick="Projects.delPr(\${p.id})" style="color:var(--danger)" title="حذف">🗑️</button>
    </div>
  </div>
</div>

<style>
.prj-tabs { display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;overflow-x:auto;padding-bottom:2px }
.prj-tab { padding:10px 16px;background:none;border:none;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--text-4);cursor:pointer;border-radius:6px 6px 0 0;white-space:nowrap;transition:0.2s }
.prj-tab:hover { color:var(--text-2);background:var(--bg) }
.prj-tab.active { color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-4px }
</style>

<div class="prj-tabs">
  <button class="prj-tab \${this._activeViewTab==='overview'?'active':''}" onclick="Projects.changeTab('overview', \${p.id})">📊 نظرة عامة</button>
  <button class="prj-tab \${this._activeViewTab==='timeline'?'active':''}" onclick="Projects.changeTab('timeline', \${p.id})">⏳ الجدول الزمني</button>
  <button class="prj-tab \${this._activeViewTab==='tasks'?'active':''}" onclick="Projects.changeTab('tasks', \${p.id})">📋 المهام والوثائق</button>
  <button class="prj-tab \${this._activeViewTab==='finance'?'active':''}" onclick="Projects.changeTab('finance', \${p.id})">💰 المالية</button>
  \${DATA.user.role === 'admin' || DATA.user.role === 'owner' ? \`<button class="prj-tab \${this._activeViewTab==='internal'?'active':''}" onclick="Projects.changeTab('internal', \${p.id})">🔒 الملاحظات الداخلية</button>\` : ''}
</div>

<div class="prj-tab-content">
\`;

    let tabHtml = '';
    
    // ------------------------------------
    // TAB: OVERVIEW
    // ------------------------------------
    if(this._activeViewTab === 'overview') {
      tabHtml = \`
<div class="g2" style="margin-bottom:14px">
  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--navy-50);color:var(--navy)">📋</div>معلومات المشروع</div>
    <div class="ir"><span class="il">العميل</span><span class="iv" style="cursor:pointer;color:var(--navy);font-weight:700" onclick="ERP.navigate('cview',{id:\${p.cId}})">\${p.cNm}</span></div>
    <div class="ir"><span class="il">الموقع</span><span class="iv">\${p.loc||'—'}</span></div>
    <div class="ir"><span class="il">تاريخ البدء</span><span class="iv">\${p.sDate||'—'}</span></div>
    <div class="ir"><span class="il">تاريخ التسليم</span><span class="iv"><b style="color:\${p.eDate&&p.eDate<new Date().toISOString().split('T')[0]?'var(--danger)':'var(--text)'}">\${p.eDate||'—'}</b>\${p.eDate&&p.eDate<new Date().toISOString().split('T')[0]?'<span class="badge badge-red" style="font-size:10px;margin-right:5px">متأخر</span>':''}</span></div>
    <div class="ir"><span class="il">المسؤولون</span><span class="iv">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—'}</span></div>
    <div class="ir"><span class="il">ملاحظات</span><span class="iv">\${p.notes||'—'}</span></div>
  </div>
  
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="card" style="border:1px solid var(--border)">
      <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--success-50);color:var(--success)">📈</div>الإنجاز والتنفيذ</div>
      <div style="text-align:center;margin:10px 0"><div style="font-size:36px;font-weight:900;color:var(--text)">\${pg}%</div><div class="prj-pb" style="max-width:200px;margin:7px auto;height:10px"><div class="prj-pf" style="width:\${pg}%"></div></div><div style="font-size:12px;color:var(--text-3);margin-top:6px">\${p.steps?p.steps.filter(s=>s.ok).length:0} من \${p.steps?p.steps.length:0} خطوة مكتملة</div></div>
    </div>
    
    <div class="card" style="border:1px solid var(--border);background:var(--primary-50)">
      <div class="ct" style="margin-bottom:12px"><div class="cti" style="background:var(--primary-100);color:var(--primary)">💰</div>ملخص مالي سريع</div>
      <div style="display:flex;justify-content:space-between;padding:0 10px">
        <div><div style="font-size:11px;color:var(--text-3)">قيمة العقد</div><div style="font-size:16px;font-weight:bold;color:var(--text)">\${p.cost||0} د.ك</div></div>
        <div><div style="font-size:11px;color:var(--text-3)">المدفوع</div><div style="font-size:16px;font-weight:bold;color:var(--success)">\${p.paid||0} د.ك</div></div>
        <div><div style="font-size:11px;color:var(--text-3)">المتبقي</div><div style="font-size:16px;font-weight:bold;color:\${(p.cost||0)-(p.paid||0)>0?'var(--danger)':'var(--text)'}">\${(p.cost||0)-(p.paid||0)} د.ك</div></div>
      </div>
    </div>
  </div>
</div>\`;
    }
    // ------------------------------------
    // TAB: TASKS
    // ------------------------------------
    else if(this._activeViewTab === 'tasks') {
      tabHtml = \`
<div class="g2">
  <div class="card" style="border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)"><div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--danger-50);color:var(--danger)">📁</div>الوثائق المطلوبة</div><button class="btn btn-outline btn-xs" onclick="Projects.mAddDoc(\${p.id})">+ إضافة وثيقة</button></div>
    <ul class="cl">\${(p.docs||[]).map((d,i)=>\`<li class="\${d.ok?'ck':''}" onclick="Projects.toggleDoc(\${p.id},\${i})" style="padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:6px"><div class="chk">\${d.ok?'✓':''}</div>\${d.n}</li>\`).join('')}</ul>
    \${!(p.docs&&p.docs.length)?'<div class="empty" style="padding:14px"><p>لا توجد وثائق</p></div>':''}
  </div>
  <div class="card" style="border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)"><div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--purple-50);color:var(--purple)">📋</div>خطوات التنفيذ</div><button class="btn btn-outline btn-xs" onclick="Projects.mAddStep(\${p.id})">+ إضافة خطوة</button></div>
    <ol class="cl">\${(p.steps||[]).map((s,i)=>\`<li class="\${s.ok?'ck':''}" onclick="Projects.toggleStep(\${p.id},\${i})" style="padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:6px"><div class="chk">\${s.ok?'✓':i+1}</div><div><div style="font-weight:600">\${s.t}</div>\${s.dt?\`<div style="font-size:11px;color:var(--text-4);margin-top:2px">\${s.dt}</div>\`:\`\`}</div></li>\`).join('')}</ol>
    \${!(p.steps&&p.steps.length)?'<div class="empty" style="padding:14px"><p>لا توجد خطوات</p></div>':''}
  </div>
</div>\`;
    }
    else if(this._activeViewTab === 'timeline') {
      tabHtml = this.rTimelineTab(p);
    }
    else if(this._activeViewTab === 'finance') {
      tabHtml = this.rFinanceTab(p);
    }
    else if(this._activeViewTab === 'internal') {
      tabHtml = this.rInternalTab(p);
    }

    const pgEl = document.getElementById('p-projects');
    if(pgEl) pgEl.innerHTML = html + tabHtml + '</div>';
  }`;

if(rPViewRegex.test(code)) {
  code = code.replace(rPViewRegex, newRPView);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ Phase 4 applied successfully');
} else {
  console.log('❌ Could not find rPView with regex to replace.');
}
