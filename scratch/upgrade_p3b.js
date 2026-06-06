// PHASE 3b: Replace renderSummary to handle package mode vs custom mode
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// Find the renderSummary return block and replace it
const oldReturn = `    const qn = '#MEQ-' + String(Date.now()).slice(-6);
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

const newReturn = `    const qn = '#MEQ-' + String(Date.now()).slice(-6);
    const dateStr = new Date().toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'});
    const clr = cat?.color || '#4F46E5';

    // ════ PACKAGE MODE SUMMARY ════
    if (r.mode === 'package') {
      return \`<div class="qcard">
        <div class="qcard-hdr" style="background:linear-gradient(135deg,\${clr},\${clr}aa);">
          <div class="qcard-logo">مجموعة معمار للاستشارات الهندسية</div>
          <div class="qcard-company">عرض سعر — \${r.pkg.name}</div>
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
        <div class="qcard-body">

          <!-- Package Big Price Card -->
          <div style="background:linear-gradient(135deg,\${r.pkg.bg},\${r.pkg.bg}aa);border:2px solid \${r.pkg.color}22;border-radius:14px;padding:18px;text-align:center;margin-bottom:14px;">
            <div style="font-size:13px;color:\${r.pkg.color};font-weight:700;margin-bottom:4px;">\${r.pkg.icon} \${r.pkg.name}</div>
            <div style="font-size:11px;color:#94A3B8;margin-bottom:12px;">\${r.pkg.desc}</div>
            <div style="font-size:32px;font-weight:900;color:\${r.pkg.color};">\${r.isManualPkg ? '<span style="font-size:18px;color:#EF4444;">تسعير يدوي</span>' : Pricing2.fmt(r.pkgPrice)}</div>
            \${r.tier && !r.isCustomTier ? \`<div style="font-size:11px;color:#94A3B8;margin-top:4px;">السعر الأساسي \${Pricing2.fmt(r.pkg.basePrice)} · معامل المساحة ×\${r.tier.mult}</div>\` : ''}
          </div>

          <!-- Services List (informational only - no prices) -->
          \${r.pkg.showServices !== false ? \`
          <div class="qcard-sec-title">الخدمات المشمولة</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            \${r.pkgServices.map(s=>\`<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;padding:5px 8px;background:#F8FAFC;border-radius:8px;">
              <span>\${s.icon}</span><span>\${s.name}</span>
            </div>\`).join('')}
          </div>\` : ''}

          <!-- Gifts -->
          \${r.gifts.length && r.pkg.showGifts !== false ? \`
          <div class="qcard-sec-title" style="color:#D97706;">🎁 هدايا الباقة</div>
          <div style="background:#FFFBEB;border-radius:10px;padding:12px;">
            \${r.gifts.map(g=>\`<div style="font-size:12px;color:#92400E;padding:3px 0;">🎀 \${g}</div>\`).join('')}
          </div>\` : ''}

          <!-- Extra standalone services -->
          \${r.extraLines.length ? \`
          <div class="qcard-sec-title">خدمات إضافية مختارة</div>
          \${r.extraLines.map(l=>\`<div class="qline \${l.isManual?'manual':''}">
            <span class="qline-name">\${l.svc.icon} \${l.svc.name}</span>
            <span class="qline-amt">\${l.isManual ? 'يدوي' : Pricing2.fmt(l.amount)}</span>
          </div>\`).join('')}\` : ''}

          <!-- Add-ons -->
          \${r.addonLines.length ? \`
          <div class="qcard-sec-title">إضافات</div>
          \${r.addonLines.map(a=>\`<div class="qline"><span class="qline-name">\${a.icon} \${a.name}</span><span class="qline-amt">\${Pricing2.fmt(a.total)}</span></div>\`).join('')}\` : ''}

          <!-- Gov Fees -->
          \${r.feeLines.length ? \`
          <div class="qcard-sec-title">الرسوم الحكومية</div>
          \${r.feeLines.map(f=>\`<div class="qline gov"><span class="qline-name">🏛 \${f.name}</span><span class="qline-amt">\${Pricing2.fmt(f.total)}</span></div>\`).join('')}\` : ''}

          <!-- Grand Total -->
          <div class="qtotals">
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;">
              <span>سعر الباقة</span><span>\${r.isManualPkg ? '—' : Pricing2.fmt(r.pkgPrice)}</span>
            </div>
            \${r.extrasTotal ? \`<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>خدمات إضافية</span><span>\${Pricing2.fmt(r.extrasTotal)}</span></div>\` : ''}
            \${r.addonsTotal ? \`<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>إضافات</span><span>\${Pricing2.fmt(r.addonsTotal)}</span></div>\` : ''}
            \${r.feesTotal ? \`<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>رسوم حكومية</span><span>\${Pricing2.fmt(r.feesTotal)}</span></div>\` : ''}
            <div class="qgrand">
              <span class="qgrand-lbl">الإجمالي الكلي</span>
              <span class="qgrand-val" style="color:\${clr}">\${r.hasManualPricing ? \`<span class="qgrand-manual">يتطلب تسعيراً يدوياً</span>\` : Pricing2.fmt(r.grandTotal)}</span>
            </div>
          </div>

          <!-- Timeline -->
          \${PricingState2.showTimeline && r.pkg.duration && r.pkg.showTimeline !== false ? \`
          <div class="qcard-sec-title">الجدول الزمني المتوقع</div>
          <div style="text-align:center;padding:12px;background:#F0FDF4;border-radius:10px;">
            <div style="font-size:28px;font-weight:800;color:#059669;">\${r.pkg.duration}</div>
            <div style="font-size:12px;color:#64748B;">يوم عمل تقريباً</div>
          </div>\` : ''}

          <!-- Documents -->
          \${PricingState2.showDocs && reqDocs.length ? \`
          <div class="qcard-sec-title">المستندات المطلوبة</div>
          <div class="qdocs">\${reqDocs.map(d=>\`<div class="qdoc-item req">✅ \${d.name}</div>\`).join('')}</div>\` : ''}

          <!-- Notes & Conditions -->
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
    }

    // ════ CUSTOM/DETAILED MODE SUMMARY ════
    return \`<div class="qcard">
      <div class="qcard-hdr" style="background:linear-gradient(135deg,\${clr},\${clr}aa);">
        <div class="qcard-logo">مجموعة معمار للاستشارات الهندسية</div>
        <div class="qcard-company">عرض سعر تفصيلي</div>
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
      <div class="qcard-body">
        <div class="qcard-sec-title">التسعير التفصيلي</div>
        \${r.services.map(l=>\`<div class="qline \${l.isManual?'manual':''}">
          <span class="qline-name">\${l.svc.icon} \${l.svc.name}</span>
          <span class="qline-amt">\${l.isManual ? 'يدوي' : Pricing2.fmt(l.amount)}</span>
        </div>\`).join('')}
        \${r.addonLines.length ? \`<div class="qcard-sec-title">إضافات</div>
          \${r.addonLines.map(a=>\`<div class="qline"><span class="qline-name">\${a.icon} \${a.name}</span><span class="qline-amt">\${Pricing2.fmt(a.total)}</span></div>\`).join('')}\` : ''}
        \${r.feeLines.length ? \`<div class="qcard-sec-title">الرسوم الحكومية</div>
          \${r.feeLines.map(f=>\`<div class="qline gov"><span class="qline-name">🏛 \${f.name}</span><span class="qline-amt">\${Pricing2.fmt(f.total)}</span></div>\`).join('')}\` : ''}
        <div class="qtotals">
          \${r.servicesTotal ? \`<div class="qtotal-row"><span>مجموع الخدمات</span><span>\${Pricing2.fmt(r.servicesTotal)}</span></div>\` : ''}
          \${r.addonsTotal ? \`<div class="qtotal-row"><span>الإضافات</span><span>\${Pricing2.fmt(r.addonsTotal)}</span></div>\` : ''}
          \${r.feesTotal ? \`<div class="qtotal-row"><span>الرسوم الحكومية</span><span>\${Pricing2.fmt(r.feesTotal)}</span></div>\` : ''}
          <div class="qgrand">
            <span class="qgrand-lbl">الإجمالي الكلي</span>
            <span class="qgrand-val" style="color:\${clr}">\${r.hasManualPricing ? \`<span class="qgrand-manual">+ تسعير يدوي</span>\` : ''} \${Pricing2.fmt(r.grandTotal)}</span>
          </div>
        </div>
        \${PricingState2.showTimeline && r.services?.some(l=>l.svc.duration) ? \`
        <div class="qcard-sec-title">الجدول الزمني</div>
        <div class="qtimeline">
          \${r.services.filter(l=>l.svc.duration).map(l=>\`<div class="qtl-item">\${l.svc.icon} \${l.svc.name}<span class="qtl-days">\${l.svc.duration}ي</span></div>\`).join('')}
        </div>\` : ''}
        \${PricingState2.showDocs && reqDocs.length ? \`
        <div class="qcard-sec-title">المستندات المطلوبة</div>
        <div class="qdocs">\${reqDocs.map(d=>\`<div class="qdoc-item req">✅ \${d.name}</div>\`).join('')}</div>\` : ''}
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

c = c.replace(oldReturn, newReturn);
fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Phase 3b done. Lines:', c.split('\n').length);
