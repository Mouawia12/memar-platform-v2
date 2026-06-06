const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 1. Add one-time user role_id migration at the top
const newMigration = `
/* One-time: re-map user role_ids to match new RBAC schema */
if(!localStorage.getItem("memar_user_roles_v3")){
  try{
    var _users=JSON.parse(localStorage.getItem("memar_sys_users")||"[]");
    if(_users.length>0){
      var _roleMap={"R_ENGINEER":"R_ARCHITECT","R_USER":"R_SECRETARY","R_SALES":"R_FREELANCE_ENG","R_CLIENT":"R_CLIENT_INDV"};
      _users.forEach(function(u){if(u.role_id&&_roleMap[u.role_id])u.role_id=_roleMap[u.role_id];});
      localStorage.setItem("memar_sys_users",JSON.stringify(_users));
    }
  }catch(e){}
  localStorage.setItem("memar_user_roles_v3","1");
}
`;

const idx = c.indexOf('/* ── Monthly chart data ── */');
if(idx !== -1 && !c.includes('memar_user_roles_v3')) {
  c = c.slice(0, idx) + newMigration + c.slice(idx);
}

// 2. Fix the SchemaMigrator mapping
const oldPreserve = 'role_id: existing.role_id || u.role_id,';
const roleMapFn = `role_id: (function(rid){ var m={"R_ENGINEER":"R_ARCHITECT","R_USER":"R_SECRETARY","R_SALES":"R_FREELANCE_ENG","R_CLIENT":"R_CLIENT_INDV"}; return m[rid]||rid; })(existing.role_id || u.role_id),`;

if(c.includes(oldPreserve)) {
    c = c.replace(oldPreserve, roleMapFn);
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
console.log('User role_id migration added');
