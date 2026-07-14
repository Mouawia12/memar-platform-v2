const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('// 5. Users (Centralized User Management System)'));
const endIndex = lines.findIndex(l => l.includes('// 7. Attendance')) - 1;

if (startIndex !== -1 && endIndex > startIndex) {
    const replacement = `    // 5. Users (Centralized User Management System)
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
            last_login: null
        });
        
        unifiedEmployees.push({
            id: 'EMP_' + e.id,
            user_id: e.id,
            position: e.role || 'Employee',
            hierarchy_level: e.role && e.role.includes('رئيس') ? 1 : (e.role && e.role.includes('أول') ? 2 : 3),
            department: e.dept || 'عام'
        });
    });
    
    let rawContacts = [...(DATA.contacts || [])];
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_leads')||'[]')); }catch(e){}
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_clients')||'[]')); }catch(e){}
    
    let uniqueContacts = rawContacts.reduce((acc, c) => {
        if(!acc.find(x=>x.id===c.id)) acc.push(c);
        return acc;
    }, []);

    // Re-using existing cMap
    uniqueContacts.forEach((c, idx) => {
        let nId = c.id || 'C_' + Math.floor(Math.random()*10000);
        cMap[c.name] = nId;
        
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
            last_login: null
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
    DB_TABLES.clients = unifiedClients;`;

    lines.splice(startIndex, endIndex - startIndex + 1, ...replacement.split('\n'));
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
    console.log('Successfully injected explicit detail tables!');
} else {
    console.log('Could not find injection boundaries.');
}
