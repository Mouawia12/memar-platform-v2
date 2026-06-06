const fs = require('fs');
const path = require('path');

const responsiveCSS = `
/* ══════════════════════════════════════════════════════════
   GLOBAL DYNAMIC & RESPONSIVE LAYOUT (Fluid Resizing)
   ══════════════════════════════════════════════════════════ */
/* Fluid Grids - auto adapting to container width */
.grid-2 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)) !important; gap: 16px !important; }
.grid-3 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) !important; gap: 16px !important; }
.grid-4 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important; gap: 16px !important; }
.g2 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)) !important; gap: 14px !important; }
.g3 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)) !important; gap: 13px !important; }
.g4 { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)) !important; gap: 13px !important; }

/* Handle fractional fixed grids */
@media (max-width: 900px) {
  .grid-2-1, .grid-1-2 { grid-template-columns: 1fr !important; }
  .fr2, .fr3 { grid-template-columns: 1fr !important; }
}

/* Sidebar & Main Container Responsive adjustments */
@media (max-width: 900px) {
  .sidebar, .sb { 
    transform: translateX(100%) !important; 
    position: fixed !important; 
    z-index: 1000 !important; 
    width: 260px !important;
  }
  .sidebar.open, .sb.open { 
    transform: translateX(0) !important; 
    box-shadow: -10px 0 30px rgba(0,0,0,0.15) !important; 
  }
  .main { 
    margin-right: 0 !important; 
    max-width: 100vw !important; 
    width: 100% !important; 
  }
  .topbar { padding: 0 16px !important; }
}

/* Ensure no horizontal overflow */
body, .app { overflow-x: hidden !important; max-width: 100vw !important; }
img, video { max-width: 100%; height: auto; }
.table-wrap, .tw { overflow-x: auto !important; max-width: 100% !important; }
.card, .panel { max-width: 100% !important; min-width: 0 !important; }

/* Smooth Fluid Transitions for Window Resizing and Hovering */
.main, .sidebar, .sb, .content {
  transition: margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.card, .kpi-card, .btn, .nav-item, .ni {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.grid-2, .grid-3, .grid-4, .g2, .g3, .g4 {
  transition: grid-template-columns 0.3s ease !important;
}

/* Form Responsiveness */
.form-input, .ds-input, .ds-select, .ds-textarea {
  max-width: 100% !important;
}
`;

const premiumCssPath = path.join(__dirname, '..', 'shared', 'premium.css');
if (fs.existsSync(premiumCssPath)) {
  let content = fs.readFileSync(premiumCssPath, 'utf8');
  if (!content.includes('GLOBAL DYNAMIC & RESPONSIVE LAYOUT')) {
    content += '\n' + responsiveCSS;
    fs.writeFileSync(premiumCssPath, content, 'utf8');
    console.log('Successfully injected dynamic & responsive layout rules into shared/premium.css');
  } else {
    console.log('Rules already exist in shared/premium.css');
  }
} else {
  console.log('shared/premium.css not found.');
}
