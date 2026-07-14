const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 1. Add getUserName to ERP
text = text.replace(/const ERP = \{/, `const ERP = {
  getUserName(id) {
    if (!id) return 'غير محدد';
    const u = (window.DB_TABLES.users || []).find(x => x.id === id);
    return u ? u.full_name : 'غير محدد';
  },`);

// 2. Schema Migrator fixes: Ensure conversations, invoices, contracts use user_id
// We will inject logic right before "window.DB_SCHEMA_MAPPED = true;"
const targetInject = `// Safety Fallback for local UI mapping references (Prevents Breakage)`;
const newRelations = `
    // System-wide Relations Mapping
    DB_TABLES.conversations = (DATA.conversations || []).map(conv => {
        return {
            ...conv,
            messages: conv.messages.map(m => {
                // Find sender_id
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

    `;

text = text.replace(targetInject, newRelations + targetInject);

// 3. UI Renderer fixes: Replace static text references with dynamic ERP.getUserName(id)

// Projects
text = text.replace(/const cname = \(clientObj\?\.full_name \|\| clientObj\?\.name\) \|\| p\.client \|\| 'غير محدد';/g, "const cname = ERP.getUserName(p.client_id);");
text = text.replace(/const mname = \(window\.DB_TABLES\.users\|\|\[\]\)\.find\(u=>u\.id===p\.assigned_to\)\?\.name \|\| p\.assigned_to \|\| 'غير مسند';/g, "const mname = ERP.getUserName(p.assigned_to) || 'غير مسند';");

// Appointments Dashboard
text = text.replace(/\$\{e\.client\.split\('\\\|'\)\[0\]\.trim\(\)\}/g, "${ERP.getUserName(e.client_id).split('|')[0].trim()}");
text = text.replace(/👤 \$\{e\.client\.split\('\\\|'\)\[0\]\.trim\(\)\}/g, "👤 ${ERP.getUserName(e.client_id).split('|')[0].trim()}");

// Appointments Main
text = text.replace(/const cname = \(window\.DB_TABLES\.users\|\|\[\]\)\.find\(c=>c\.id===a\.client_id\)\?\.full_name \|\| a\.client \|\| 'بدون عميل';/g, "const cname = ERP.getUserName(a.client_id);");
text = text.replace(/const cname = \(window\.DB_TABLES\.users\|\|\[\]\)\.find\(c=>c\.id===a\.client_id\)\?\.full_name \|\| a\.client \|\| '';/g, "const cname = ERP.getUserName(a.client_id);");
text = text.replace(/\$\{a\.client\} 👤/g, "${ERP.getUserName(a.client_id)} 👤");
text = text.replace(/👤 \$\{a\.client\}/g, "👤 ${ERP.getUserName(a.client_id)}");
text = text.replace(/name: \(\(window\.DB_TABLES\.users\|\|\[\]\)\.find\(c=>c\.id===a\.client_id\)\?\.full_name \|\| a\.client \|\| 'بدون عميل'\)\.split\('\\\|'\)\[0\]\.trim\(\)/g, "name: ERP.getUserName(a.client_id).split('|')[0].trim()");

// Invoices
text = text.replace(/\$\{inv\.client\}/g, "${ERP.getUserName(inv.client_id)}");
text = text.replace(/<td>\$\{i\.client\}<\/td><td class="td-muted">\$\{i\.project\}<\/td>/g, "<td>${ERP.getUserName(i.client_id)}</td><td class=\"td-muted\">${i.project}</td>");
text = text.replace(/<div style="font-weight:700">\$\{i\.client\}<\/div>/g, "<div style=\"font-weight:700\">${ERP.getUserName(i.client_id)}</div>");

// CRM Meetings
text = text.replace(/العميل: \$\{m\.client\}/g, "العميل: ${ERP.getUserName(m.client_id)}");

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Successfully refactored system integration!');
