const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Change the advanced filters toggle to use fProj() instead of render()
// Also add a toggleAdvanced method that inserts/removes the panel without full re-render

const toggleMethod = `  toggleAdvanced() {
    this._showAdvanced = !this._showAdvanced;
    const container = document.getElementById('prj-adv-container');
    if(container) {
      container.innerHTML = this._showAdvanced ? this.rAdvFilters() : '';
    }
    // Update button appearance
    const btn = document.getElementById('prj-adv-btn');
    if(btn) {
      btn.className = 'btn btn-sm ' + (this._showAdvanced ? 'btn-primary' : 'btn-secondary');
    }
  },
`;

// Insert before rAdvFilters
const rAdvIdx = code.indexOf('  rAdvFilters() {');
if (rAdvIdx === -1) { console.log('ERROR: rAdvFilters not found'); process.exit(1); }
code = code.substring(0, rAdvIdx) + toggleMethod + code.substring(rAdvIdx);

// Now update the button onclick and add an id
code = code.replace(
  'onclick="Projects._showAdvanced=!Projects._showAdvanced;Projects.render()"',
  'id="prj-adv-btn" onclick="Projects.toggleAdvanced()"'
);

// Add a container div for the advanced filters
code = code.replace(
  "${this._showAdvanced ? this.rAdvFilters() : ''}",
  '<div id="prj-adv-container">${this._showAdvanced ? this.rAdvFilters() : ""}</div>'
);

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Toggle fixed');
