const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

const fixBlock = `        \${this.state.selectedUsers.length > 0 ? 
      '<div style="background:#e0f2fe; border:1px solid #bae6fd; padding:10px 15px; border-radius:8px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">' +
         '<div style="font-weight:bold; color:#0369a1;">تم تحديد ' + this.state.selectedUsers.length + ' مستخدم (إجراء جماعي)</div>' +
         '<div style="display:flex; gap:10px;">' +
            '<button class="btn btn-sm btn-outline" style="color:var(--success); border-color:var(--success)" onclick="UserLogs.bulkAction(\\'activate\\')">تنشيط</button>' +
            '<button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger)" onclick="UserLogs.bulkAction(\\'suspend\\')">إيقاف</button>' +
            '<button class="btn btn-sm btn-outline" style="background:var(--danger); color:white; border:none;" onclick="UserLogs.bulkAction(\\'delete\\')">حذف منطقي</button>' +
         '</div>' +
      '</div>'
       : ''}
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; width:40px; text-align:center;"><input type="checkbox" onchange="UserLogs.selectAll(this.checked, [' + paginatedList.map(u=>"'"+u.id+"'").join(',') + '])"></th>`;

lines.splice(7208, 14, ...fixBlock.split('\n'));

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
