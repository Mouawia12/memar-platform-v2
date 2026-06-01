const fs = require('fs');
let text = fs.readFileSync('erp/erp_app.js', 'utf8');

const regexFilters = /search\(val\)\s*{\s*const projs = window\.DB_TABLES\.projects \|\| \[\];[\s\S]*?filterType\(val\)\s*{\s*const projs = window\.DB_TABLES\.projects \|\| \[\];[\s\S]*?this\.renderTable\(filtered\);\s*},/;

const newFilters = `  filters: { search: '', status: '', type: '' },
  applyFilters() {
    let projs = window.DB_TABLES.projects || [];
    
    // Filter by Search
    if (this.filters.search) {
      const v = this.filters.search.toLowerCase();
      projs = projs.filter(p => {
         const cname = ERP.getUserName(p.client_id) || p.client || '';
         const pname = p.name || '';
         const ptype = p.project_type || p.type || '';
         const mname = ERP.getUserName(p.assigned_to) || p.manager || '';
         return cname.toLowerCase().includes(v) || pname.toLowerCase().includes(v) || ptype.toLowerCase().includes(v) || mname.toLowerCase().includes(v);
      });
    }

    // Filter by Status
    if (this.filters.status) {
      projs = projs.filter(p => p.status === this.filters.status);
    }

    // Filter by Type
    if (this.filters.type) {
      const mappedVal = this.filters.type === 'سكن خاص' ? 'سكني' : this.filters.type;
      projs = projs.filter(p => (p.project_type === mappedVal || p.type === mappedVal));
    }

    const container = document.getElementById('proj-container');
    if (container) {
      container.innerHTML = this.renderTable(projs);
    }
  },

  search(val) {
    this.filters.search = val;
    this.applyFilters();
  },

  filterStatus(val) {
    this.filters.status = val;
    this.applyFilters();
  },

  filterType(val) {
    this.filters.type = val;
    this.applyFilters();
  },`;

if (regexFilters.test(text)) {
  text = text.replace(regexFilters, newFilters);
  fs.writeFileSync('erp/erp_app.js', text, 'utf8');
  console.log('Filters Unified!');
} else {
  console.log('Regex failed to match filter methods!');
}
