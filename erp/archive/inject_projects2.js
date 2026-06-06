const fs = require('fs');
const path = require('path');
const erpAppPath = path.join(__dirname, 'erp_app.js');
let code = fs.readFileSync(erpAppPath, 'utf8');

code = code.replace(/const validPages = \['(dashboard[^']*)'/, 'const validPages = [\'$1\',\'projects2\'');
code = code.replace(/projects:'المشاريع',/, 'projects:\'المشاريع\', projects2:\'المشاريع 2\',');
code = code.replace(/projects:\s*\(\)\s*=>\s*Projects\.render\(\),/, 'projects:     () => Projects.render(),\n      projects2:    () => Projects2.render(),');

const p2 = `
const Projects2 = {
  PSTAT: {pending:{l:\'قيد الانتظار\',cl:\'sp\'},active:{l:\'نشط\',cl:\'sa\'},review:{l:\'مراجعة\',cl:\'sr\'},done:{l:\'منجز\',cl:\'sd\'},cancelled:{l:\'ملغي\',cl:\'sc\'},hold:{l:\'معلق\',cl:\'sh2\'}},
  CATS: [\'سكن خاص\',\'استثماري\',\'تجاري\',\'صناعي\',\'شاليه\',\'مزارع\',\'جهات حكومية\'],
  SVCS: {\'سكن خاص\':[\'ترخيص\',\'ترخيص هدم وبناء\',\'ترخيص اضافة وتعديل\',\'ترخيص زراعة/مظلات\',\'ترخيص ترميم\',\'اشراف تنفيذي\',\'تصميم معماري\',\'تصميم انشائي\',\'تصميم داخلي\'],\'استثماري\':[\'تصميم معماري\',\'تصميم انشائي\',\'ترخيص بناء\'],\'تجاري\':[\'تصميم معماري\',\'تصميم انشائي\',\'ترخيص بناء\']},
  PKGS: [{id:\'p1\',nm:\'الباكج البرونزي\',pr:550},{id:\'p2\',nm:\'الباكج الفضي\',pr:595},{id:\'p3\',nm:\'الباكج الذهبي\',pr:950},{id:\'p4\',nm:\'الباكج الماسي\',pr:1350}],
  PRICES: { \'سكن خاص\': { \'ترخيص\': {pr:150}, \'ترخيص هدم وبناء\': {pr: 250}, \'باقات\': {pr: null} } },
  projects() { return JSON.parse(localStorage.getItem(\'memar_projects2\') || \'[ ]\'); },
  saveProjects(prj) { localStorage.setItem(\'memar_projects2\', JSON.stringify(prj)); },
  clients() { return window.DB_TABLES && window.DB_TABLES.contacts ? window.DB_TABLES.contacts : []; },
  users() { return window.DB_TABLES && window.DB_TABLES.employees ? window.DB_TABLES.employees : []; },
  nid(arr) { return arr.length ? Math.max(...arr.map(x=>x.id||0))+1 : 1; },
  render() { const pg = document.getElementById(\'p-projects2\'); if(pg) pg.innerHTML = this.rProjects(); },
  rProjects() {
    let prj = this.projects();
    if([\'arch_eng\',\'struct_eng\',\'drafter\'].includes(DATA.user.role)) prj = prj.filter(p=>p.emp?.includes(DATA.user.id));
    return \`<button class="btn bo bsm" onclick="ERP.navigate(\'dashboard\')" style="margin-bottom:14px">← رجوع</button>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px"><div style="font-size:18px;font-weight:900">المشاريع 2</div><div style="display:flex;gap:7px;flex-wrap:wrap">
      <select class="form-input" style="height:38px" id="pfSt2" onchange="Projects2.fProj()"><option value="">كل الحالات</option>\${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}">\${v.l}</option>\`).join(\'\')}</select>
      <select class="form-input" style="height:38px" id="pfCat2" onchange="Projects2.fProj()"><option value="">كل الفئات</option>\${this.CATS.map(k=>\`<option value="\${k}">\${k}</option>\`).join(\'\')}</select>
      <input class="form-input" style="height:38px" id="pQ2" placeholder="🔍 بحث..." oninput="Projects2.fProj()">
      <button class="btn btn-primary" onclick="Projects2.mProj()">+ مشروع جديد</button>
    </div></div>
  <div class="tw"><div style="overflow-x:auto"><table><thead><tr><th>#</th><th>العميل</th><th>الفئة</th><th>الخدمة</th><th>المسؤولون</th><th>الإنجاز</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead><tbody id="ptb2">\${this.rPRows(prj)}</tbody></table></div></div>\`;
  },
  rPRows(prj) {
    if(!prj.length)return \`<tr><td colspan="9"><div class="empty"><div class="ei">📁</div><p>لا توجد مشاريع</p></div></td></tr>\`;
    return prj.map(p=>{
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      return \`<tr><td style="color:var(--text-3);font-size:11px">#\${p.id}</td><td><b style="cursor:pointer;color:var(--primary)" onclick="ERP.navigate(\'cview\',{id:\${p.cId}})">\${p.cNm}</b></td><td><span class="badge badge-gold" style="font-size:10px">\${p.cat}</span></td><td style="font-size:12px;max-width:150px">\${p.svc}</td><td style="font-size:11.5px;color:var(--text-2);max-width:110px">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join(\'، \')}</td><td><div style="display:flex;align-items:center;gap:5px"><div class="progress-bar" style="width:52px;height:6px;background:var(--border);border-radius:4px"><div class="progress-fill" style="width:\${pg}%;height:100%;background:var(--primary);border-radius:4px"></div></div><span style="font-size:10.5px;color:var(--text-3)">\${pg}%</span></div></td><td>\${this.sBdg(p.status)}</td><td style="font-size:11.5px;color:var(--text-3)">\${p.cAt||\'—\'}</td><td><div class="tda"><button class="btn btn-ghost btn-sm" onclick="Projects2.rPView(\${p.id})">👁</button><button class="btn btn-ghost btn-sm" onclick="Projects2.mProj(null,\${p.id})">✏️</button><button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Projects2.delPr(\${p.id})">🗑</button></div></td></tr>\`}).join(\'\');
  },
  fProj() {
    const q=document.getElementById(\'pQ2\')?.value.toLowerCase()||\'\',st=document.getElementById(\'pfSt2\')?.value||\'\',cat=document.getElementById(\'pfCat2\')?.value||\'\';
    let prj=this.projects();
    if([\'arch_eng\',\'struct_eng\',\'drafter\'].includes(DATA.user.role))prj=prj.filter(p=>p.emp?.includes(DATA.user.id));
    if(st)prj=prj.filter(p=>p.status===st);if(cat)prj=prj.filter(p=>p.cat===cat);
    if(q)prj=prj.filter(p=>p.cNm.toLowerCase().includes(q)||p.svc.toLowerCase().includes(q));
    document.getElementById(\'ptb2\').innerHTML=this.rPRows(prj);
  },
  mProj(preCId=null,editId=null) {
    const p=editId?this.projects().find(x=>x.id===editId):null;
    const cls=this.clients(),emps=this.users().filter(u=>[\'arch_eng\',\'struct_eng\',\'drafter\'].includes(u.role));
    ERP.openModal(p?\'تعديل المشروع\':\'إضافة مشروع جديد\',\`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px"><div class="form-group"><label>العميل *</label><select class="form-input" id="pcl2"><option value="">-- اختر --</option>\${cls.map(c=>\`<option value="\${c.id}" \${(preCId===c.id||p?.cId===c.id)?\'selected\':\'\'}>\${c.name}</option>\`).join(\'\')}</select></div><div class="form-group"><label>الفئة *</label><select class="form-input" id="pcat2" onchange="Projects2.onCatC()"><option value="">-- اختر --</option>\${this.CATS.map(k=>\`<option value="\${k}" \${p?.cat===k?\'selected\':\'\'}>\${k}</option>\`).join(\'\')}</select></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px"><div class="form-group"><label>الخدمة *</label><select class="form-input" id="psvc2" onchange="Projects2.onSvcC()">\${p?\`<option value="\${p.svc}" selected>\${p.svc}</option>\`:\'<option>-- اختر الفئة أولاً --</option>\'}</select></div><div class="form-group"><label>الحالة</label><select class="form-input" id="pst2">\${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}" \${p?.status===k?\'selected\':\'\'}>\${v.l}</option>\`).join(\'\')}</select></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px"><div class="form-group"><label>التكلفة (د.ك) *</label><input type="number" class="form-input" id="pcost2" step="0.01" value="\${p?.cost||\'\'}"><div class="hint" id="prH2"></div></div><div class="form-group"><label>المدفوع (د.ك)</label><input type="number" class="form-input" id="ppaid2" step="0.01" value="\${p?.paid||0}"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px"><div class="form-group"><label>تاريخ البدء</label><input type="date" class="form-input" id="psd2" value="\${p?.sDate||new Date().toISOString().split(\'T\')[0]}"></div><div class="form-group"><label>تاريخ التسليم</label><input type="date" class="form-input" id="ped2" value="\${p?.eDate||\'\'}"></div></div>
      <div class="form-group"><label>الموقع / القسيمة</label><input class="form-input" id="ploc2" value="\${p?.loc||\'\'}"></div>
      <div class="form-group"><label>المهندسون المسؤولون</label><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:3px">\${emps.map(e=>\`<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;background:var(--bg);padding:4px 9px;border-radius:6px;border:1.5px solid \${p?.emp?.includes(e.id)?\'var(--primary)\':\'var(--border)\'}"><input type="checkbox" name="pemp2" value="\${e.id}" \${p?.emp?.includes(e.id)?\'checked\':\'\'}> \${e.name}</label>\`).join(\'\')}</div></div>
      <div class="form-group"><label>ملاحظات</label><textarea class="form-input" id="pnotes2">\${p?.notes||\'\'}</textarea></div>
    \`,\`<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="Projects2.saveProj(\${editId||\'null\'})">حفظ</button>\`);
    if(p)setTimeout(()=>this.onCatC(p.svc),80);else setTimeout(()=>this.onCatC(),80);
  },
  onCatC(presvc=null) {
    const cat=document.getElementById(\'pcat2\')?.value,ss=document.getElementById(\'psvc2\');
    if(!ss||!cat||!this.SVCS[cat])return;
    ss.innerHTML=this.SVCS[cat].map(s=>\`<option value="\${s}" \${s===presvc?\'selected\':\'\'}>\${s}</option>\`).join(\'\');this.onSvcC();
  },
  onSvcC() {
    const cat=document.getElementById(\'pcat2\')?.value,svc=document.getElementById(\'psvc2\')?.value;
    const ci=document.getElementById(\'pcost2\'),h=document.getElementById(\'prH2\');
    if(!cat||!svc||!ci)return;
    if(svc===\'باقات\'&&cat===\'سكن خاص\'){
      if(h)h.innerHTML=\`<div style="margin-top:6px;font-size:11px;color:var(--info)">💡 اختر الباقة:</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">\${this.PKGS.map(pk=>\`<span class="badge badge-blue" style="cursor:pointer;padding:3px 8px" onclick="document.getElementById(\'pcost2\').value=\${pk.pr}">\${pk.nm} \${pk.pr}</span>\`).join(\'\')}</div>\`;
      return;
    }
    const pd=this.PRICES[cat]?.[svc];
    if(pd){
      if(pd.pr!=null&&(!ci.value||ci.value===\'0\'))ci.value=pd.pr;
      if(h)h.innerHTML=pd.pr!=null?\`<span style="color:var(--success);font-weight:700;font-size:11px">✓ سعر مقترح: \${pd.pr}</span>\`:\'\';
    }else if(h)h.innerHTML=\'\';
  },
  saveProj(editId) {
    const cId=document.getElementById(\'pcl2\').value,cat=document.getElementById(\'pcat2\').value,svc=document.getElementById(\'psvc2\').value,cost=parseFloat(document.getElementById(\\'pcost2\').value)||0;
    if(!cId||!cat||!svc||!cost){if(typeof toast !== \'undefined\')toast(\'يرجى ملء الحقول المطلوبة\',\'err\');return}
    const emp=[...document.querySelectorAll(\'input[name=pemp2]:checked\')].map(e=>e.value);
    const cl=this.clients().find(c=>c.id==cId),prj=this.projects(),ex=editId?prj.find(p=>p.id===editId):null;
    const obj={id:editId||this.nid(prj),cId,cNm:cl?cl.name:\'غير محدد\',cat,svc,status:document.getElementById(\'pst2\').value,emp,cost,paid:parseFloat(document.getElementById(\'ppaid2\').value)||0,sDate:document.getElementById(\'psd2\').value,eDate:document.getElementById(\'ped2\').value,loc:document.getElementById(\'ploc2\').value,notes:document.getElementById(\'pnotes2\').value,cAt:ex?.cAt||new Date().toISOString().split(\'T\')[0],docs:ex?.docs||[],steps:ex?.steps||[]};
    if(editId){const i=prj.findIndex(p=>p.id===editId);prj[i]=obj}else prj.push(obj);
    this.saveProjects(prj);ERP.closeModal();if(typeof toast !== \'undefined\')toast(editId?\'تم تعديل المشروع\':\'تمت إضافة المشروع\');this.render();
  },
  delPr(id) {if(!confirm(\'حذف هذا المشروع؟\'))return;this.saveProjects(this.projects().filter(p=>p.id!==id));if(typeof toast !== \'undefined\')toast(\'تم الحذف\',\'info\');this.render()},
  sBdg(status) {
    const s = this.PSTAT[status];
    if(!s) return status;
    const m = {sa:\'badge-green\',sp:\'badge-orange\',sr:\'badge-blue\',sd:\'badge-green\',sc:\'badge-red\',sh2:\'badge-gray\'};
    return \`<span class="badge \${m[s.cl]||\'badge-gray\'}">\${s.l}</span>\`;
  },
  rPView(id) {
    const p=this.projects().find(x=>x.id===id);if(!p)return;
    const pg=p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
    const html = \`<button class="btn btn-ghost btn-sm" onclick="Projects2.render()" style="margin-bottom:14px">← رجوع للمشاريع</button>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
  <div><div style="font-size:18px;font-weight:900">\${p.svc}</div><div style="display:flex;gap:6px;margin-top:5px"><span class="badge badge-gold">\${p.cat}</span>\${this.sBdg(p.status)}</div></div>
  <div style="display:flex;gap:7px;flex-wrap:wrap">
    <select class="form-input" style="padding:4px 8px;height:auto" onchange="Projects2.chPS(\${p.id},this.value)">\${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}" \${p.status===k?\'selected\':\'\'}>\${v.l}</option>\`).join(\'\')}</select>
    <button class="btn btn-ghost btn-sm" onclick="Projects2.mProj(null,\${p.id})">✏️ تعديل</button>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:14px">
  <div class="crm-card" style="padding:15px">
    <div style="font-weight:800;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px"><div style="background:var(--bg);width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center">📋</div> معلومات المشروع</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">👤 العميل</span><span style="cursor:pointer;color:var(--primary);font-weight:700" onclick="ERP.navigate(\'cview\',{id:\${p.cId}})">\${p.cNm}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">📍 الموقع</span><span style="font-weight:600">\${p.loc||\'—\'}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">📅 البدء</span><span style="font-weight:600">\${p.sDate||\'—\'}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">📅 التسليم</span><span style="font-weight:600">\${p.eDate||\'—\'}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">👷 المسؤولون</span><span style="font-weight:600">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join(\'، \')||\'—\'}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px"><span style="color:var(--text-3)">📝 ملاحظات</span><span style="font-weight:600">\${p.notes||\'—\'}</span></div>
  </div>
  <div class="crm-card" style="padding:15px">
    <div style="font-weight:800;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px"><div style="background:var(--success-10);width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center">📈</div> نسبة الإنجاز</div>
    <div style="text-align:center;margin:10px 0"><div style="font-size:48px;font-weight:900;color:var(--primary)">\${pg}%</div><div class="progress-bar" style="max-width:180px;margin:7px auto;height:10px;background:var(--border);border-radius:6px"><div class="progress-fill" style="width:\${pg}%;height:100%;background:var(--primary);border-radius:6px"></div></div><div style="font-size:11.5px;color:var(--text-3);margin-top:4px">\${p.steps?p.steps.filter(s=>s.ok).length:0} من \${p.steps?p.steps.length:0} خطوة مكتملة</div></div>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
  <div class="crm-card" style="padding:15px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><div style="background:var(--danger-10);width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center">📁</div> الوثائق المطلوبة</div><button class="btn btn-ghost btn-sm" onclick="Projects2.mAddDoc(\${p.id})">+ إضافة</button></div>
    <ul style="list-style:none;padding:0;margin:0">\${(p.docs||[]).map((d,i)=>\`<li style="padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;display:flex;align-items:center;gap:8px;cursor:pointer;background:\${d.ok?\'var(--success-10)\':\'var(--bg)\'}" onclick="Projects2.toggleDoc(\${p.id},\${i})"><div style="width:16px;height:16px;border-radius:3px;border:1.5px solid \${d.ok?\'var(--success)\':\'var(--text-4)\'};display:flex;align-items:center;justify-content:center;color:var(--success);font-size:10px;font-weight:bold">\${d.ok?\'✓\':\'\'}</div><div style="font-size:12px;font-weight:600;color:\${d.ok?\'var(--success)\':\'var(--text)\'};text-decoration:\${d.ok?\'line-through\':\'\'}">\${d.n}</div></li>\`).join(\'\')}</ul>
  </div>
  <div class="crm-card" style="padding:15px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><div style="background:var(--warning-10);width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center">📋</div> خطوات التنفيذ</div><button class="btn btn-ghost btn-sm" onclick="Projects2.mAddStep(\${p.id})">+ إضافة</button></div>
    <ol style="list-style:none;padding:0;margin:0">\${(p.steps||[]).map((s,i)=>\`<li style="padding:8px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;cursor:pointer;background:\${s.ok?\'var(--success-10)\':\'var(--bg)\'}" onclick="Projects2.toggleStep(\${p.id},\${i})"><div style="width:18px;height:18px;border-radius:50%;background:\${s.ok?\'var(--success)\':\'var(--border)\'};color:\${s.ok?\'#fff\':\'var(--text-3)\'};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;margin-top:2px">\${s.ok?\'✓\':i+1}</div><div><div style="font-size:12px;font-weight:600;color:\${s.ok?\'var(--success)\':\'var(--text)\'}">\${s.t}</div>\${s.dt?\`<div style="font-size:10px;color:var(--text-4);margin-top:2px">\${s.dt}</div>\`:\`\`}</div></li>\`).join(\'\')}</ol>
  </div>
</div>\`;
    document.getElementById(\'p-projects2\').innerHTML = html;
  },
  chPS(id,st) {const prj=this.projects();const i=prj.findIndex(p=>p.id===id);if(i>=0){prj[i].status=st;this.saveProjects(prj);if(typeof toast !== \'undefined\')toast(\'تم تحديث الحالة\');}},
  toggleDoc(pid,i) {const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p&&p.docs[i]){p.docs[i].ok=!p.docs[i].ok;this.saveProjects(prj);this.rPView(pid)}},
  toggleStep(pid,i) {const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p&&p.steps[i]){p.steps[i].ok=!p.steps[i].ok;if(p.steps[i].ok)p.steps[i].dt=new Date().toISOString().split(\'T\')[0];this.saveProjects(prj);this.rPView(pid)}},
  mAddDoc(pid) {ERP.openModal(\'إضافة وثيقة\',\`<div class="form-group"><label>اسم الوثيقة *</label><input class="form-input" id="docn" placeholder="مثال: الوثيقة، المدنيات..."></div>\`,\`<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="Projects2.saveDoc(\${pid})">حفظ</button>\`)},
  saveDoc(pid) {const n=document.getElementById(\'docn\').value.trim();if(!n)return;const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p){if(!p.docs)p.docs=[];p.docs.push({n,ok:false});this.saveProjects(prj);ERP.closeModal();this.rPView(pid)}},
  mAddStep(pid) {ERP.openModal(\\'إضافة خطوة\',\`<div class="form-group"><label>نص الخطوة *</label><input class="form-input" id="stept" placeholder="مثال: تقديم الأوراق..."></div>\`,\`<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="Projects2.saveStep(\${pid})">حفظ</button>\`)},
  saveStep(pid) {const t=document.getElementById(\'stept\').value.trim();if(!t)return;const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p){if(!p.steps)p.steps=[];p.steps.push({t,ok:false,dt:null});this.saveProjects(prj);ERP.closeModal();this.rPView(pid)}}
};
`;

code = code.replace(/const Tasks = \{/, p2 + '\n\nconst Tasks = {');
fs.writeFileSync(erpAppPath, code);
console.log('Injected Projects2');
