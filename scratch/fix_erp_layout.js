const fs = require('fs');
const path = require('path');

const responsiveCSS = `
<style>
/* ══════════════════════════════════════════════════════════
   GLOBAL DYNAMIC & RESPONSIVE LAYOUT (Fluid Resizing)
   ══════════════════════════════════════════════════════════ */
/* Fluid Grids - auto adapting to container width */
.grid-2 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)) !important; gap: 16px !important; }
.grid-3 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) !important; gap: 16px !important; }
.grid-4 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important; gap: 16px !important; }
.kpi-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)) !important; gap: 14px !important; }

/* Handle fractional fixed grids */
@media (max-width: 900px) {
  .grid-2-1, .grid-1-2 { grid-template-columns: 1fr !important; }
  .fr2, .fr3 { grid-template-columns: 1fr !important; }
  
  .topbar-search { display: none !important; }
  .topbar-page-title { max-width: 150px !important; }
}

/* Sidebar & Main Container Responsive adjustments */
@media (max-width: 900px) {
  .sidebar { 
    transform: translateX(100%) !important; 
    position: fixed !important; 
    z-index: 1000 !important; 
    width: 260px !important;
    box-shadow: none !important;
  }
  .sidebar.open { 
    transform: translateX(0) !important; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.15) !important; 
  }
  .main { 
    margin-right: 0 !important; 
    max-width: 100vw !important; 
    width: 100% !important; 
  }
  .topbar { padding: 0 16px !important; }
  .content { padding: 16px !important; }
}

/* Ensure no horizontal overflow */
body, .app { overflow-x: hidden !important; max-width: 100vw !important; }
.table-wrap { overflow-x: auto !important; max-width: 100% !important; }
.card, .panel { max-width: 100% !important; min-width: 0 !important; }
.board-scroll-wrap { overflow-x: auto !important; }

/* Smooth Fluid Transitions for Window Resizing and Hovering */
.main, .sidebar, .content {
  transition: margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.card, .kpi-card, .btn, .nav-item {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.grid-2, .grid-3, .grid-4, .kpi-grid {
  transition: grid-template-columns 0.3s ease !important;
}
</style>
`;

const files = ['erp/index.html', 'portal/index.html'];
files.forEach(f => {
  const filePath = path.join(__dirname, '..', f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('GLOBAL DYNAMIC & RESPONSIVE LAYOUT')) {
      content = content.replace('</head>', responsiveCSS + '\n</head>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed ' + f);
    }
  }
});
