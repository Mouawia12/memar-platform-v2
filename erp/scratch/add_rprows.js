const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const marker = "  mProj(preCId=null,editId=null) {";
const idx = code.indexOf(marker);
if (idx === -1) { console.log('ERROR: marker not found'); process.exit(1); }

const rPRowsCode = `  rPRows(prj) {
    if(!prj.length) return '<tr><td colspan="9"><div class="prj-empty"><div class="prj-empty-icon">📁</div><p>لا توجد مشاريع</p></div></td></tr>';
    return prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      return \`<tr onclick="Projects.rPView(\${p.id})">
        <td style="color:var(--text-4);font-size:12px">#\${p.id}</td>
        <td><b style="cursor:pointer;color:var(--text)" onclick="event.stopPropagation();ERP.navigate('cview',{id:\${p.cId}})">\${p.cNm}</b></td>
        <td><span class="prj-cat-badge">\${p.cat}</span></td>
        <td style="color:var(--text-2);max-width:140px;white-space:normal">\${p.svc}</td>
        <td style="color:var(--text-3);font-size:12px;max-width:120px;white-space:normal">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—'}</td>
        <td><div style="display:flex;align-items:center;gap:8px;justify-content:center"><span style="font-size:11px;font-weight:700;color:var(--text-4);min-width:25px;text-align:left">\${pg}%</span><div class="prj-pb"><div class="prj-pf" style="width:\${pg}%"></div></div></div></td>
        <td>\${this.sBdg2(p.status)}</td>
        <td style="color:var(--text-4);font-size:12.5px">\${fd}</td>
        <td><div class="prj-tda">
          <button class="prj-act del" onclick="Projects.delPr(\${p.id});event.stopPropagation()" title="حذف">🗑️</button>
          <button class="prj-act edit" onclick="Projects.mProj(null,\${p.id});event.stopPropagation()" title="تعديل">✏️</button>
          <button class="prj-act view" onclick="Projects.rPView(\${p.id});event.stopPropagation()" title="عرض">👁️</button>
        </div></td>
      </tr>\`;
    }).join('');
  },
`;

code = code.substring(0, idx) + rPRowsCode + code.substring(idx);
fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ rPRows added successfully');
