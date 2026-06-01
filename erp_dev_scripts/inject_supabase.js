const fs = require('fs');

let txt = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Find the exact closing of ERP object (}; after getInitials)
const target = `  getInitials(name) {\r\n    return name ? name[0] : '?';\r\n  },\r\n};`;

const replacement = `  getInitials(name) {
    return name ? name[0] : '?';
  },

  /* Supabase Data Loading */
  async _loadSupabaseData() {
    try {
      const sbTasks = await window.MemarDB.fetchTable('tasks', { order: { col: 'created_at', asc: false } });
      if (sbTasks && sbTasks.length > 0) {
        window.DB_TABLES.tasks = sbTasks.map(t => ({
          id: t.id, title: t.title_ar || t.title_en || '',
          title_full: t.title_ar || t.title_en || '',
          due: t.due_date, due_date: t.due_date,
          priority: t.priority || 'medium', status: t.status || 'todo',
          bucket: t.status || 'todo', project: t.project_id || null,
          related_to: t.project_id || null, assigned_to: t.assigned_to || null,
          tags: t.tags || [], log: []
        }));
        DATA.tasks.todo        = window.DB_TABLES.tasks.filter(t => t.status === 'todo');
        DATA.tasks.in_progress = window.DB_TABLES.tasks.filter(t => t.status === 'in_progress');
        DATA.tasks.review      = window.DB_TABLES.tasks.filter(t => t.status === 'review');
        DATA.tasks.done        = window.DB_TABLES.tasks.filter(t => t.status === 'done');
        console.log('[MemarDB] Tasks loaded from Supabase:', sbTasks.length);
      }

      const sbProjects = await window.MemarDB.fetchTable('projects', { order: { col: 'created_at', asc: false } });
      if (sbProjects && sbProjects.length > 0) {
        window.DB_TABLES.projects = sbProjects.map(p => ({
          id: p.id, num: p.project_number, name: p.name_ar,
          type: p.type, status: p.status, location: p.location_ar || '',
          area: p.area_sqm || 0, floors: p.floors || 1,
          start: p.start_date, end: p.end_date, progress: p.progress_pct || 0,
          stages: (p.metadata && p.metadata.stages) ? p.metadata.stages : [],
          client: (p.metadata && p.metadata.client) ? p.metadata.client : ''
        }));
        DATA.projects = window.DB_TABLES.projects;
        console.log('[MemarDB] Projects loaded from Supabase:', sbProjects.length);
      }

      const sbContacts = await window.MemarDB.fetchTable('contacts', { order: { col: 'created_at', asc: false } });
      if (sbContacts && sbContacts.length > 0) {
        window.DB_TABLES.contacts = sbContacts.map(c => ({
          id: c.id, name: c.full_name_ar, type: c.type,
          company: c.company_ar || '-', phone: c.phone || '',
          email: c.email || '', stage: c.pipeline_stage || 'new',
          value: (c.metadata && c.metadata.value) ? c.metadata.value : 0,
          tags: c.tags || []
        }));
        DATA.contacts = window.DB_TABLES.contacts;
        console.log('[MemarDB] Contacts loaded from Supabase:', sbContacts.length);
      }

      const refreshable = ['tasks','projects','crm','clients','dashboard'];
      if (refreshable.includes(this.currentPage)) {
        setTimeout(() => this.navigate(this.currentPage), 150);
      }

      this.toast('متصل بقاعدة البيانات', 'success');
    } catch(e) {
      console.warn('[MemarDB] Supabase load failed (using local data):', e.message);
    }
  },

  async saveTaskToSB(task) {
    if (!window.MemarDB) return;
    try {
      const row = {
        title_ar: task.title, status: task.status || 'todo',
        priority: task.priority || 'medium', due_date: task.due || null,
        project_id: task.project || null, assigned_to: task.assigned_to || null,
        tags: task.tags || []
      };
      const result = await window.MemarDB.insert('tasks', row);
      if (result.data && !result.error) {
        task.id = result.data.id;
        window.MemarDB.logAction('CREATE_TASK', 'tasks', result.data.id, { title: task.title });
        console.log('[MemarDB] Task saved:', result.data.id);
      }
    } catch(e) { console.warn('[MemarDB] Task save error:', e.message); }
  },

  async saveContactToSB(contact) {
    if (!window.MemarDB) return;
    try {
      const row = {
        full_name_ar: contact.name, type: contact.type || 'lead',
        company_ar: (contact.company && contact.company !== '-') ? contact.company : null,
        phone: contact.phone || null, email: contact.email || null,
        pipeline_stage: contact.stage || 'new', tags: contact.tags || [],
        metadata: { value: contact.value || 0 }
      };
      const result = await window.MemarDB.insert('contacts', row);
      if (result.data && !result.error) {
        contact.id = result.data.id;
        window.MemarDB.logAction('CREATE_CONTACT', 'contacts', result.data.id, { name: contact.name });
        console.log('[MemarDB] Contact saved:', result.data.id);
      }
    } catch(e) { console.warn('[MemarDB] Contact save error:', e.message); }
  },

  async updateTaskStatusInSB(taskId, newStatus) {
    if (!window.MemarDB || !taskId || String(taskId).startsWith('t_')) return;
    try {
      await window.MemarDB.update('tasks', taskId, { status: newStatus });
      window.MemarDB.logAction('UPDATE_TASK', 'tasks', taskId, { status: newStatus });
    } catch(e) { console.warn('[MemarDB] Task status update error:', e.message); }
  },

  async deleteTaskFromSB(taskId) {
    if (!window.MemarDB || !taskId || String(taskId).startsWith('t_')) return;
    try {
      await window.MemarDB.softDelete('tasks', taskId);
      window.MemarDB.logAction('DELETE_TASK', 'tasks', taskId, {});
    } catch(e) { console.warn('[MemarDB] Task delete error:', e.message); }
  }
};`;

txt = txt.replace(target, replacement);
if (!txt.includes('_loadSupabaseData')) {
  console.error('ERROR: replacement not applied!');
} else {
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
  console.log('SUCCESS: Supabase helpers injected into ERP object.');
}
