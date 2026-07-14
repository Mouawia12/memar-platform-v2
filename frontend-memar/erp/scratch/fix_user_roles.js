const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// ─── Fix 1: Add one-time migration at top of file to remap old role IDs ───
const topComment = '/* One-time migration: clear stale roles cache to load new 16-role RBAC schema */';
const migrationBlock = `/* One-time migration: clear stale roles + remap user role_ids */
if(!localStorage.getItem("memar_rbac_v4")){
  localStorage.removeItem("memar_sys_roles");
  try{
    var _u=JSON.parse(localStorage.getItem("memar_sys_users")||"[]");
    var _m={"R_ENGINEER":"R_ARCHITECT","R_USER":"R_SECRETARY","R_SALES":"R_FREELANCE_ENG","R_CLIENT":"R_CLIENT_INDV"};
    _u.forEach(function(x){if(x.role_id&&_m[x.role_id])x.role_id=_m[x.role_id];});
    if(_u.length)localStorage.setItem("memar_sys_users",JSON.stringify(_u));
  }catch(e){}
  localStorage.setItem("memar_rbac_v4","1");
}`;

if (c.includes(topComment)) {
  // Replace old migration with new comprehensive one
  const oldLine = c.substring(c.indexOf(topComment), c.indexOf('\n', c.indexOf('memar_roles_v3_migrated') + 30) + 1);
  c = c.replace(oldLine, migrationBlock + '\n');
  console.log('Replaced old migration with v4');
} else {
  // Insert at top before the first comment
  c = migrationBlock + '\n' + c;
  console.log('Inserted v4 migration at top');
}

// ─── Fix 2: Fix SchemaMigrator role_id mapping for employees ───
const oldMapping = "role_id: ({'هندسي':'R_ARCHITECT','إنشائي':'R_STRUCTURAL','إداري':'R_ADMIN','مالي':'R_FINANCE','سكرتارية':'R_SECRETARY','engineering':'R_ARCHITECT','structural':'R_STRUCTURAL','management':'R_ADMIN','finance':'R_FINANCE','secretary':'R_SECRETARY','admin':'R_ADMIN'}[e.dept] || 'R_ARCHITECT')";
if (c.includes(oldMapping)) {
  console.log('Smart dept mapping already in place');
} else {
  // Check for old generic mapping
  const genericMapping = "role_id: e.dept ? 'R_' + e.dept.toUpperCase() : 'R_USER'";
  if (c.includes(genericMapping)) {
    c = c.replace(genericMapping, oldMapping);
    console.log('Fixed generic dept mapping');
  } else {
    console.log('Dept mapping already fixed or not found');
  }
}

// ─── Fix 3: Ensure stored user role_id also gets remapped during merge ───
const preserveLine = "role_id: existing.role_id || u.role_id,";
if (c.includes(preserveLine)) {
  const fixedPreserve = `role_id: (function(rid){var m={"R_ENGINEER":"R_ARCHITECT","R_USER":"R_SECRETARY","R_SALES":"R_FREELANCE_ENG","R_CLIENT":"R_CLIENT_INDV"};return m[rid]||rid;})(existing.role_id||u.role_id),`;
  c = c.replace(preserveLine, fixedPreserve);
  console.log('Fixed user merge role_id mapping');
} else {
  console.log('User merge already fixed or not found');
}

// ─── Fix 4: Also remap role_id='R_CLIENT' in contacts sync ───
// Multiple places assign R_CLIENT to contacts — fix them all
let count = 0;
while (c.includes("role_id: 'R_CLIENT',")) {
  c = c.replace("role_id: 'R_CLIENT',", "role_id: 'R_CLIENT_INDV',");
  count++;
}
console.log('Fixed R_CLIENT references:', count);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
console.log('All fixes applied successfully');
