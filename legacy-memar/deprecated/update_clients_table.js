const fs = require('fs');
let content = fs.readFileSync('erp/erp_app.js', 'utf8');

const target = `        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center">#</th>
              <th>الاسم / الشركة التابع لها</th>
              <th>الهاتف</th>
              <th>التصنيف</th>
              <th>الارتباطات</th>
              <th>التقييم والملاحظات</th>
              <th>إجراءات</th>
            </tr>
          </thead>`;

const rep = `        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center">#</th>
              <th>الاسم / الشركة التابع لها</th>
              <th>معلومات التواصل</th>
              <th>الرقم المدني</th>
              <th>التصنيف</th>
              <th>الارتباطات</th>
              <th>التقييم والملاحظات</th>
              <th>إجراءات</th>
            </tr>
          </thead>`;

content = content.replace(target, rep);

const targetRows = `                <td dir="ltr" style="text-align:right">
                   \${c.phone||'—'}
                </td>
                <td><span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--bg-2); white-space:nowrap;">\${typeIcon} \${typeLbl}</span></td>`;

const repRows = `                <td dir="ltr" style="text-align:right">
                   <div style="font-weight:bold;">\${c.phone||'—'}</div>
                   \${c.email ? \`<div style="font-size:11px; color:var(--text-3); margin-top:2px;">\${c.email}</div>\` : ''}
                </td>
                <td style="font-family: monospace; font-size: 13px;">\${c.civilId || c.cv_civ || '—'}</td>
                <td><span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--bg-2); white-space:nowrap;">\${typeIcon} \${typeLbl}</span></td>`;

content = content.replace(targetRows, repRows);
content = content.replace('colspan="7"', 'colspan="8"');

fs.writeFileSync('erp/erp_app.js', content);
console.log('Fixed missing columns');
