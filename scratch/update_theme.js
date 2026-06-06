const fs = require('fs');
const path = require('path');

const NEW_ROOT = `:root {
  /* ── MIMAR DESIGN SYSTEM TOKENS ── */
  --bg:     #F0F4F8;
  --bg2:    #E8EDF3;
  --card:   #ffffff;
  --card2:  #F8FAFC;
  --navy:   #1B3A6B;
  --navy2:  #2952A3;
  --navy3:  #EEF2F9;
  --gold:   #B8922A;
  --gold2:  #D4A843;
  --gbg:    #FFF8E8;
  --gb:     #F0DCA0;
  --tx:     #1A2332;
  --tx2:    #4B5563;
  --mt:     #9CA3AF;
  --brd:    #E5E7EB;
  --brd2:   #D1D5DB;
  --ok:     #059669;
  --okb:    #ECFDF5;
  --okbr:   #A7F3D0;
  --warn:   #D97706;
  --warnb:  #FFFBEB;
  --warnbr: #FCD34D;
  --err:    #DC2626;
  --errb:   #FEF2F2;
  --errbr:  #FECACA;
  --inf:    #2563EB;
  --infb:   #EFF6FF;
  --infbr:  #BFDBFE;
  --pur:    #7C3AED;
  --purb:   #F5F3FF;
  --purbr:  #DDD6FE;
  --r:      12px;
  --rs:     8px;
  --sh:     0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
  --sh2:    0 4px 16px rgba(0,0,0,.10);
  --sh3:    0 8px 30px rgba(0,0,0,.13);

  /* ── MAPPED OLD TOKENS ── */
  --primary:        var(--navy);
  --primary-dark:   #152C53;
  --primary-mid:    var(--navy2);
  --primary-light:  var(--navy3);
  --primary-50:     var(--navy3);
  --primary-100:    #D6E4F0;
  --primary-200:    #AABDD1;
  --secondary:      var(--ok);
  --success:        var(--ok);
  --success-50:     var(--okb);
  --warning:        var(--warn);
  --warning-50:     var(--warnb);
  --danger:         var(--err);
  --danger-50:      var(--errb);
  --info:           var(--inf);
  --info-50:        var(--infb);
  --accent:         var(--gold);
  --accent-dark:    #9A7A23;
  --accent-light:   var(--gbg);
  --bg-card:        var(--card);
  --bg-subtle:      var(--bg2);
  --text:           var(--tx);
  --text-2:         var(--tx2);
  --text-3:         var(--mt);
  --text-4:         var(--mt);
  --text-inv:       #FFFFFF;
  --muted:          var(--mt);
  --border:         var(--brd);
  --border-2:       var(--brd2);
  --divider:        var(--brd);
  
  /* Sidebar Mapping */
  --sb-bg:              var(--bg);
  --sb-bg-hover:        var(--navy3);
  --sb-bg-active:       var(--navy3);
  --sb-border:          var(--brd);
  --sb-text:            var(--tx2);
  --sb-text-muted:      var(--mt);
  --sb-text-active:     var(--navy);
  --sb-section-label:   var(--mt);
  --sb-logo-bg:         linear-gradient(135deg, var(--navy), var(--navy2));
  --sb-accent-line:     var(--navy);
  --sb-user-bg:         var(--bg2);
  --sb-user-border:     var(--brd);
  
  --topbar-bg:          var(--card);
  
  --sh-xs:              var(--sh);
  --sh-sm:              var(--sh);
  --sh-md:              var(--sh2);
  --sh-lg:              var(--sh3);
  --sh-xl:              var(--sh3);
  
  --font-family:        'Cairo', 'Inter', sans-serif;
  --radius:             var(--r);
  --radius-sm:          var(--rs);
  
  --gradient-brand:     linear-gradient(135deg, var(--navy), var(--navy2));
  --gradient-hero:      linear-gradient(135deg, var(--navy2) 0%, var(--navy) 60%, var(--gold) 100%);
  --gradient-card-top:  linear-gradient(90deg, var(--navy), var(--gold));
  --grad-card-top:      linear-gradient(90deg, var(--navy), var(--gold));
  --ds-grad-brand:      linear-gradient(135deg, var(--navy), var(--navy2));
  --ds-grad-hero:       linear-gradient(135deg, var(--navy2) 0%, var(--navy) 60%, var(--gold) 100%);
  --ds-grad-card-top:   linear-gradient(90deg, var(--navy), var(--gold));

  /* DS MAPPINGS */
  --ds-primary:          var(--navy);
  --ds-primary-dark:     #152C53;
  --ds-primary-light:    var(--navy3);
  --ds-primary-hover:    var(--navy2);
  --ds-primary-50:       var(--navy3);
  --ds-success:          var(--ok);
  --ds-accent:           var(--gold);
  --ds-danger:           var(--err);
  --ds-info:             var(--inf);
  --ds-warning:          var(--warn);
  --ds-bg:               var(--bg);
  --ds-card:             var(--card);
  --ds-text:             var(--tx);
  --ds-muted:            var(--mt);
  --ds-border:           var(--brd);
  --ds-divider:          var(--brd);
}`;

const files = [
  'erp/index.html',
  'portal/index.html',
  'website/index.html',
  'website/memar_login.html',
  'shared/premium.css',
  'shared/memar-ds.css'
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the first :root { ... } with NEW_ROOT
    let updated = content.replace(/:root\s*\{[\s\S]*?\}/, NEW_ROOT);
    
    let remainingRoots = 0;
    updated = updated.replace(/:root\s*\{[\s\S]*?\}/g, (match) => {
      if (remainingRoots === 0) {
        remainingRoots++;
        return match; // Keep the newly inserted NEW_ROOT
      }
      return '/* removed duplicate :root */';
    });

    // Replace hardcoded Indigo/Blue colors in premium.css to point to var(--navy)
    updated = updated.replace(/#4338CA/gi, 'var(--navy)');
    updated = updated.replace(/#4F46E5/gi, 'var(--navy2)');
    updated = updated.replace(/#1D4ED8/gi, 'var(--navy2)');
    updated = updated.replace(/#312E81/gi, 'var(--navy)');
    updated = updated.replace(/#EEF2FF/gi, 'var(--navy3)');
    updated = updated.replace(/#E0E7FF/gi, 'var(--navy3)');
    updated = updated.replace(/#A5B4FC/gi, 'var(--navy2)');
    
    // Replace font families
    updated = updated.replace(/font-family:\s*['"]Tajawal['"]/g, "font-family: 'Cairo'");
    
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('Updated ' + f);
  }
});
