const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Fix 1: FORCE_TEST_ACCOUNTS — map to actual role IDs
c = c.replace(
  "{email:'pm@memar.kw',name:'\u0645. \u0639\u0628\u062F\u0627\u0644\u0644\u0647',role:'R_ENGINEER'",
  "{email:'pm@memar.kw',name:'\u0645. \u0639\u0628\u062F\u0627\u0644\u0644\u0647',role:'R_MANAGER'"
);
c = c.replace(
  "{email:'arch1@memar.kw',name:'\u0645. \u062F\u0639\u0627\u0621',role:'R_ENGINEER'",
  "{email:'arch1@memar.kw',name:'\u0645. \u062F\u0639\u0627\u0621',role:'R_ARCHITECT'"
);
c = c.replace(
  "{email:'arch2@memar.kw',name:'\u0645. \u062E\u0627\u0644\u062F',role:'R_ENGINEER'",
  "{email:'arch2@memar.kw',name:'\u0645. \u062E\u0627\u0644\u062F',role:'R_ARCHITECT'"
);
c = c.replace(
  "{email:'struct1@memar.kw',name:'\u0645. \u0625\u0633\u0645\u0627\u0639\u064A\u0644',role:'R_ENGINEER'",
  "{email:'struct1@memar.kw',name:'\u0645. \u0625\u0633\u0645\u0627\u0639\u064A\u0644',role:'R_STRUCTURAL'"
);
c = c.replace(
  "{email:'struct2@memar.kw',name:'\u0645. \u0628\u064A\u0634\u0648\u064A',role:'R_ENGINEER'",
  "{email:'struct2@memar.kw',name:'\u0645. \u0628\u064A\u0634\u0648\u064A',role:'R_STRUCTURAL'"
);
c = c.replace(
  "{email:'sec@memar.kw',name:'\u0623. \u0631\u0646\u0627',role:'R_USER'",
  "{email:'sec@memar.kw',name:'\u0623. \u0631\u0646\u0627',role:'R_SECRETARY'"
);
c = c.replace(
  "{email:'rep@memar.kw',name:'\u0645\u0646\u062F\u0648\u0628 \u0623\u0628\u0648 \u0639\u0644\u064A',role:'R_SALES'",
  "{email:'rep@memar.kw',name:'\u0645\u0646\u062F\u0648\u0628 \u0623\u0628\u0648 \u0639\u0644\u064A',role:'R_FREELANCE_ENG'"
);
c = c.replace(
  "{email:'draft@memar.kw',name:'\u0631\u0633\u0627\u0645 \u0646\u0634\u0623\u062A',role:'R_USER'",
  "{email:'draft@memar.kw',name:'\u0631\u0633\u0627\u0645 \u0646\u0634\u0623\u062A',role:'R_DRAFTSMAN'"
);
c = c.replace(
  "{email:'office@memar.kw',name:'\u0623\u0648\u0641\u064A\u0633 \u0628\u0648\u064A \u062C\u0645\u064A\u0644',role:'R_USER'",
  "{email:'office@memar.kw',name:'\u0623\u0648\u0641\u064A\u0633 \u0628\u0648\u064A \u062C\u0645\u064A\u0644',role:'R_OFFICE_BOY'"
);
c = c.replace(
  "{email:'3d@memar.kw',name:'\u0645. \u0623\u062D\u0645\u062F \u0633\u0645\u064A\u0631',role:'R_ENGINEER'",
  "{email:'3d@memar.kw',name:'\u0645. \u0623\u062D\u0645\u062F \u0633\u0645\u064A\u0631',role:'R_FREELANCE_DES'"
);
c = c.replace(
  "{email:'interior@memar.kw',name:'\u0645. \u0633\u0645\u0631',role:'R_ENGINEER'",
  "{email:'interior@memar.kw',name:'\u0645. \u0633\u0645\u0631',role:'R_ARCHITECT'"
);
c = c.replace(
  "{email:'ui@memar.kw',name:'\u0645. \u0622\u0644\u0627\u0621',role:'R_ENGINEER'",
  "{email:'ui@memar.kw',name:'\u0645. \u0622\u0644\u0627\u0621',role:'R_ARCHITECT'"
);
// Fix clients to use proper role IDs
c = c.replace(
  "{email:'client1@memar.kw',name:'\u0623\u062D\u0645\u062F \u0627\u0644\u0639\u0644\u064A',role:'R_CLIENT'",
  "{email:'client1@memar.kw',name:'\u0623\u062D\u0645\u062F \u0627\u0644\u0639\u0644\u064A',role:'R_CLIENT_INDV'"
);
c = c.replace(
  "{email:'client2@memar.kw',name:'\u062E\u0627\u0644\u062F \u062E\u0644\u0641 \u0627\u0644\u0639\u0627\u0632\u0645\u064A',role:'R_CLIENT'",
  "{email:'client2@memar.kw',name:'\u062E\u0627\u0644\u062F \u062E\u0644\u0641 \u0627\u0644\u0639\u0627\u0632\u0645\u064A',role:'R_CLIENT_INDV'"
);
c = c.replace(
  "{email:'client3@memar.kw',name:'\u062F. \u0622\u0645\u0646\u0629 \u0627\u0644\u0631\u0634\u064A\u062F\u064A',role:'R_CLIENT'",
  "{email:'client3@memar.kw',name:'\u062F. \u0622\u0645\u0646\u0629 \u0627\u0644\u0631\u0634\u064A\u062F\u064A',role:'R_CLIENT_INDV'"
);

// Fix 2: SchemaMigrator employee role_id mapping  
// Replace the generic dept mapping with a smart mapper
const oldMapper = "role_id: e.dept ? 'R_' + e.dept.toUpperCase() : 'R_USER'";
const newMapper = "role_id: ({'\u0647\u0646\u062F\u0633\u064A':'R_ARCHITECT','\u0625\u0646\u0634\u0627\u0626\u064A':'R_STRUCTURAL','\u0625\u062F\u0627\u0631\u064A':'R_ADMIN','\u0645\u0627\u0644\u064A':'R_FINANCE','\u0633\u0643\u0631\u062A\u0627\u0631\u064A\u0629':'R_SECRETARY','engineering':'R_ARCHITECT','structural':'R_STRUCTURAL','management':'R_ADMIN','finance':'R_FINANCE','secretary':'R_SECRETARY','admin':'R_ADMIN'}[e.dept] || 'R_ARCHITECT')";
c = c.replace(oldMapper, newMapper);

// Fix 3: Client role_id in SchemaMigrator contacts mapping
c = c.replace(
  "role_id: 'R_CLIENT',\n            account_type: c.type",
  "role_id: 'R_CLIENT_INDV',\r\n            account_type: c.type"
);

// Fix 4: Also fix the auto-sync in UserLogs for contacts
c = c.replace(
  "role_id: 'R_CLIENT',\n                    status: 'active',\n                    created_at: new Date().toISOString()\n                });\n                synced = true;\n            }\n         });\n         \n         (window.DATA?.contacts",
  "role_id: 'R_CLIENT_INDV',\r\n                    status: 'active',\r\n                    created_at: new Date().toISOString()\r\n                });\r\n                synced = true;\r\n            }\r\n         });\r\n         \r\n         (window.DATA?.contacts"
);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
console.log('All role_id mappings fixed!');
