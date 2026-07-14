const fs=require('fs');
let txt = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

txt = txt.replace('a.dueDate.localeCompare(b.dueDate)', '(a.dueDate||"").localeCompare(b.dueDate||"")');

const taskPushOld = `DB_TABLES.tasks.push({
              id: t.id,
              related_to: t.project || null,
              assigned_to: t.assigned || null,
              status: st,
              due_date: t.due || null,
              title: t.title
            });`;
const taskPushNew = `DB_TABLES.tasks.push({
              id: t.id,
              related_to: t.project || null,
              assigned_to: t.assigned || null,
              status: st,
              due_date: t.due || null,
              due: t.due || null,
              title: t.title,
              title_full: t.title_full || t.title,
              priority: t.priority || 'medium',
              project: t.project || null,
              tags: t.tags || [],
              log: t.log || []
            });`;

txt = txt.replace(taskPushOld.replace(/\r\n/g, '\n'), taskPushNew);
txt = txt.replace(taskPushOld, taskPushNew);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
