const fs = require('fs');
let txt = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 1. Wire saveNewTask to Supabase
const target1 = 'window.DB_TABLES.tasks.push(newTask);\r\n    \r\n    // Add to legacy for fallback safety';
const replacement1 = 'window.DB_TABLES.tasks.push(newTask);\r\n    // Persist to Supabase (async, non-blocking)\r\n    if (window.ERP && window.ERP.saveTaskToSB) ERP.saveTaskToSB(newTask);\r\n    \r\n    // Add to legacy for fallback safety';
txt = txt.replace(target1, replacement1);

// 2. Wire CRM addLead to Supabase - find CRM.save or addLead
const addLeadTarget = 'DB_TABLES.contacts.push(newLead);';
if (txt.includes(addLeadTarget)) {
  txt = txt.replace(addLeadTarget, 'DB_TABLES.contacts.push(newLead);\r\n    // Persist to Supabase\r\n    if (window.ERP && window.ERP.saveContactToSB) ERP.saveContactToSB(newLead);');
}

// 3. Wire task status updates to Supabase (drag-drop / kanban moves)
const dragTarget = "task.status = newStatus;\r\n    task.bucket = newStatus;";
if (txt.includes(dragTarget)) {
  txt = txt.replace(dragTarget, "task.status = newStatus;\r\n    task.bucket = newStatus;\r\n    // Sync to Supabase\r\n    if (window.ERP && window.ERP.updateTaskStatusInSB) ERP.updateTaskStatusInSB(task.id, newStatus);");
}

// Check results
const applied = [];
if (txt.includes('ERP.saveTaskToSB(newTask)')) applied.push('saveNewTask hook');
if (txt.includes('ERP.saveContactToSB(newLead)')) applied.push('addLead hook');
if (txt.includes('ERP.updateTaskStatusInSB(task.id')) applied.push('task status hook');

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
console.log('Applied hooks:', applied.join(', ') || 'none found');
