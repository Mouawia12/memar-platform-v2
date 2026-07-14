const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

const correctRun = `  run() {
    window.DB_TABLES = window.DB_TABLES || {};
    const DB_TABLES = window.DB_TABLES;
    
    // Create unique contacts and cMap AT THE VERY BEGINNING
    let cMap = {};
    let rawContacts = [...(DATA.contacts || [])];
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_leads')||'[]')); }catch(e){}
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_clients')||'[]')); }catch(e){}
    
    let uniqueContacts = rawContacts.reduce((acc, c) => {
        if(!acc.find(x=>x.id===c.id)) acc.push(c);
        return acc;
    }, []);

    uniqueContacts.forEach(c => {
        let nId = c.id || 'C_' + Math.floor(Math.random()*10000);
        cMap[c.name] = nId;
        c.id = nId;
    });

    // 2. Projects
    DB_TABLES.projects = (DATA.projects || []).map(p => ({
      ...p,
      id: p.id,
      client_id: cMap[p.client] || null,
      project_type: p.type || 'عام',
      status: p.status || 'active',
      assigned_to: p.manager || null,
      start_date: p.start || null
    }));

    // 3. Appointments
    DB_TABLES.appointments = (DATA.appts || []).map(a => ({
      id: a.id,
      client_id: cMap[a.client] || null,
      project_id: null,
      date: a.date,
      type: 'meeting' // default type
    }));

    // 4. Tasks (Flatten)
    DB_TABLES.tasks = [];
    if (DATA.tasks && !Array.isArray(DATA.tasks)) {
      ['todo','in_progress','review','done'].forEach(st => {
        if (DATA.tasks[st]) {
          DATA.tasks[st].forEach(t => {
            DB_TABLES.tasks.push({
              id: t.id,
              related_to: t.project || null,
              assigned_to: t.assigned || null,
              status: st,
              due_date: t.due || null,
              title: t.title
            });
          });
        }
      });
    }

    // 6. Roles (Centralized)
    DB_TABLES.roles = [
      { id: 'R_ADMIN',   name: 'Admin',      permissions: { dashboard:true, crm:true, clients:true, projects:true, tasks:true, appointments:true, services:true, pricing:true, hr:true, finance:true, reports:true, audit:true, requests:true, attendance:true, payroll:true, user_logs:true, roles:true, chatbot:true } },
      { id: 'R_ENGINEER',name: 'Engineer',   permissions: { dashboard:true, projects:true, tasks:true, appointments:true, crm_meetings:true, audit:true } },
      { id: 'R_SALES',   name: 'Sales',      permissions: { dashboard:true, crm:true, clients:true, appointments:true, requests:true } },
      { id: 'R_FINANCE', name: 'Accountant', permissions: { dashboard:true, payroll:true, reports:true, audit:true } },
      { id: 'R_CLIENT',  name: 'Client',     permissions: { dashboard:true, projects:true, appointments:true, requests:true } }
    ];

    // 5. Users (Centralized User Management System)
    let unifiedUsers = [];
    let unifiedEmployees = [];
    let unifiedClients = [];
    
    const generateHash = (str) => btoa(unescape(encodeURIComponent(str + '_memar2026')));
    
    (DATA.employees || []).forEach(e => {
        unifiedUsers.push({
            id: e.id,
            full_name: e.name,
            email: e.email || \`emp_\${e.id.toLowerCase()}@memar.com\`,
            phone: e.phone || '',
            password_hash: generateHash(e.password || \`Memar@\${e.id}#2026\`),
            role_id: e.dept ? 'R_' + e.dept.toUpperCase() : 'R_USER',
            account_type: 'employee',
            status: e.status === 'frozen' ? 'suspended' : 'active',
            created_at: e.join || new Date().toISOString(),
            last_login: null,
            tags: [],
            notes: ''
        });
        
        unifiedEmployees.push({
            id: 'EMP_' + e.id,
            user_id: e.id,
            position: e.role || 'Employee',
            hierarchy_level: e.role && e.role.includes('رئيس') ? 1 : (e.role && e.role.includes('أول') ? 2 : 3),
            department: e.dept || 'عام'
        });
    });
    
    uniqueContacts.forEach(c => {
        let nId = c.id;
        const clientType = c.company && c.company !== '—' ? 'company' : 'client';
        
        unifiedUsers.push({
            id: nId,
            full_name: c.name,
            email: c.email || \`client_\${nId.toLowerCase()}@memar.com\`,
            phone: c.phone || '',
            password_hash: generateHash(\`Client@\${nId}#2026\`),
            role_id: 'R_CLIENT',
            account_type: clientType,
            status: c.stage === 'lost' ? 'suspended' : 'active',
            created_at: new Date().toISOString(),
            last_login: null,
            tags: [],
            notes: ''
        });
        
        unifiedClients.push({
            id: 'CLI_' + nId,
            user_id: nId,
            client_type: clientType,
            company_name: clientType === 'company' ? c.company : '',
            commercial_register: c.commercial_register || ''
        });
    });
    
    // Map existing localStorage users to retain status and hashes
    let storedUsers = [];
    try { storedUsers = JSON.parse(localStorage.getItem('memar_sys_users')) || []; }catch(e){}
    
    DB_TABLES.users = unifiedUsers.map(u => {
      const existing = storedUsers.find(su => su.id === u.id);
      if (existing) {
          return { ...u, status: existing.status, password_hash: existing.password_hash || u.password_hash };
      }
      return u;
    });
    
    DB_TABLES.employees = unifiedEmployees;
    DB_TABLES.clients = unifiedClients;
    
    // 7. Attendance
    DB_TABLES.attendance = (DATA.employees || []).map(e => ({
      user_id: e.id,
      check_in: '08:00',
      check_out: '16:00'
    }));

    // 8. Payroll
    DB_TABLES.payroll = (DATA.employees || []).map(e => ({
      user_id: e.id,
      salary: e.salary || 0,
      bonus: 0,
      deductions: 0
    }));

    // 9. System Logs
    DB_TABLES.system_logs = (DATA.auditLogs || []).map(l => ({
      user_id: l.user || null,
      action: l.action || 'MODIFY',
      entity: l.details || '',
      timestamp: l.timestamp || new Date().toISOString()
    }));
    
    // System-wide Relations Mapping
    DB_TABLES.conversations = (DATA.conversations || []).map(conv => {
        return {
            ...conv,
            messages: conv.messages.map(m => {
                let senderId = null;
                const emp = (window.DB_TABLES.users||[]).find(u => u.full_name === m.sender && u.account_type === 'employee');
                const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === m.sender && u.account_type !== 'employee');
                if (emp) senderId = emp.id;
                else if (cli) senderId = cli.id;
                return { ...m, sender_id: senderId };
            })
        };
    });
    
    DB_TABLES.invoices = (DATA.invoices || []).map(inv => {
        let cid = cMap ? cMap[inv.client] : null;
        if (!cid) {
           const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === inv.client);
           if(cli) cid = cli.id;
        }
        return { ...inv, client_id: cid };
    });
    
    DB_TABLES.contracts = (DATA.contracts || []).map(con => {
        let cid = cMap ? cMap[con.client] : null;
        if (!cid) {
           const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === con.client);
           if(cli) cid = cli.id;
        }
        return { ...con, client_id: cid };
    });

    // Safety Fallback for local UI mapping references (Prevents Breakage)
    window.DB_SCHEMA_MAPPED = true;
  }`;

const regex = /run\(\) \{[\s\S]*?window\.DB_SCHEMA_MAPPED = true;\n  \}/;
text = text.replace(regex, correctRun);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Successfully fixed SchemaMigrator');
