const fs = require('fs');
const path = require('path');

const BASE = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2';
const htmlFiles = [
  path.join(BASE, 'erp/index.html'),
  path.join(BASE, 'portal/index.html'),
];

// The CDN script tag to replace
const CDN_TAG    = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';

// For ERP (erp/ folder): relative path is ../shared/supabase.min.js
// For Portal (portal/ folder): relative path is ../shared/supabase.min.js
const LOCAL_TAG_RELATIVE = '<script src="../shared/supabase.min.js"></script>';

for (const file of htmlFiles) {
  if (!fs.existsSync(file)) {
    console.log('NOT FOUND:', file);
    continue;
  }
  
  let txt = fs.readFileSync(file, 'utf8');
  
  if (txt.includes(CDN_TAG)) {
    txt = txt.replace(CDN_TAG, LOCAL_TAG_RELATIVE);
    fs.writeFileSync(file, txt);
    console.log('✅ Updated:', path.relative(BASE, file));
  } else {
    // Check if it's already local
    if (txt.includes('supabase.min.js')) {
      console.log('⏭️  Already local:', path.relative(BASE, file));
    } else {
      console.log('⚠️  No supabase CDN found in:', path.relative(BASE, file));
      // Check for any supabase script
      const sbLine = txt.split('\n').find(l => l.includes('supabase'));
      if (sbLine) console.log('    Found:', sbLine.trim());
    }
  }
}

console.log('\nDone. Supabase SDK is now loaded from local file.');
