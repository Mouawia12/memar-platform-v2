const fs = require('fs');
let text = fs.readFileSync('erp/erp_app.js', 'utf8');

const regex = /<tr style="border-bottom:1px solid #f1f5f9; transition:all 0\.2s; cursor:pointer;" onmouseover="this\.style\.background='#f8fafc'" onmouseout="this\.style\.background='transparent'" onclick="Projects\.showDetail\('\\\${p\.id}'\)">[\s\S]*?<\/tr>\\`;/;

const goodChunk = `<tr style="border-bottom:1px solid #f1f5f9; transition:all 0.2s; cursor:pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'" onclick="Projects.showDetail('\${p.id}')">
        <td style="padding:16px; color:#94a3b8; font-size:13px; font-weight:500;">#\${index + 1}</td>
        <td style="padding:16px; font-weight:700; color:#1e293b; font-size:14px;">\${cname}</td>
        <td style="padding:16px; text-align:center;"><span style="\${catStyle}">\${ptype === 'سكني' ? 'سكن خاص' : ptype}</span></td>
        <td style="padding:16px; color:#64748b; font-size:13px; text-align:center;">\${pname}</td>
        <td style="padding:16px; color:#94a3b8; font-size:12px; text-align:center;">\${mname}</td>
        <td style="padding:16px;">
          <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
            <span style="font-size:11px; color:#94a3b8; width:28px; text-align:left;">\${prog}%</span>
            <div style="width:60px; height:4px; background:#e2e8f0; border-radius:2px; overflow:hidden;">
              <div style="width:\${prog}%; height:100%; background:#1e293b; border-radius:2px;"></div>
            </div>
          </div>
        </td>
        <td style="padding:16px; text-align:center;">\${statusBadge}</td>
        <td style="padding:16px; color:#94a3b8; font-size:13px; text-align:center;">\${dateStr}</td>
        <td style="padding:16px; text-align:center;">
          <div style="display:flex; gap:6px; justify-content:center;">
            <button onclick="Projects.deleteProject('\${p.id}'); event.stopPropagation();" style="width:28px; height:28px; border-radius:6px; border:1px solid #fee2e2; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px;" title="حذف">🗑️</button>
            <button onclick="Projects.editProject('\${p.id}'); event.stopPropagation();" style="width:28px; height:28px; border-radius:6px; border:1px solid #ffedd5; background:#fff7ed; color:#f97316; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px;" title="تعديل">✏️</button>
            <button onclick="Projects.showDetail('\${p.id}'); event.stopPropagation();" style="width:28px; height:28px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; color:#64748b; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px;" title="عرض">👁️</button>
          </div>
        </td>
      </tr>\`;`;

text = text.replace(regex, goodChunk);

// And fix statusBadge
text = text.replace(/const statusBadge = \\`<div/g, 'const statusBadge = `<div');
text = text.replace(/\\`\${stLabel}div>\\`;/g, '`${stLabel}</div>`;'); // wait, safer approach:

const badgeRegex = /const statusBadge = \\\`<div style="display:inline-flex; align-items:center; gap:6px; background:\\\${stBg}; color:\\\${stColor}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;"><div style="width:6px; height:6px; border-radius:50%; background:\\\${stDot};"><\/div>\\\${stLabel}<\/div>\\\`;/;
const badgeGood = 'const statusBadge = `<div style="display:inline-flex; align-items:center; gap:6px; background:${stBg}; color:${stColor}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;"><div style="width:6px; height:6px; border-radius:50%; background:${stDot};"></div>${stLabel}</div>`;';

text = text.replace(badgeRegex, badgeGood);

// And fix return `
const returnRegex = /return \\\`\s*<tr style=/;
text = text.replace(returnRegex, 'return `\n      <tr style=');

// Fix no projects
const emptyRegex = /if\(\!projects \|\| projects\.length === 0\) return \\\`<tr><td colspan="9" style="text-align:center; padding:30px; color:#94a3b8;">لا توجد مشاريع<\/td><\/tr>\\\`;/;
const emptyGood = 'if(!projects || projects.length === 0) return `<tr><td colspan="9" style="text-align:center; padding:30px; color:#94a3b8;">لا توجد مشاريع</td></tr>`;';
text = text.replace(emptyRegex, emptyGood);


fs.writeFileSync('erp/erp_app.js', text, 'utf8');
console.log('Fixed renderTable backticks');
