const fs = require('fs');
let c = fs.readFileSync('erp.js', 'utf8');
c = c.replace(/DB\.s\('activities', acts\);\n/, "DB.s('activities', acts);\n    Notifications.trigger('crm_status_changed', {name: leads[i].name}, {n: leadStage(stage).l});\n");
fs.writeFileSync('erp.js', c);
console.log('done fixing notifications trigger in dropLead');
