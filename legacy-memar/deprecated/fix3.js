const fs = require('fs');
let text = fs.readFileSync('erp/erp_app.js', 'utf8');

const badChunk = `    dueDate:    document.getEle      return \`
      <tr style="border-bottom:1px solid #f1f5f9; transition:all 0.2s; cursor:pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'" onclick="Projects.showDetail('\${p.id}')">
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
      </tr>\`;─────────── */`;

const goodChunk = `    dueDate:    document.getElementById('tsk_d')?.value,
    priority:   document.getElementById('tsk_p')?.value,
    done:       false,
    by:         parseInt(document.getElementById('tsk_by')?.value)||0,
    assignedTo: parseInt(document.getElementById('tsk_ass')?.value)||0,
    createdAt:  today(),
  });
  DB.s('tasks', tasks);
  ERP.closeModal();
  updBadges();
  if (S.sec==='lead_view') go('lead_view',{id:lId});
  else CRMTasks.render();
}

function toggleTask(id) {
  const tasks = DB.tasks();
  const i = tasks.findIndex(t=>t.id===id);
  if (i >= 0) {
    tasks[i].done = !tasks[i].done;
    DB.s('tasks', tasks);
    updBadges();
    if (S.sec==='lead_view') go('lead_view',{id:S.params.id});
    else CRMTasks.render();
  }
}

function delTask(id) {
  DB.s('tasks', DB.tasks().filter(t=>t.id!==id));
  updBadges();
  if (S.sec==='lead_view') go('lead_view',{id:S.params.id});
  else CRMTasks.render();
}

function nWALead(id) {
  const l = DB.leads().find(x=>x.id===id);
  if (!l?.whatsapp) { alert('لا يوجد رقم واتساب'); return; }
  const msg = encodeURIComponent(\`السلام عليكم \${l.name} 👋\\nشكراً لاستفساركم، يسعدنا خدمتكم في مجموعة معمار للاستشارات الهندسية.\\nكيف يمكننا مساعدتكم؟ 🏛️\`);
  window.open(\`https://wa.me/965\${l.whatsapp}?text=\${msg}\`, '_blank');
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'whatsapp',note:'تم إرسال رسالة واتساب',date:today(),by:S.user.id});
  DB.s('activities', acts);
}

function nEmLead(id) {
  const l = DB.leads().find(x=>x.id===id);
  if (!l?.email) return;
  const sub  = encodeURIComponent('مجموعة معمار للاستشارات الهندسية');
  const mbody = encodeURIComponent(\`السلام عليكم \${l.name},\\n\\nشكراً لتواصلكم معنا.\\nيسعدنا خدمتكم في مجموعة معمار للاستشارات الهندسية. 🏛️\`);
  window.open(\`mailto:\${l.email}?subject=\${sub}&body=\${mbody}\`, '_blank');
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'email',note:'تم إرسال بريد إلكتروني',date:today(),by:S.user.id});
  DB.s('activities', acts);
}

/* ───────────────────────────────────────────────────────
   MODULE: AUDIT & DATA INTEGRITY
─────────────────────────────────────────────────────── */`;

// Replace standard spaces
text = text.replace(badChunk, goodChunk);

// If not found, let's try to find exactly what's there between dueDate and MODULE: AUDIT
const regex = /dueDate:\s*document\.getEle\s*return `[\s\S]*?─────────── \*\//;
text = text.replace(regex, goodChunk);

fs.writeFileSync('erp/erp_app.js', text, 'utf8');
console.log('Fixed CRM');
