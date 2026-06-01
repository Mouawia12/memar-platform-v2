const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// The block to insert at the top
const cMapLogic = `    const DB_TABLES = window.DB_TABLES;
    let cMap = {};
    let rawContacts = [...(DATA.contacts || [])];
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_leads')||'[]')); }catch(e){}
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_clients')||'[]')); }catch(e){}
    
    let uniqueContacts = rawContacts.reduce((acc, c) => {
        if(!acc.find(x=>x.id===c.id)) acc.push(c);
        return acc;
    }, []);

    uniqueContacts.forEach((c) => {
        let nId = c.id || 'C_' + Math.floor(Math.random()*10000);
        cMap[c.name] = nId;
        c.id = nId;
    });
`;

text = text.replace(/window\.DB_TABLES = window\.DB_TABLES \|\| \{\};\n\s*const DB_TABLES = window\.DB_TABLES; let cMap = \{\};/, `window.DB_TABLES = window.DB_TABLES || {};\n${cMapLogic}`);

// Remove the old rawContacts logic
const oldContactsLogicRegex = /let rawContacts = \[\.\.\.\(DATA\.contacts \|\| \[\]\)\].*?uniqueContacts\.forEach\(\(c, idx\) => \{.*?let nId = c\.id \|\| 'C_' \+ Math\.floor\(Math\.random\(\)\*10000\);\n\s*cMap\[c\.name\] = nId;/s;

text = text.replace(oldContactsLogicRegex, `uniqueContacts.forEach((c, idx) => {\n        let nId = c.id;\n`);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Fixed cMap logic order');
