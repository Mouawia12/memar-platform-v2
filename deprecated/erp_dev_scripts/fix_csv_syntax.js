const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

// the bad line is at index 7036
lines[7036] = "      csv += `${u.id},${u.full_name},${u.email},${u.phone},${u.account_type},${u.role_id},${u.status},${u.created_at.split('T')[0]}\\n`;";

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
