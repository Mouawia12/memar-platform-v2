const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 1. Remove DB_TABLES.clients creation
const targetClientsStart = text.indexOf('// 1. Clients');
const targetProjectsStart = text.indexOf('// 2. Projects');

if (targetClientsStart !== -1 && targetProjectsStart !== -1) {
    const clientsBlock = text.substring(targetClientsStart, targetProjectsStart);
    text = text.replace(clientsBlock, `// 1. Clients (Merged into Users)
    // Removed DB_TABLES.clients, all clients are now in DB_TABLES.users
    
    `);
    console.log('Removed DB_TABLES.clients block');
}

// 2. Replace window.DB_TABLES.clients with window.DB_TABLES.users
// Mostly in places like: const cname = (window.DB_TABLES.clients||[]).find(...)
text = text.replace(/window\.DB_TABLES\.clients/g, 'window.DB_TABLES.users');

// 3. Fix full_name where needed (because users table uses full_name instead of name)
// In Projects.render(), we have: const clientObj = (window.DB_TABLES.users||[]).find(c=>c.id===p.client_id);
// const cname = clientObj?.name || p.client || 'غير محدد';
// Let's replace clientObj?.name with (clientObj?.full_name || clientObj?.name)
text = text.replace(/clientObj\?\.name/g, '(clientObj?.full_name || clientObj?.name)');

// Similarly for Appointments
// const cname = (window.DB_TABLES.users||[]).find(c=>c.id===a.client_id)?.name
text = text.replace(/\)\.find\(c=>c\.id===a\.client_id\)\?\.name/g, ').find(c=>c.id===a.client_id)?.full_name');

// In Clients management (ClientsPage)
// window.DB_TABLES.users[ci].name = nm;
text = text.replace(/window\.DB_TABLES\.users\[ci\]\.name = nm;/g, 'window.DB_TABLES.users[ci].full_name = nm;');

// In Clients management map
// const synced = window.DB_TABLES.users.map((nc) => {
// We should filter only clients for the ClientsPage:
// const allClients = window.DB_TABLES.users || [];
// Let's change `const allClients = window.DB_TABLES.users || [];` to filter for clients
text = text.replace(/const allClients = window\.DB_TABLES\.users \|\| \[\];/g, 'const allClients = (window.DB_TABLES.users || []).filter(u => [\\"client\\", \\"company\\"].includes(u.account_type));');

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Successfully refactored clients to users.');
