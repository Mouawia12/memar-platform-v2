const fs = require('fs');

let code = fs.readFileSync('erp/index.html', 'utf8');

if (!code.includes('data-page="pricing_ref"')) {
  const target = '<div class="nav-item" data-page="pricing2">\n            <span class="sb-drag-handle" title="اسحب">⠿</span><span class="nav-icon">🧮</span><span class="lbl">محرك التسعير 2</span>\n          </div>';
  
  const inject = target + '\n          <div class="nav-item" data-page="pricing_ref">\n            <span class="sb-drag-handle" title="اسحب">⠿</span><span class="nav-icon">🕰️</span><span class="lbl">التسعير (المرجعي)</span>\n          </div>';
  
  if(code.includes(target)) {
    code = code.replace(target, inject);
    fs.writeFileSync('erp/index.html', code);
    console.log('Successfully added pricing_ref to sidebar.');
  } else {
    console.log('Target string not found, using regex...');
    // regex fallback
    const r = /<div class="nav-item" data-page="pricing2">[\s\S]*?<\/div>/;
    code = code.replace(r, match => {
      return match + '\n          <div class="nav-item" data-page="pricing_ref">\n            <span class="sb-drag-handle" title="اسحب">⠿</span><span class="nav-icon">🕰️</span><span class="lbl">التسعير (المرجعي)</span>\n          </div>';
    });
    fs.writeFileSync('erp/index.html', code);
    console.log('Added via regex fallback.');
  }
} else {
  console.log('Already in sidebar.');
}
