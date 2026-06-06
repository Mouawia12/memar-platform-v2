const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Find the old roles loading block and replace it completely
const oldBlock = `    // Clear stale empty roles cache\r\n    try { const _sr = JSON.parse(localStorage.getItem('memar_sys_roles')); if(!_sr || !Array.isArray(_sr) || _sr.length < 5) localStorage.removeItem('memar_sys_roles'); } catch(e){}\r\n    try {\r\n        const storedRoles = JSON.parse(localStorage.getItem('memar_sys_roles'));\r\n        if (storedRoles && Array.isArray(storedRoles) && storedRoles.length > 0) {\r\n            // Merge with new schema default structures just in case old roles were saved\r\n            DB_TABLES.roles = storedRoles.map(sr => {\r\n                if(!sr.permissions || !sr.permissions.rights) {\r\n                    const def = defaultRoles.find(dr => dr.id === sr.id);\r\n                    if(def) return def;\r\n                }\r\n                return sr;\r\n            });\r\n        } else {\r\n            DB_TABLES.roles = defaultRoles;\r\n        }\r\n    } catch(e) {\r\n        DB_TABLES.roles = defaultRoles;\r\n    }`;

const newBlock = `    // Roles: Always start from defaultRoles, then merge any user-customized permissions from localStorage\r\n    DB_TABLES.roles = JSON.parse(JSON.stringify(defaultRoles)); // Deep copy defaults\r\n    try {\r\n        const storedRoles = JSON.parse(localStorage.getItem('memar_sys_roles'));\r\n        if (storedRoles && Array.isArray(storedRoles) && storedRoles.length > 0) {\r\n            storedRoles.forEach(sr => {\r\n                if(!sr || !sr.id) return;\r\n                const idx = DB_TABLES.roles.findIndex(dr => dr.id === sr.id);\r\n                if(idx !== -1 && sr.permissions && sr.permissions.rights) {\r\n                    DB_TABLES.roles[idx] = sr;\r\n                } else if(idx === -1) {\r\n                    DB_TABLES.roles.push(sr);\r\n                }\r\n            });\r\n        }\r\n    } catch(e) {\r\n        console.warn('[SchemaMigrator] Could not parse stored roles, using defaults');\r\n    }\r\n    localStorage.setItem('memar_sys_roles', JSON.stringify(DB_TABLES.roles));`;

if(c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
  console.log('Successfully replaced roles loading logic');
} else {
  console.log('ERROR: Could not find old block. Searching for partial matches...');
  console.log('Has "Clear stale":', c.includes('Clear stale'));
  console.log('Has "defaultRoles":', c.includes('defaultRoles'));
  
  // Try more resilient approach - find by unique markers
  const marker1 = '// Clear stale empty roles cache';
  const marker2 = 'DB_TABLES.roles = defaultRoles;\r\n    }';
  const idx1 = c.indexOf(marker1);
  const idx2 = c.indexOf(marker2, idx1);
  if(idx1 !== -1 && idx2 !== -1) {
    const endPos = idx2 + marker2.length;
    console.log('Found markers at', idx1, 'and', idx2, 'replacing...');
    c = c.substring(0, idx1) + newBlock + c.substring(endPos);
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
    console.log('Fixed via marker approach');
  } else {
    console.log('idx1:', idx1, 'idx2:', idx2);
  }
}
