// ─────────── PRICING ENGINE ───────────
// مصدر الأسعار: localStorage أولاً، ثم PRICES الافتراضية
function getActivePrices(){
  try{
    const s=localStorage.getItem('mm3_custom_prices');
    return s?JSON.parse(s):JSON.parse(JSON.stringify(PRICES));
  }catch{return JSON.parse(JSON.stringify(PRICES));}
}
function getActivePkgs(){
  try{
    const s=localStorage.getItem('mm3_custom_pkgs');
    return s?JSON.parse(s):JSON.parse(JSON.stringify(PKGS));
  }catch{return JSON.parse(JSON.stringify(PKGS));}
}
function saveCustomPrices(p){localStorage.setItem('mm3_custom_prices',JSON.stringify(p));toast('✅ تم حفظ الأسعار — الشات بوت محدّث');}
function saveCustomPkgs(p){localStorage.setItem('mm3_custom_pkgs',JSON.stringify(p));toast('✅ تم حفظ الباقات');}
function peResetPrices(){if(!confirm('هل تريد إعادة تعيين جميع الأسعار إلى القيم الافتراضية؟'))return;localStorage.removeItem('mm3_custom_prices');localStorage.removeItem('mm3_custom_pkgs');toast('🔄 تمت إعادة التعيين');go('pricing_engine',{peCat:S.params?.peCat||'سكن خاص',peTab:'edit'});}

function peSavePriceRow(cat,svc){
  const minEl=document.getElementById('pe_min_'+cat+'_'+svc.replace(/[^a-z0-9]/gi,'_'));
  const maxEl=document.getElementById('pe_max_'+cat+'_'+svc.replace(/[^a-z0-9]/gi,'_'));
  const descEl=document.getElementById('pe_desc_'+cat+'_'+svc.replace(/[^a-z0-9]/gi,'_'));
  const p=getActivePrices();
  if(!p[cat])p[cat]={};
  if(!p[cat][svc])p[cat][svc]={};
  const minV=minEl?.value.trim();
  const maxV=maxEl?.value.trim();
  p[cat][svc].pr=minV!==''&&!isNaN(+minV)?+minV:null;
  p[cat][svc].prM=maxV!==''&&!isNaN(+maxV)?+maxV:undefined;
  if(descEl) p[cat][svc].desc=descEl.value.trim();
  saveCustomPrices(p);
  const row=document.getElementById('perow_'+cat+'_'+svc.replace(/[^a-z0-9]/gi,'_'));
  if(row){row.style.background='var(--okb)';setTimeout(()=>{row.style.background='';},800);}
}

function peSavePkgRow(pkgId){
  const p=getActivePkgs();
  const idx=p.findIndex(x=>x.id===pkgId);
  if(idx<0)return;
  const prEl=document.getElementById('pe_pkg_pr_'+pkgId);
  const prMEl=document.getElementById('pe_pkg_prM_'+pkgId);
  if(prEl) p[idx].pr=+prEl.value||p[idx].pr;
  if(prMEl) p[idx].prM=+prMEl.value||undefined;
  saveCustomPkgs(p);
  toast('✅ تم حفظ الباقة '+p[idx].nm);
}

function rPricingEngine(){
  const activeCat=S.params?.peCat||'سكن خاص';
  const activeTab=S.params?.peTab||'services';
  // اقرأ الأسعار المخصصة من localStorage
  const activePrices=getActivePrices();
  const pkgs=getActivePkgs();
  const hasCustom=!!localStorage.getItem('mm3_custom_prices');

  // ── جدول الأسعار الكامل ──
  function priceTableHtml(){
    let rows='';
    CATS.forEach(cat=>{
      const catPrices=activePrices[cat]||{};
      Object.entries(catPrices).forEach(([svc,p])=>{
        const minP=p.pr!=null?`<span style="color:var(--ok);font-weight:900">${p.pr.toLocaleString('ar-KW')} د.ك</span>`:'<span style="color:var(--mt)">حسب الاتفاق</span>';
        const maxP=p.prM!=null?` – <span style="color:var(--gold);font-weight:900">${p.prM.toLocaleString('ar-KW')} د.ك</span>`:''
        rows+=`<tr>
          <td style="padding:9px 12px;border-bottom:1px solid var(--brd)"><span class="bdg bn" style="font-size:10px">${cat}</span></td>
          <td style="padding:9px 12px;border-bottom:1px solid var(--brd);font-weight:700;font-size:13px">${svc}</td>
          <td style="padding:9px 12px;border-bottom:1px solid var(--brd)">${minP}${maxP}</td>
          <td style="padding:9px 12px;border-bottom:1px solid var(--brd);font-size:11.5px;color:var(--tx2)">${p.desc||'—'}</td>
          <td style="padding:9px 12px;border-bottom:1px solid var(--brd)">
            <button class="btn bsm bo" onclick="mQuote('${cat}','${svc}')">📄 عرض سعر</button>
          </td>
        </tr>`;
      });
    });
    return rows;
  }

  // ── صفحة تعديل الأسعار ──
  function editPricesHtml(cat){
    const catPrices=activePrices[cat]||{};
    const defaultCat=PRICES[cat]||{};
    const rows=Object.entries(catPrices).map(([svc,p])=>{
      const key=cat+'_'+svc.replace(/[^a-z0-9]/gi,'_');
      const defP=defaultCat[svc]||{};
      const changed=(p.pr!==defP.pr||p.prM!==defP.prM);
      return `<tr id="perow_${key}" style="transition:background .4s">
        <td style="padding:8px 12px;border-bottom:1px solid var(--brd);font-weight:700;font-size:12.5px">${svc}${changed?'<span style="font-size:9px;color:var(--gold);margin-right:4px">✎ معدّل</span>':''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--brd);white-space:nowrap">
          <input id="pe_min_${key}" type="number" value="${p.pr!=null?p.pr:''}" placeholder="—" style="width:80px;padding:4px 7px;border:1.5px solid var(--brd);border-radius:6px;font-family:Cairo,sans-serif;font-size:12px;outline:none" onfocus="this.style.borderColor='var(--navy)'" onblur="this.style.borderColor='var(--brd)'"> د.ك
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--brd);white-space:nowrap">
          <input id="pe_max_${key}" type="number" value="${p.prM!=null?p.prM:''}" placeholder="—" style="width:80px;padding:4px 7px;border:1.5px solid var(--brd);border-radius:6px;font-family:Cairo,sans-serif;font-size:12px;outline:none" onfocus="this.style.borderColor='var(--navy)'" onblur="this.style.borderColor='var(--brd)'"> د.ك
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--brd)">
          <input id="pe_desc_${key}" value="${(p.desc||'').replace(/"/g,'&quot;')}" style="width:100%;min-width:150px;padding:4px 7px;border:1.5px solid var(--brd);border-radius:6px;font-family:Cairo,sans-serif;font-size:11.5px;outline:none" onfocus="this.style.borderColor='var(--navy)'" onblur="this.style.borderColor='var(--brd;')">
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--brd)">
          <button class="btn bsm bsuc" onclick="peSavePriceRow('${cat}','${svc}')">💾 حفظ</button>
        </td>
      </tr>`;
    }).join('');
    return `<div style="overflow-x:auto"><table style="width:100%">
      <thead><tr style="background:var(--bg)">
        <th style="padding:9px 12px;text-align:right;border-bottom:1px solid var(--brd);font-size:11px">الخدمة</th>
        <th style="padding:9px 12px;text-align:right;border-bottom:1px solid var(--brd);font-size:11px">السعر الأدنى</th>
        <th style="padding:9px 12px;text-align:right;border-bottom:1px solid var(--brd);font-size:11px">السعر الأعلى</th>
        <th style="padding:9px 12px;text-align:right;border-bottom:1px solid var(--brd);font-size:11px">الوصف</th>
        <th style="padding:9px 12px;border-bottom:1px solid var(--brd)"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function editPkgsHtml(){
    return pkgs.map(p=>`
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="font-size:14px;font-weight:900;color:var(--navy);min-width:120px">${p.nm}</div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1">
            <label style="font-size:11.5px;color:var(--tx2)">السعر الأساسي</label>
            <input id="pe_pkg_pr_${p.id}" type="number" value="${p.pr}" style="width:90px;padding:5px 9px;border:1.5px solid var(--brd);border-radius:7px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;color:var(--gold)">
            <label style="font-size:11.5px;color:var(--tx2)">سعر بديل</label>
            <input id="pe_pkg_prM_${p.id}" type="number" value="${p.prM||''}" placeholder="—" style="width:90px;padding:5px 9px;border:1.5px solid var(--brd);border-radius:7px;font-family:Cairo,sans-serif;font-size:13px">
            <button class="btn bsm bsuc" onclick="peSavePkgRow('${p.id}')">💾 حفظ</button>
          </div>
          ${p.hot?'<span class="bdg bgold2">⭐ الأكثر طلباً</span>':''}
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">${p.inc.map(i=>`<span style="background:var(--okb);color:var(--ok);border-radius:5px;padding:2px 8px;font-size:11px">${i}</span>`).join('')}${(p.gf||[]).map(i=>`<span style="background:var(--gbg);color:var(--gold);border-radius:5px;padding:2px 8px;font-size:11px">★ ${i}</span>`).join('')}</div>
      </div>`).join('');
  }

  // ── خدمات الفئة المختارة accordion ──
  function catServicesHtml(cat){
    const svcs=DEFSVC[cat]||[];
    if(!svcs.length) return '<div class="empty"><div class="ei">📋</div><p>لا توجد خدمات</p></div>';
    return svcs.map(svc=>`
      <div class="svrow">
        <div class="svhd" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.svarr').classList.toggle('open')">
          <span style="font-size:16px">📌</span>
          <span style="font-size:13px;font-weight:800;flex:1">${svc.name}</span>
          ${svc.priceRange?`<span class="bdg bgold2">${svc.priceRange}</span>`:''}
          <span class="svarr">▼</span>
        </div>
        <div class="svbd">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${svc.docs&&svc.docs.length?`<div class="svc-section"><div class="svc-section-ttl">📎 المستندات</div><ul class="svc-section-list">${svc.docs.map(d=>`<li>${d}</li>`).join('')}</ul></div>`:''}
            ${svc.timeline&&svc.timeline.length?`<div class="svc-section"><div class="svc-section-ttl">⏱ المدة</div><ul class="svc-section-list">${svc.timeline.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
            ${svc.steps&&svc.steps.length?`<div class="svc-section" style="grid-column:1/-1"><div class="svc-section-ttl">🔄 الخطوات</div><ul class="svc-section-list">${svc.steps.map((s,i)=>`<li><b style="color:var(--navy)">${i+1}.</b> ${s}</li>`).join('')}</ul></div>`:''}
            ${svc.payTerms&&svc.payTerms.length?`<div class="svc-section" style="grid-column:1/-1"><div class="svc-section-ttl">💰 شروط الدفع</div><ul class="svc-section-list">${svc.payTerms.map((p,i)=>`<li><b style="color:var(--gold)">دفعة ${i+1}:</b> ${p}</li>`).join('')}</ul></div>`:''}
            <div style="grid-column:1/-1;display:flex;justify-content:flex-end">
              <button class="btn bgold bsm" onclick="mQuote('${cat}','${svc.name}')">📄 إنشاء عرض سعر</button>
            </div>
          </div>
          ${svc.priceRange?`<div style="margin-top:10px;background:linear-gradient(135deg,var(--gbg),#fff);border:1.5px solid var(--gb);border-radius:10px;padding:11px 16px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;color:var(--tx2)">💰 نطاق السعر</span><span style="font-size:18px;font-weight:900;color:var(--gold)">${svc.priceRange}</span></div>`:''}
        </div>
      </div>`).join('');
  }

  return`<div>
  <!-- Header -->
  <div style="background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:var(--r);padding:22px 26px;color:#fff;margin-bottom:18px;position:relative;overflow:hidden">
    <div style="position:absolute;left:-20px;bottom:-20px;font-size:120px;opacity:.05;line-height:1">💰</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:20px;font-weight:900;margin-bottom:4px">💰 محرك التسعير</div>
        <div style="font-size:12px;opacity:.75">جميع أسعار الخدمات الهندسية — المرجع الرسمي للتسعير والشات بوت${hasCustom?' <span style="background:rgba(184,146,42,.5);border-radius:5px;padding:1px 7px;font-size:10px">✎ أسعار مخصصة</span>':''}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" style="background:rgba(184,146,42,.9);color:#fff;border:none" onclick="mQuote()">📄 إنشاء عرض سعر</button>
        <button class="btn" style="background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="showPricingPublic()">🌐 نافذة الموقع</button>
        ${hasCustom?'<button class="btn" style="background:rgba(220,38,38,.7);color:#fff;border:none;font-size:11.5px" onclick="peResetPrices()">🔄 استعادة الافتراضيات</button>':''}
      </div>
    </div>
    <!-- Stats Row -->
    <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
      <div style="background:rgba(255,255,255,.12);border-radius:9px;padding:9px 14px;font-size:11px">
        <div style="font-size:20px;font-weight:900;line-height:1">${Object.values(PRICES).reduce((t,c)=>t+Object.keys(c).length,0)}</div>
        <div style="opacity:.75;margin-top:2px">خدمة مسعّرة</div>
      </div>
      <div style="background:rgba(255,255,255,.12);border-radius:9px;padding:9px 14px;font-size:11px">
        <div style="font-size:20px;font-weight:900;line-height:1">${PKGS.length}</div>
        <div style="opacity:.75;margin-top:2px">باقة متاحة</div>
      </div>
      <div style="background:rgba(255,255,255,.12);border-radius:9px;padding:9px 14px;font-size:11px">
        <div style="font-size:20px;font-weight:900;line-height:1">${CATS.length}</div>
        <div style="opacity:.75;margin-top:2px">تصنيف</div>
      </div>
    </div>
  </div>

  <!-- Main Tabs -->
  <div class="tabs" style="margin-bottom:16px">
    <div class="tab ${activeTab==='services'?'act':''}" onclick="go('pricing_engine',{peCat:'${activeCat}',peTab:'services'})">📋 الخدمات</div>
    <div class="tab ${activeTab==='prices'?'act':''}" onclick="go('pricing_engine',{peCat:'${activeCat}',peTab:'prices'})">💲 جدول الأسعار</div>
    <div class="tab ${activeTab==='packages'?'act':''}" onclick="go('pricing_engine',{peCat:'${activeCat}',peTab:'packages'})">📦 الباقات</div>
    <div class="tab ${activeTab==='edit'?'act':''}" onclick="go('pricing_engine',{peCat:'${activeCat}',peTab:'edit'})" style="${activeTab==='edit'?'':'color:var(--gold);'}">✏️ تعديل الأسعار</div>
  </div>

  ${activeTab==='services'?`
  <!-- Category Selector -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    ${CATS.map(c=>`<button class="btn bsm ${c===activeCat?'bp':'bo'}" onclick="go('pricing_engine',{peCat:'${c}',peTab:'services'})">${c}</button>`).join('')}
  </div>
  <div class="card">
    <div class="ct"><div class="cti" style="background:var(--navy3)">📋</div>خدمات ${activeCat}</div>
    ${catServicesHtml(activeCat)}
  </div>
  `:''}

  ${activeTab==='prices'?`
  <!-- Price Table -->
  <div class="card">
    <div class="ct"><div class="cti" style="background:var(--gbg)">💲</div>جدول الأسعار الكامل
      <div style="margin-right:auto"><input class="ts" id="pe_srch" placeholder="🔍 بحث في الأسعار..." oninput="peSrch()" style="max-width:220px"></div>
    </div>
    <div style="overflow-x:auto">
      <table id="pe_tbl">
        <thead><tr>
          <th>التصنيف</th>
          <th>الخدمة</th>
          <th>السعر</th>
          <th>الوصف</th>
          <th></th>
        </tr></thead>
        <tbody id="pe_tbody">${priceTableHtml()}</tbody>
      </table>
    </div>
  </div>
  `:''}

  ${activeTab==='packages'?`
  <!-- Packages -->
  <div class="card" style="margin-bottom:14px">
    <div class="ct"><div class="cti" style="background:var(--gbg)">📦</div>باقات سكن خاص</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px">
      ${pkgs.slice(0,5).map(p=>`<div class="pkgc ${p.hot?'hot':''}">
        ${p.hot?'<div class="pkghot">⭐ الأكثر طلباً</div>':''}
        <div style="font-size:15px;font-weight:900;color:var(--navy);margin-bottom:6px;margin-top:${p.hot?'18px':'0'}">${p.nm}</div>
        <div style="font-size:26px;font-weight:900;color:var(--gold);margin-bottom:10px">${p.pr.toLocaleString('ar-KW')} <span style="font-size:13px;color:var(--mt)">د.ك</span></div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
          ${p.inc.map(i=>`<div style="font-size:11.5px;display:flex;gap:6px"><span style="color:var(--ok);font-weight:900;flex-shrink:0">✓</span>${i}</div>`).join('')}
          ${(p.gf||[]).map(i=>`<div style="font-size:11.5px;display:flex;gap:6px"><span style="color:var(--gold);flex-shrink:0">★</span>${i}</div>`).join('')}
        </div>
        ${p.note?`<div style="font-size:10.5px;color:var(--warn);background:var(--warnb);border-radius:6px;padding:5px 9px;margin-bottom:8px">${p.note}</div>`:''}
        <button class="btn bp" style="width:100%;font-size:12.5px" onclick="mQuote('سكن خاص','${p.nm}')">📄 اختيار هذه الباقة</button>
      </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="ct"><div class="cti" style="background:var(--navy3)">🏗️</div>باقات الإضافة والتعديل</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${pkgs.slice(5).map(p=>`<div class="pkgc">
        <div style="font-size:14px;font-weight:900;color:var(--navy);margin-bottom:6px">${p.nm}</div>
        <div style="font-size:20px;font-weight:900;color:var(--gold);margin-bottom:3px">${p.pr} <span style="font-size:12px;color:var(--mt)">د.ك</span>${p.prM?` <span style="font-size:11px;color:var(--tx2)">— ${p.prM} د.ك</span>`:''}</div>
        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:10px;margin-top:6px">
          ${p.inc.map(i=>`<div style="font-size:11px;display:flex;gap:5px"><span style="color:var(--ok);font-weight:900">✓</span>${i}</div>`).join('')}
        </div>
        ${p.note?`<div style="font-size:10.5px;color:var(--warn);background:var(--warnb);border-radius:5px;padding:5px 8px;margin-bottom:8px">${p.note}</div>`:''}
        <button class="btn bp bsm" style="width:100%" onclick="mQuote('سكن خاص','${p.nm}')">📄 عرض سعر</button>
      </div>`).join('')}
    </div>
  </div>
  `:''}

  ${activeTab==='edit'?`
  <!-- Edit Prices -->
  <div style="background:var(--warnb);border:1.5px solid var(--warnbr);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">⚠️</span>
    <div>
      <div style="font-size:13px;font-weight:700;color:var(--warn)">صفحة تعديل الأسعار</div>
      <div style="font-size:11.5px;color:var(--tx2)">التغييرات تُحفظ فوراً وتؤثر على الشات بوت وعروض الأسعار. ${hasCustom?'<b style="color:var(--warn)">الأسعار الحالية مخصصة.</b>':'الأسعار الحالية هي الافتراضية.'}</div>
    </div>
    <div style="margin-right:auto;display:flex;gap:6px">
      ${hasCustom?`<button class="btn bsm berr" onclick="peResetPrices()">🔄 إعادة تعيين</button>`:''}
    </div>
  </div>
  <!-- Category picker for edit -->
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
    ${CATS.map(c=>`<button class="btn bsm ${c===activeCat?'bp':'bo'}" onclick="go('pricing_engine',{peCat:'${c}',peTab:'edit'})">${c}</button>`).join('')}
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="ct"><div class="cti" style="background:var(--warnb)">✏️</div>تعديل أسعار ${activeCat}
      <span style="font-size:11px;color:var(--mt);margin-right:6px">(اضغط 💾 حفظ بعد كل تعديل)</span>
    </div>
    ${editPricesHtml(activeCat)}
  </div>
  <div class="card">
    <div class="ct"><div class="cti" style="background:var(--gbg)">📦</div>تعديل أسعار الباقات</div>
    ${editPkgsHtml()}
  </div>
  `:''}

  </div>`;
}

function peSrch(){
  const q=(document.getElementById('pe_srch')?.value||'').toLowerCase().trim();
  document.querySelectorAll('#pe_tbody tr').forEach(tr=>{
    tr.style.display=!q||tr.textContent.toLowerCase().includes(q)?'':'none';
  });
}

function showPricingPublic(){
  const w=window.open('','_blank','width=900,height=700,scrollbars=yes');
  const cats=CATS;
  let tabsHtml=cats.map((c,i)=>`<button onclick="showCat(${i})" id="ptab${i}" style="padding:8px 16px;border-radius:8px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;background:${i===0?'#1B3A6B':'transparent'};color:${i===0?'#fff':'#4B5563'};transition:all .2s">${c}</button>`).join('');
  let panes=cats.map((cat,ci)=>{
    const svcs=DEFSVC[cat]||[];
    const pkgs2=cat==='سكن خاص'?PKGS:[];
    let content='';
    if(pkgs2.length){
      content+=`<div style="margin-bottom:20px"><h3 style="font-size:15px;font-weight:900;color:#1B3A6B;margin-bottom:12px">📦 الباقات المتاحة</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">${pkgs2.slice(0,5).map(p=>`<div style="background:#fff;border:2px solid ${p.hot?'#B8922A':'#E5E7EB'};border-radius:12px;padding:14px;position:relative"><div style="font-size:14px;font-weight:900;color:#1B3A6B;margin-bottom:5px">${p.nm}</div><div style="font-size:22px;font-weight:900;color:#B8922A;margin-bottom:8px">${p.pr.toLocaleString()} <span style="font-size:11px;color:#9CA3AF">د.ك</span></div>${p.inc.slice(0,4).map(i=>`<div style="font-size:11px;display:flex;gap:5px;margin-bottom:3px"><span style="color:#059669">✓</span>${i}</div>`).join('')}${p.inc.length>4?`<div style="font-size:10.5px;color:#9CA3AF;margin-top:4px">+${p.inc.length-4} خدمة إضافية...</div>`:''}</div>`).join('')}</div></div>`;
    }
    content+=svcs.map(svc=>`<details style="border:1.5px solid #E5E7EB;border-radius:10px;margin-bottom:8px;overflow:hidden"><summary style="padding:12px 16px;cursor:pointer;font-weight:800;font-size:13px;background:#F9FAFB;display:flex;justify-content:space-between;align-items:center;list-style:none">${svc.name}${svc.priceRange?`<span style="background:#FFF8E8;color:#B8922A;border:1px solid #F0DCA0;border-radius:20px;padding:2px 10px;font-size:11px">${svc.priceRange}</span>`:''}</summary><div style="padding:14px 16px">${svc.docs&&svc.docs.length?`<div style="margin-bottom:10px"><b style="font-size:12px;color:#1B3A6B">📎 المستندات:</b><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">${svc.docs.map(d=>`<span style="background:#EEF2F9;color:#1B3A6B;border-radius:6px;padding:3px 8px;font-size:11px">${d}</span>`).join('')}</div></div>`:''}<div style="font-size:12px;color:#4B5563">${svc.steps&&svc.steps.length?`<b style="color:#1B3A6B">الخطوات:</b> ${svc.steps.join(' ← ')}`:''}</div></div></details>`).join('');
    return`<div id="ppane${ci}" style="display:${ci===0?'block':'none'}">${content}</div>`;
  }).join('');
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>أسعار خدمات مجموعة معمار</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;direction:rtl;background:#F0F4F8;color:#1A2332;padding:20px}h2{font-size:20px;font-weight:900;color:#1B3A6B}.wrap{max-width:920px;margin:0 auto}.hdr{background:linear-gradient(135deg,#1B3A6B,#2952A3);color:#fff;border-radius:14px;padding:22px 28px;margin-bottom:20px}.tabs{display:flex;gap:5px;flex-wrap:wrap;background:#fff;border-radius:10px;padding:5px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}</style></head><body><div class="wrap"><div class="hdr"><h2>🏛️ مجموعة معمار للاستشارات الهندسية</h2><p style="font-size:12px;opacity:.75;margin-top:5px">قائمة الخدمات والأسعار</p></div><div class="tabs">${tabsHtml}</div>${panes}</div><script>function showCat(i){document.querySelectorAll('[id^=ppane]').forEach((p,pi)=>p.style.display=pi===i?'block':'none');document.querySelectorAll('[id^=ptab]').forEach((t,ti)=>{t.style.background=ti===i?'#1B3A6B':'transparent';t.style.color=ti===i?'#fff':'#4B5563'})}<\/script></body></html>`);
  w.document.close();
}

// ─────────── QUOTE GENERATOR ───────────
function mQuote(cat,selSvc){
  cat=cat||S.params?.cat||CATS[0];
  const ss=DB.settings();
  const cls=DB.clients();
  const prj=DB.projects();
  const svcList=SVCS[cat]||[];
  const today_=today();
  const qNo=`Q-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  openM('📄 إنشاء عرض سعر',`
    <div class="fr fr2">
      <div class="fg"><label>النوع</label><select id="qCat" onchange="updQSvcs()">${CATS.map(c=>`<option value="${c}" ${c===cat?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="fg"><label>الخدمة</label><select id="qSvc">${svcList.map(s=>`<option ${s===selSvc?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="fr fr2">
      <div class="fg"><label>العميل</label><select id="qCl"><option value="">-- عميل محتمل --</option>${cls.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="fg"><label>السعر (د.ك)</label><input type="number" id="qPrice" step="0.01" placeholder="أدخل السعر..."></div>
    </div>
    <div class="fr fr2">
      <div class="fg"><label>رقم العرض</label><input id="qNo" value="${qNo}"></div>
      <div class="fg"><label>تاريخ العرض</label><input type="date" id="qDate" value="${today_}"></div>
    </div>
    <div class="fg"><label>ملاحظات إضافية</label><textarea id="qNotes" placeholder="أي ملاحظات أو شروط إضافية..."></textarea></div>
    <div style="margin-top:12px">
      <div style="font-size:11.5px;font-weight:700;color:var(--navy);margin-bottom:6px">📋 محتوى العرض</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <label class="toggle-row"><input type="checkbox" id="qShowDocs" checked><span>الوثائق المطلوبة</span></label>
        <label class="toggle-row"><input type="checkbox" id="qShowSteps" checked><span>الإجراءات والخطوات</span></label>
        <label class="toggle-row"><input type="checkbox" id="qShowTimeline" checked><span>المدة الزمنية</span></label>
        <label class="toggle-row"><input type="checkbox" id="qShowPay" checked><span>شروط الدفع</span></label>
        <label class="toggle-row"><input type="checkbox" id="qShowCo" checked><span>معلومات المكتب</span></label>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="btn bgold" onclick="printQuote()">🖨️ معاينة وطباعة</button>
      <button class="btn bo bsm" onclick="closeM()">إلغاء</button>
    </div>
  `,null,'lg');
  setTimeout(()=>updQSvcs(selSvc),80);
}

function updQSvcs(pre){
  const cat=document.getElementById('qCat')?.value;
  const ss=document.getElementById('qSvc');
  if(!ss||!cat)return;
  const list=SVCS[cat]||[];
  ss.innerHTML=list.map(s=>`<option ${s===pre?'selected':''}>${s}</option>`).join('');
}

function printQuote(){
  const cat=document.getElementById('qCat')?.value||'';
  const svc=document.getElementById('qSvc')?.value||'';
  const price=parseFloat(document.getElementById('qPrice')?.value)||null;
  const qNo=document.getElementById('qNo')?.value||'';
  const qDate=document.getElementById('qDate')?.value||today();
  const notes=document.getElementById('qNotes')?.value||'';
  const showDocs=document.getElementById('qShowDocs')?.checked;
  const showSteps=document.getElementById('qShowSteps')?.checked;
  const showTL=document.getElementById('qShowTimeline')?.checked;
  const showPay=document.getElementById('qShowPay')?.checked;
  const showCo=document.getElementById('qShowCo')?.checked;
  const clId=parseInt(document.getElementById('qCl')?.value)||null;
  const cl=clId?DB.clients().find(c=>c.id===clId):null;
  const ss=DB.settings();
  const svcData=(DEFSVC[cat]||[]).find(s=>s.name===svc)||null;
  const w=window.open('','_blank');
  const fmtDLocal=d=>d?new Date(d).toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'}):'—';
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
  <title>عرض سعر - ${svc}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Cairo',sans-serif;direction:rtl;color:#1A2332;background:#f5f7fb;padding:20px}
    .wrap{max-width:740px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.12)}
    .hdr{background:linear-gradient(135deg,#1B3A6B,#2952A3);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start}
    .co-name{font-size:20px;font-weight:900}
    .co-sub{font-size:11.5px;opacity:.75;margin-top:4px;line-height:1.7}
    .qinfo{text-align:left;font-size:12px;opacity:.85}
    .qinfo b{display:block;font-size:16px;font-weight:900;margin-bottom:4px;opacity:1}
    .body{padding:24px 32px}
    .sec{margin-bottom:18px}
    .sec-title{font-size:13px;font-weight:800;color:#1B3A6B;border-right:4px solid #B8922A;padding-right:10px;margin-bottom:10px}
    .sec ul{list-style:none;display:flex;flex-direction:column;gap:5px}
    .sec ul li{font-size:12.5px;display:flex;align-items:flex-start;gap:7px}
    .sec ul li::before{content:'●';color:#B8922A;font-weight:900;flex-shrink:0;margin-top:1px}
    .price-box{background:linear-gradient(135deg,#1B3A6B,#2952A3);color:#fff;border-radius:12px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;margin:16px 0}
    .price-lbl{font-size:13px;opacity:.85}
    .price-val{font-size:28px;font-weight:900}
    .pay-step{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#EEF2F9;border-radius:8px;margin-bottom:6px;font-size:12.5px}
    .pay-num{width:26px;height:26px;border-radius:50%;background:#1B3A6B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0}
    .cl-box{background:#EEF2F9;border-radius:10px;padding:12px 16px;margin-bottom:16px}
    .cl-ttl{font-size:11.5px;font-weight:700;color:#9CA3AF;margin-bottom:6px}
    .cl-nm{font-size:16px;font-weight:900;color:#1B3A6B}
    .sig{text-align:center;padding:16px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;margin-top:8px}
    .notes-box{background:#FFFBEB;border:1.5px solid #FCD34D;border-