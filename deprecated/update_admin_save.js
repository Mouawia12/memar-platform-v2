const fs = require('fs');
let content = fs.readFileSync('erp/erp_app.js', 'utf8');

const s = content.indexOf('saveAdminFollowUp(id) {');
const e = content.indexOf('openAddModal(id = null) {');
const target = content.substring(s, e);

const replacement = `saveAdminFollowUp(id) {
    const tag = document.getElementById('prof_eval_tag')?.value || '';
    const notes = document.getElementById('prof_eval_notes')?.value?.trim() || '';
    const score = parseInt(document.getElementById('prof_eval_score')?.value || '50', 10);
    
    const allC = this.getAllClients();
    const c = allC.find((x) => x.id === id);
    if (c) {
       if (c.evaluation !== tag || notes || c.eval_score !== score) {
         if (!c.eval_history) c.eval_history = [];
         const currentUser = (window.DATA && window.DATA.user) ? (window.DATA.user.full_name || window.DATA.user.name) : 'مسؤول النظام';
         c.eval_history.push({ eval_tag: tag, score: score, notes: notes, date: new Date().toISOString(), by: currentUser });
       }

       c.evaluation = tag;
       if(notes) c.admin_notes = notes;
       c.eval_score = score;
       
       const uIdx = (window.DB_TABLES && window.DB_TABLES.users) ? window.DB_TABLES.users.findIndex((u) => u.id === c.id) : -1;
       if (uIdx >= 0) {
           window.DB_TABLES.users[uIdx].evaluation = tag;
           window.DB_TABLES.users[uIdx].eval_score = score;
           if(notes) window.DB_TABLES.users[uIdx].admin_notes = notes;
           window.DB_TABLES.users[uIdx].eval_history = c.eval_history;
       }
       try { localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users)); } catch(e){}
       
       const oldLs = [];
       try { oldLs.push(...JSON.parse(localStorage.getItem('memar_crm_clients') || '[]')); } catch(e){}
       const ec = oldLs.find((xc) => xc.id === c.id);
       if (ec) {
           ec.evaluation = tag;
           ec.eval_score = score;
           if(notes) ec.admin_notes = notes;
           ec.eval_history = c.eval_history;
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       } else {
           oldLs.unshift({...c, source: 'admin_update'});
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       }
       
       if (typeof toast !== 'undefined') toast('تم حفظ التقييم والملاحظات بنجاح ✔');
       
       this.render();
    }
  },

  `;

content = content.replace(target, replacement);
fs.writeFileSync('erp/erp_app.js', content);
console.log('Updated saveAdminFollowUp');
