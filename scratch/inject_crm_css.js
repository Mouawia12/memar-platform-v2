const fs = require('fs');
const html = fs.readFileSync('erp/index.html', 'utf8');

const newCSS = `
/* ══════════════════════════════════════════════════════════
   CRM MODULE CSS (OPPORTUNITY MANAGEMENT)
   ══════════════════════════════════════════════════════════ */
.crm-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.crm-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}
.crm-btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(27,108,168,0.2);
}
.crm-btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.crm-btn-outline {
  background: white;
  color: var(--text-2);
  border: 1px solid var(--border);
}
.crm-btn-outline:hover {
  background: var(--bg);
  border-color: var(--primary);
  color: var(--primary);
}

.crm-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.crm-kpi-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--sh-sm);
  display: flex;
  align-items: center;
  gap: 14px;
}
.crm-kpi-ico {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.crm-kpi-lbl {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 600;
  margin-bottom: 4px;
}
.crm-kpi-val {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.crm-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.crm-select, .crm-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  background: white;
  outline: none;
  font-family: inherit;
}
.crm-select:focus, .crm-input:focus {
  border-color: var(--primary);
}

.crm-board-wrapper {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  min-height: 500px;
}
.crm-board-wrapper::-webkit-scrollbar {
  height: 8px;
}
.crm-board-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-2);
  border-radius: 4px;
}
`;

if (!html.includes('CRM MODULE CSS')) {
  const updatedHtml = html.replace('</style>', newCSS + '\n</style>');
  fs.writeFileSync('erp/index.html', updatedHtml, 'utf8');
  console.log('CRM CSS injected successfully!');
} else {
  console.log('CRM CSS already exists.');
}
