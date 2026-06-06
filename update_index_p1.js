const fs = require('fs');
let code = fs.readFileSync('erp/index.html', 'utf8');

const sidebarCssOld = `.sidebar {
  width: var(--sidebar-w);
  background: var(--sb-bg);
  border-left: 1px solid var(--sb-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; right: 0; bottom: 0;
  z-index: 200;
  transition: transform var(--transition);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: -1px 0 0 0 #E2E8F0, -4px 0 20px rgba(71,85,105,.06);
}`;

const sidebarCssNew = `.sidebar {
  width: var(--sidebar-w);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; right: 0; bottom: 0;
  z-index: 200;
  transition: transform var(--transition);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: -4px 0 30px rgba(39, 74, 120, 0.08);
}`;

const topbarCssOld = `.topbar {
  height: var(--topbar-h);
  min-height: var(--topbar-h);
  background: rgba(255,255,255,.97);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--content-pad, 20px);
  padding-left: var(--edge-pad, 44px);
  position: sticky !important;
  top: 0;
  z-index: 999999 !important;
  box-shadow: var(--sh-xs);
  overflow: visible;
  min-width: 0;
  max-width: 100%;
  flex-shrink: 0;
}`;

const topbarCssNew = `.topbar {
  height: var(--topbar-h);
  min-height: var(--topbar-h);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 var(--content-pad, 20px);
  padding-left: var(--edge-pad, 44px);
  position: sticky !important;
  top: 0;
  z-index: 999999 !important;
  box-shadow: 0 4px 20px rgba(39, 74, 120, 0.05);
  overflow: visible;
  min-width: 0;
  max-width: 100%;
  flex-shrink: 0;
}`;

const searchCssOld = `.topbar-search input:focus { border-color: var(--primary); background: #fff; }`;
const searchCssNew = `.topbar-search input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(39, 74, 120, 0.1); width: 110%; transform: translateX(-5%); }
.topbar-search input { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }`;

code = code.replace(sidebarCssOld, sidebarCssNew);
code = code.replace(topbarCssOld, topbarCssNew);
code = code.replace(searchCssOld, searchCssNew);

fs.writeFileSync('erp/index.html', code);
console.log("SUCCESS");
