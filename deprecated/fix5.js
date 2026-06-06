const fs = require('fs');
let text = fs.readFileSync('erp/erp_app.js', 'utf8');

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

const regex = /dueDate:\s*document\.getElementB\s*return `[\s\S]*?─────────── \*\//;
text = text.replace(regex, goodChunk);

fs.writeFileSync('erp/erp_app.js', text, 'utf8');
console.log('Fixed CRM part 2');
