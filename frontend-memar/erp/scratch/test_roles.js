const fs = require('fs');

global.window = {
    location: { href: 'http://localhost' },
    document: { 
        getElementById: () => ({ innerHTML: '', style: {}, classList: { add: ()=>{}, remove: ()=>{} }, appendChild: ()=>{} }),
        querySelectorAll: () => [],
        createElement: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, appendChild: ()=>{} }),
        addEventListener: () => {}
    },
    localStorage: { 
        _data: {}, 
        getItem: function(k) { return this._data[k] || null; }, 
        setItem: function(k, v) { this._data[k] = v; }, 
        removeItem: function(k) { delete this._data[k]; } 
    },
    addEventListener: () => {},
    DATA: {}
};
global.document = global.window.document;
global.localStorage = global.window.localStorage;
global.navigator = { userAgent: 'node' };

const code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

try {
    const safeCode = code.replace(/document\.addEventListener/g, '//')
                         .replace(/window\.addEventListener/g, '//')
                         .replace(/Chart\.defaults/g, '//');
    eval(safeCode);
    
    // SchemaMigrator should have run
    if (window.DB_TABLES && window.DB_TABLES.users) {
        console.log("USERS BY ROLE:");
        const byRole = {};
        window.DB_TABLES.users.forEach(u => {
            if (!byRole[u.role_id]) byRole[u.role_id] = [];
            byRole[u.role_id].push(u.full_name);
        });
        console.log(JSON.stringify(byRole, null, 2));
    } else {
        console.log("No users found");
    }
} catch (e) {
    console.error("Error executing erp_app:", e);
}
