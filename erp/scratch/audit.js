const fs = require('fs');
const c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const lines = c.split(/\r?\n/);

const keywords = ['Roles.render', 'renderUsersTab', 'renderRolesTab', 'p-roles', 'p-users', 'user_logs', 'UserManagement', 'UsersPage', 'editUser', 'openUserModal', 'sectionId', 'sidebar', 'showSection'];
keywords.forEach(kw => {
  let found = false;
  lines.forEach((line, i) => {
    if(line.includes(kw)) {
      console.log('L' + (i+1) + ' [' + kw + ']: ' + line.substring(0, 150).trim());
      found = true;
    }
  });
  if(!found) console.log('[' + kw + ']: NOT FOUND');
  console.log('---');
});
