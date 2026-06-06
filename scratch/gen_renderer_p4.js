// Part 4: New renderSummary + fix bindEvents for new UI
const fs = require('fs');
let content = fs.readFileSync('erp/pricing2.js', 'utf8');

const oldSummary = `  /* ── Summary Panel ───────────────────────────── */
  renderSummary() {
    const r = PriceCalc2.calcTotal();
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);

    // Required documents
    const reqDocs = PricingDB2.documentsMaster.filter(d => {
      if (PricingState2.category === 'residential') {
          return d.condition === PricingState2.resType;
      }
      return d.required;
    });`;

const newSummary = `  /* ── Summary Panel (NEW DESIGN) ── */
  renderSummary() {
    const r = PriceCalc2.calcTotal();
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    const reqDocs = PricingDB2.documentsMaster.filter(d => {
      if (PricingState2.category === 'residential') return d.condition === PricingState2.resType;
      return d.required;
    });`;

content = content.replace(oldSummary, newSummary);

// Now replace the renderSummary body (the return statement)
const oldReturn = `    return \`
      <div class="quote-card">
        <!-- Quote Header -->
        <div class="quote-header" style="background:\${cat?.color || 'var(--primary)'}">
          <div class="quote-logo">م</div>
          <div>
            <div class="quote-company">مجموعة معمار للاستشارات الهندسية</div>
            <div class="quote-tagline">Kuwait Engineering Consultancy Group</div>
          </div>
        </div>

        <!-- Meta -->
        <div class="quote-meta">
          <div class="quote-meta-item">
            <span class="qm-label">التاريخ</span>
            <span class="qm-value">\${new Date().toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'})}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">رقم العرض</span>
            <span class="qm-value" style="font-family:'Inter'">#MEQ-\${String(Date.now()).slice(-6)}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">النوع</span>
            <span class="qm-value">\${cat?.icon} \${cat?.label}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">المساحة</span>
            <span class="qm-value">\${r.area} م²</span>
          </div>
        </div>

        \${PricingState2.clientName ? \`
        <div class="quote-client-section">
          <div class="quote-client-label">مقدّم لـ:</div>
          <div class="quote-client-name">\${PricingState2.clientName}</div>
          \${PricingState2.projectName ? \`<div class="quote-client-project">📍 \${PricingState2.projectName}</div>\` : ''}
        </div>\` : ''}

        <!-- Breakdown -->
        <div class="quote-section-title">تفاصيل التسعير</div>
        <div class="quote-lines">
          \${r.services.map(l => \`
            <div class="q-line">
              <span class="q-line-name">\${l.svc.icon} \${l.svc.name}</span>
              <span class="q-line-amt">\${l.isManual ? 'تسعير يدوي' : this.fmt(l.amount)}</span>
            </div>\`).join('')}

          \${r.discountAmount > 0 ? \`
            <div class="q-line discount">
              <span class="q-line-name">🏷 خصم الباقة (\${r.discount}%)</span>
              <span class="q-line-amt" style="color:var(--success)">− \${this.fmt(r.discountAmount)}</span>
            </div>\` : ''}

          \${r.addonLines.length ? \`
            <div class="q-divider">خدمات إضافية</div>
            \${r.addonLines.map(a => \`
              <div class="q-line">
                <span class="q-line-name">\${a.icon} \${a.name}</span>
                <span class="q-line-amt">\${this.fmt(a.total)}</span>
              </div>\`).join('')}\` : ''}

          \${r.feeLines.length ? \`
            <div class="q-divider">الرسوم الحكومية</div>
            \${r.feeLines.map(f => \`
              <div class="q-line gov">
                <span class="q-line-name">🏛 \${f.name}</span>
                <span class="q-line-amt">\${this.fmt(f.total)}</span>
              </div>\`).join('')}\` : ''}
        </div>

        <!-- Totals -->
        <div class="quote-totals">
          <div class="q-total-row">
            <span>مجموع الخدمات</span>
            <span>\${this.fmt(r.servicesTotal)}</span>
          </div>
          \${r.discountAmount > 0 ? \`
          <div class="q-total-row green">
            <span>بعد الخصم</span>
            <span>\${this.fmt(r.netServices)}</span>
          </div>\` : ''}
          \${r.addonsTotal > 0 ? \`
          <div class="q-total-row">
            <span>الإضافات</span>
            <span>\${this.fmt(r.addonsTotal)}</span>
          </div>\` : ''}
          \${r.feesTotal > 0 ? \`
          <div class="q-total-row">
            <span>الرسوم الحكومية</span>
            <span>\${this.fmt(r.feesTotal)}</span>
          </div>\` : ''}
          <div class="q-grand-total">
            <span>الإجمالي الكلي</span>
            <span class="q-grand-value">\${r.hasManualPricing ? "تسعير يدوي + " + this.fmt(r.grandTotal) : this.fmt(r.grandTotal)}</span>
          </div>
        </div>

        <!-- Package badge -->
        \${pkg && pkg.id !== 'custom' ? \`
        <div class="q-package-badge" style="background:\${pkg.bg};color:\${pkg.color}">
          \${pkg.icon} \${pkg.name} \${pkg.discount > 0 ? \`· خصم \${pkg.discount}%\` : ''}
        </div>\` : ''}

        <!-- Documents -->
        \${PricingState2.showDocs && reqDocs.length ? \`
        <div class="quote-section-title" style="margin-top:14px">📄 المستندات المطلوبة</div>
        <div class="docs-list">
          \${PricingDB2.documentsMaster.filter(d => d.required).map(d => \`
            <div class="doc-item required">✅ \${d.name} <span class="doc-tag">إلزامي</span></div>\`).join('')}
          \${PricingDB2.documentsMaster.filter(d => !d.required).map(d => \`
            <div class="doc-item">📎 \${d.name}</div>\`).join('')}
        </div>\` : ''}

        
        <!-- Timeline Engine -->
        \${PricingState2.showTimeline && r.services.some(l => l.svc.duration) ? \`
        <div class="quote-section-title" style="margin-top:14px">⏳ الجدول الزمني المتوقع</div>
        <div class="docs-list" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          \${r.services.filter(l => l.svc.duration).map(l => \`
            <div class="doc-item" style="font-size:12px;">🕒 \${l.svc.name}: <strong style="color:var(--primary)">\${l.svc.duration} يوم</strong></div>
          \`).join('')}
        </div>\` : ''}

        <!-- Notes -->
        \${PricingState2.notes ? \`
        <div class="quote-notes">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">ملاحظات</div>
          <div>\${PricingState2.notes}</div>
        </div>\` : ''}
        
        <!-- Conditions -->
        \${PricingState2.showConditions ? \`
        <div class="quote-notes" style="background:#F8FAFC; border-color:#E2E8F0; margin-top:10px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">⚠️ الشروط والأحكام</div>
          <ul style="font-size:11px; padding-right:16px; color:#475569; margin:0;">
             <li>الأسعار بالدينار الكويتي (KWD).</li>
             <li>العرض غير شامل لأي تعديلات جوهرية على نطاق العمل بعد الاعتماد.</li>
             <li>الرسوم الحكومية قابلة للتغيير وفق تحديثات الجهات الرسمية.</li>
          </ul>
        </div>\` : ''}

        <!-- Validity -->
        <div class="quote-validity">
          ⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار
        </div>

        <!-- Export Buttons -->
        <div class="quote-actions">
          <button class="btn btn-success" style="flex:1" onclick="Pricing2.exportWhatsApp()">
            💬 إرسال واتساب
          </button>
          <button class="btn btn-primary" style="flex:1" onclick="Pricing2.exportPDF()">
            📄 تنزيل PDF
          </button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-secondary" style="flex:1" onclick="Pricing2.copyQuote()">
            📋 نسخ النص
          </button>
          <button class="btn btn-secondary" style="flex:1" onclick="Pricing2.saveQuote()">
            💾 حفظ في النظام
          </button>
        </div>
      </div>\`;
  },`;

const newReturn = `    const qn = '#MEQ-' + String(Date.now()).slice(-6);
    const dateStr = new Date().toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'});
    return \`<div class="qcard">
      <div class="qcard-hdr" style="background:linear-gradient(135deg,\${cat?.color||'#4F46E5'},\${cat?.color||'#4F46E5'}bb);">
        <div class="qcard-logo">مجموعة معمار للاستشارات الهندسية</div>
        <div class="qcard-company">عرض سعر هندسي</div>
        <div class="qcard-en">Kuwait Engineering Consultancy Group</div>
      </div>
      <div class="qcard-meta">
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">التاريخ</div><div class="qcard-meta-val">\${dateStr}</div></div>
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">رقم العرض</div><div class="qcard-meta-val" style="font-family:'Inter',monospace">\${qn}</div></div>
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">النوع</div><div class="qcard-meta-val">\${cat?.icon} \${cat?.label}</div></div>
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">المساحة</div><div class="qcard-meta-val">\${r.area} م²\${r.isCustomTier?' 🔴':''}</div></div>
      </div>
      \${PricingState2.clientName ? \`<div class="qcard-client">
        <div class="qcard-client-to">مقدّم إلى</div>
        <div class="qcard-client-name">\${PricingState2.clientName}</div>
        \${PricingState2.projectName ? \`<div style="font-size:12px;color:#64748B;margin-top:3px;">📍 \${PricingState2.projectName}</div>\` : ''}
      </div>\` : ''}
      \${pkg && pkg.id !== 'custom' ? \`<div class="qcard-pkg">
        <span class="qcard-pkg-pill" style="background:\${pkg.bg};color:\${pkg.color}">\${pkg.icon} \${pkg.name} \${pkg.discount>0 ? '· خصم '+pkg.discount+'%' : ''}</span>
      </div>\` : ''}
      <div class="qcard-body">
        <div class="qcard-sec-title">تفاصيل التسعير</div>
        \${r.services.map(l => \`<div class="qline \${l.isManual?'manual':''}">
          <span class="qline-name">\${l.svc.icon} \${l.svc.name}</span>
          <span class="qline-amt">\${l.isManual ? 'يدوي' : Pricing2.fmt(l.amount)}</span>
        </div>\`).join('')}
        \${r.discountAmount > 0 ? \`<div class="qline discount">
          <span class="qline-name">🏷 خصم الباقة (\${r.discount}%)</span>
          <span class="qline-amt">− \${Pricing2.fmt(r.discountAmount)}</span>
        </div>\` : ''}
        \${r.addonLines.length ? \`<div class="qcard-sec-title">خدمات إضافية</div>
          \${r.addonLines.map(a=>\`<div class="qline"><span class="qline-name">\${a.icon} \${a.name}</span><span class="qline-amt">\${Pricing2.fmt(a.total)}</span></div>\`).join('')}\` : ''}
        \${r.feeLines.length ? \`<div class="qcard-sec-title">الرسوم الحكومية</div>
          \${r.feeLines.map(f=>\`<div class="qline gov"><span class="qline-name">🏛 \${f.name}</span><span class="qline-amt">\${Pricing2.fmt(f.total)}</span></div>\`).join('')}\` : ''}
        <div class="qtotals">
          \${r.servicesTotal !== r.netServices ? \`<div class="qtotal-row"><span>مجموع الخدمات</span><span>\${Pricing2.fmt(r.servicesTotal)}</span></div>\` : ''}
          \${r.discountAmount>0 ? \`<div class="qtotal-row green"><span>بعد الخصم</span><span>\${Pricing2.fmt(r.netServices)}</span></div>\` : ''}
          \${r.addonsTotal>0 ? \`<div class="qtotal-row"><span>الإضافات</span><span>\${Pricing2.fmt(r.addonsTotal)}</span></div>\` : ''}
          \${r.feesTotal>0 ? \`<div class="qtotal-row"><span>الرسوم الحكومية</span><span>\${Pricing2.fmt(r.feesTotal)}</span></div>\` : ''}
          <div class="qgrand">
            <span class="qgrand-lbl">الإجمالي الكلي</span>
            <span class="qgrand-val" style="color:\${cat?.color||'#4F46E5'}">\${r.isCustomTier ? \`<span class="qgrand-manual">تسعير يدوي</span>\` : Pricing2.fmt(r.grandTotal)}</span>
          </div>
        </div>
        \${PricingState2.showDocs && reqDocs.length ? \`
          <div class="qcard-sec-title">المستندات المطلوبة</div>
          <div class="qdocs">
            \${reqDocs.map(d=>\`<div class="qdoc-item req">✅ \${d.name}</div>\`).join('')}
          </div>\` : ''}
        \${PricingState2.showTimeline && r.services.some(l=>l.svc.duration) ? \`
          <div class="qcard-sec-title">الجدول الزمني</div>
          <div class="qtimeline">
            \${r.services.filter(l=>l.svc.duration).map(l=>\`<div class="qtl-item">\${l.svc.icon} \${l.svc.name}<span class="qtl-days">\${l.svc.duration}ي</span></div>\`).join('')}
          </div>\` : ''}
        \${PricingState2.notes ? \`<div class="qcard-sec-title">ملاحظات</div><div class="qnotes">\${PricingState2.notes}</div>\` : ''}
        \${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul><li>الأسعار بالدينار الكويتي (KWD)</li><li>العرض غير شامل للتعديلات الجوهرية</li><li>الرسوم الحكومية قابلة للتغيير</li></ul></div>\` : ''}
        <div class="qcard-validity">⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار</div>
      </div>
      <div class="qcard-actions">
        <button class="qbtn qbtn-wa" onclick="Pricing2.exportWhatsApp()">💬 إرسال واتساب</button>
        <button class="qbtn qbtn-pdf" onclick="Pricing2.exportPDF()">📄 تنزيل PDF</button>
        <div class="qbtn-row">
          <button class="qbtn qbtn-copy" onclick="Pricing2.copyQuote()">📋 نسخ النص</button>
          <button class="qbtn qbtn-save" onclick="Pricing2.saveQuote()">💾 حفظ</button>
        </div>
      </div>
    </div>\`;
  },`;

content = content.replace(oldReturn, newReturn);

// Fix bindEvents to handle new UI elements
const oldAreaPills = `    // Area pills
    document.querySelectorAll('.area-pill').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.area === 'custom') {
          PricingState2.customArea = !PricingState2.customArea;
        } else {
          PricingState2.area = +el.dataset.area;
          PricingState2.customArea = false;
        }
        this.refresh();
      });
    });`;

const newAreaPills = `    // Area pills (legacy - now handled inline)
    document.querySelectorAll('.area-pill').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.area === 'custom') {
          PricingState2.customArea = !PricingState2.customArea;
        } else {
          PricingState2.area = +el.dataset.area;
          PricingState2.customArea = false;
        }
        this.refresh();
      });
    });
    // Area slider
    document.getElementById('area-slider')?.addEventListener('input', e => {
      PricingState2.area = +e.target.value;
      PricingState2.customArea = false;
      // update display without full refresh
      const disp = document.querySelector('.area-val-num');
      if (disp) disp.textContent = PricingState2.area;
      this.refreshSummary();
    });`;

content = content.replace(oldAreaPills, newAreaPills);

// Fix service checkboxes binding - now use click on div instead of checkbox change
const oldSvcCheck = `    // Service checkboxes
    document.querySelectorAll('.svc-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.svc;
        if (el.checked) { if (!PricingState2.services.includes(id)) PricingState2.services.push(id); }
        else             { PricingState2.services = PricingState2.services.filter(s => s !== id); }
        PricingState2.package = 'custom';
        this.refreshSummary();
        this.highlightSvcRows();
      });
    });

    // Add-on checkboxes
    document.querySelectorAll('.addon-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.addon;
        if (el.checked) { if (!PricingState2.addons.includes(id)) PricingState2.addons.push(id); }
        else             { PricingState2.addons = PricingState2.addons.filter(a => a !== id); }
        this.refreshSummary();
      });
    });`;

const newSvcCheck = `    // Service clicks (new UI - handled via toggleService inline)
    // Addon clicks - handled via toggleAddon inline`;

content = content.replace(oldSvcCheck, newSvcCheck);

fs.writeFileSync('erp/pricing2.js', content, 'utf8');
console.log('Part 4 done. Lines:', content.split('\n').length);
