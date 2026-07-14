const fs = require('fs');
const file = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js';
let c = fs.readFileSync(file, 'utf8');

const newCode = `  rProjects() {
    let prj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) prj = prj.filter(p=>p.emp?.includes(DATA.user.id));
    return \`<style id="prj-legacy-css">
/* --- NEW STYLES FROM IMAGE --- */
.tw { background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow-x:auto; overflow-y:hidden; box-shadow:0 1px 3px rgba(0,0,0,.05); margin-top:16px; }
.tw table { width: 100%; border-collapse: collapse; text-align: center; }
.tw th { background: #f8fafc; padding: 14px 10px; font-size: 13px; font-weight: 700; color: #64748b; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
.tw td { padding: 14px 10px; font-size: 13.5px; font-weight: 600; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.tw tr:last-child td { border-bottom: none; }
.tw tbody tr:hover { background: #f8fafc; }

/* Status Badges */
.sts { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; }
.sts::before { content: ''; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sp { background: #fff7ed; color: #ea580c; } .sp::before { background: #ea580c; } /* Waiting */
.sa { background: #eff6ff; color: #2563eb; } .sa::before { background: #2563eb; } /* Active */
.sr { background: #f3e8ff; color: #9333ea; } .sr::before { background: #9333ea; } /* Review */
.sd { background: #f0fdf4; color: #16a34a; } .sd::before { background: #16a34a; } /* Done */
.sc { background: #fef2f2; color: #dc2626; } .sc::before { background: #dc2626; } /* Cancelled */
.sh2{ background: #f1f5f9; color: #475569; } .sh2::before { background: #475569; } /* Hold */

/* Category Badge (Gold Outlined) */
.bdg { display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 20px; white-space: nowrap; }
.bgold2 { background: #fefce8; color: #a16207; border: 1px solid #fde047; }

/* Actions */
.tda { display: flex; gap: 8px; justify-content: center; align-items: center; }
.btn-act { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; padding: 0; }
.btn-act:hover { background: #f1f5f9; border-color: #cbd5e1; }
.btn-act svg { width: 14px; height: 14px; }
.act-eye { color: #475569; }
.act-edit { color: #ea580c; }
.act-del { color: #dc2626; }

/* Top controls */
.top-wrap { margin-bottom: 24px; }
.btn-back { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; float: left; }
.btn-back:hover { background: #e2e8f0; color: #0f172a; }

.top-bar { display: flex; align-items: center; justify-content: space-between; clear: both; padding-top: 10px; flex-wrap: wrap; gap: 14px; }
.top-title { font-size: 22px; font-weight: 900; color: #0f172a; }
.ctrls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; flex-direction: row-reverse; }

.ts-wrap { position: relative; }
.ts-wrap svg { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8; }
.ts { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px 8px 30px; font-size: 13px; color: #334155; width: 180px; transition: all 0.2s; outline: none; }
.tf { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #334155; transition: all 0.2s; outline: none; cursor: pointer; }
.tf:focus, .ts:focus { border-color: #94a3b8; background: #fff; box-shadow: 0 0 0 3px rgba(148,163,184,0.1); }

.btn-new { background: #1e293b; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; gap: 6px; }
.btn-new:hover { background: #0f172a; }

/* Progress bar */
.pb-wrap { display: flex; align-items: center; gap: 8px; justify-content: center; }
.pb-text { font-size: 11px; font-weight: 700; color: #94a3b8; min-width: 25px; text-align: left; }
.pb { width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
.pf { height: 100%; background: #1e293b; border-radius: 2px; }

/* Modals inputs */
.fg{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.fg label{font-size:11px;font-weight:700;color:var(--tx2)}
.fg input,.fg select,.fg textarea{background:var(--bg);border:1.5px solid var(--brd);border-radius:var(--rs);padding:8px 11px;color:var(--tx);font-size:12.5px;transition:all .2s;width:100%}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--navy);background:#fff;box-shadow:0 0 0 3px rgba(27,58,107,.07)}
.fr{display:grid;gap:12px;margin-bottom:0}.fr2{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.fr3{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}

.empty{text-align:center;padding:44px 20px;color:var(--mt)}
.ei{font-size:40px;margin-bottom:10px;opacity:.38}
</style>

<div class="top-wrap">
  <button class="btn-back" onclick="ERP.navigate('dashboard')">← رجوع</button>
  <div class="top-bar">
    <div class="top-title">المشاريع</div>
    <div class="ctrls">
      <button class="btn-new" onclick="Projects.mProj()">+ مشروع جديد</button>
      <div class="ts-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
        <input class="ts" id="pQ2" placeholder="بحث..." oninput="Projects.fProj()">
      </div>
      <select class="tf" id="pfCat2" onchange="Projects.fProj()">
        <option value="">كل الفئات</option>
        \${this.CATS.map(k=>\`<option value="\${k}">\${k}</option>\`).join('')}
      </select>
      <select class="tf" id="pfSt2" onchange="Projects.fProj()">
        <option value="">كل الحالات</option>
        \${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}">\${v.l}</option>\`).join('')}
      </select>
    </div>
  </div>
</div>

<div class="tw">
  <div style="overflow-x:auto">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>العميل</th>
          <th>الفئة</th>
          <th>الخدمة</th>
          <th>المسؤولون</th>
          <th>الإنجاز</th>
          <th>الحالة</th>
          <th>التاريخ</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody id="ptb">\${this.rPRows(prj)}</tbody>
    </table>
  </div>
</div>\`;
  },
  rPRows(prj) {
    if(!prj.length)return \`<tr><td colspan="9"><div class="empty"><div class="ei">📁</div><p>لا توجد مشاريع</p></div></td></tr>\`;
    return prj.map(p=>{
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      
      const svgEye = \`<svg class="act-eye" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>\`;
      const svgEdit = \`<svg class="act-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>\`;
      const svgDel = \`<svg class="act-del" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>\`;

      let formattedDate = '—';
      if (p.cAt) {
        try {
          const d = new Date(p.cAt);
          const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          formattedDate = \`\${d.getDate()} \${arMonths[d.getMonth()]} \${d.getFullYear()}\`;
        } catch(e){ formattedDate = p.cAt; }
      }

      return \`<tr>
        <td style="color:#94a3b8; font-size:12px">#\${p.id}</td>
        <td><b style="cursor:pointer; color:#1e293b" onclick="ERP.navigate('cview',{id:\${p.cId}})">\${p.cNm}</b></td>
        <td><span class="bdg bgold2">\${p.cat}</span></td>
        <td style="color:#475569; max-width:140px; white-space:normal">\${p.svc}</td>
        <td style="color:#64748b; font-size:12.5px; max-width:120px; white-space:normal">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—'}</td>
        <td>
          <div class="pb-wrap">
            <span class="pb-text">\${pg}%</span>
            <div class="pb"><div class="pf" style="width:\${pg}%"></div></div>
          </div>
        </td>
        <td>\${this.sBdg(p.status)}</td>
        <td style="color:#94a3b8; font-size:12.5px">\${formattedDate}</td>
        <td>
          <div class="tda">
            <button class="btn-act" onclick="Projects.delPr(\${p.id})">\${svgDel}</button>
            <button class="btn-act" onclick="Projects.mProj(null,\${p.id})">\${svgEdit}</button>
            <button class="btn-act" onclick="Projects.rPView(\${p.id})">\${svgEye}</button>
          </div>
        </td>
      </tr>\`;
    }).join('');
  },`;

let st = c.indexOf('  rProjects() {');
let en = c.indexOf('  fProj() {');
if(st > -1 && en > -1) {
  c = c.substring(0, st) + newCode + '\n' + c.substring(en);
  fs.writeFileSync(file, c);
  console.log('SUCCESS');
} else {
  console.log('FAILED TO FIND BOUNDS');
}
