const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Update Client Info Header
const oldClientInfo = `          <!-- Professional Client Header -->
          <div class="p2-client-info" style="display:grid; grid-template-columns:1fr 1fr 2fr; gap:24px; background:#fff; padding:16px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">👤 اسم العميل الكريم</label>
              <input class="p2-input" id="quote-client" placeholder="اسم العميل..." value="\${PricingState2.clientName}" oninput="PricingState2.clientName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">📍 اسم / موقع المشروع</label>
              <input class="p2-input" id="quote-project" placeholder="مثال: فيلا حولي — قطعة 12" value="\${PricingState2.projectName}" oninput="PricingState2.projectName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">📝 ملاحظات العرض</label>
              <input class="p2-input" id="quote-notes" placeholder="ملاحظات إضافية للظهور في عرض السعر..." value="\${PricingState2.notes}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
          </div>`;

const newClientInfo = `          <!-- Professional Client Header -->
          <div class="p2-client-info" style="display:grid; grid-template-columns:repeat(5, 1fr) 2fr; gap:16px; background:#fff; padding:16px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div class="p2-field" style="margin:0; grid-column:span 2;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">👤 اسم العميل</label>
              <input class="p2-input" id="quote-client" placeholder="الاسم..." value="\${PricingState2.clientName || ''}" oninput="PricingState2.clientName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
            
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">📍 المنطقة</label>
              <input class="p2-input" id="quote-region" placeholder="المنطقة..." value="\${PricingState2.region || ''}" oninput="PricingState2.region=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
            
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">🔢 القطعة</label>
              <input class="p2-input" id="quote-block" placeholder="القطعة..." value="\${PricingState2.block || ''}" oninput="PricingState2.block=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
            
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">🏠 القسيمة</label>
              <input class="p2-input" id="quote-plot" placeholder="القسيمة..." value="\${PricingState2.plot || ''}" oninput="PricingState2.plot=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>

            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">📐 مساحة الأرض</label>
              <input class="p2-input" id="quote-land" placeholder="م²" value="\${PricingState2.landArea || ''}" oninput="PricingState2.landArea=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>

            <div class="p2-field" style="margin:0; grid-column:span 6;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">📝 ملاحظات</label>
              <input class="p2-input" id="quote-notes" placeholder="ملاحظات إضافية..." value="\${PricingState2.notes || ''}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
          </div>`;
c = c.replace(oldClientInfo, newClientInfo);

// Update renderSummary location details format to use new fields
const oldLocDisplay = `<div class="qcard-meta-val">\${cat?.icon} \${cat?.label}</div></div>
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">المساحة</div><div class="qcard-meta-val">\${r.area} م²\${r.isCustomTier?' 🔴':''}</div></div>`;

const newLocDisplay = `<div class="qcard-meta-val">\${cat?.icon} \${cat?.label}</div></div>
        <div class="qcard-meta-cell"><div class="qcard-meta-lbl">مساحة البناء</div><div class="qcard-meta-val">\${r.area} م²\${r.isCustomTier?' 🔴':''}</div></div>
        \${PricingState2.region || PricingState2.block || PricingState2.plot ? \`
        <div class="qcard-meta-cell" style="grid-column:span 2"><div class="qcard-meta-lbl">الموقع</div><div class="qcard-meta-val">\${PricingState2.region ? 'منطقة ' + PricingState2.region + '، ' : ''}\${PricingState2.block ? 'قطعة ' + PricingState2.block + '، ' : ''}\${PricingState2.plot ? 'قسيمة ' + PricingState2.plot : ''} \${PricingState2.landArea ? '(مساحة الأرض: '+PricingState2.landArea+' م²)' : ''}</div></div>
        \` : ''}`;

c = c.replaceAll(oldLocDisplay, newLocDisplay);


// 2. Add Service button at the bottom of renderStep4()
const oldStep4End = `        </div>
      </div>
    </div>\`;
  },`;

const newStep4End = `        </div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="width:100%; padding:12px; margin-top:16px; border:2px dashed #CBD5E1; background:transparent; color:#64748B;" onclick="Pricing2.addService()">➕ إضافة خدمة جديدة وتحديد السعر (مخصص للإدارة)</button>\` : ''}
      </div>
    </div>\`;
  },`;
c = c.replace(oldStep4End, newStep4End);


// 3. Add Service unit dropdown in addService() and editService()
const oldAddSvcUnit = `<div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="svc-unit" value="م²"></div>`;
const newAddSvcUnit = `<div class="form-group"><label class="form-label">الوحدة (التسعير)</label>
          <select class="form-input" id="svc-unit">
            <option value="مقطوع">مقطوع (إجمالي المساحة)</option>
            <option value="م²">على المتر المربع</option>
            <option value="دور">على الدور (للتصميم الداخلي)</option>
          </select>
        </div>`;
c = c.replace(oldAddSvcUnit, newAddSvcUnit);

const oldEditSvcUnit = `<div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="edit-svc-unit" value="\${s.unit}"></div>`;
const newEditSvcUnit = `<div class="form-group"><label class="form-label">الوحدة (التسعير)</label>
          <select class="form-input" id="edit-svc-unit">
            <option value="مقطوع" \${s.unit==='مقطوع'?'selected':''}>مقطوع (إجمالي المساحة)</option>
            <option value="م²" \${s.unit==='م²'?'selected':''}>على المتر المربع</option>
            <option value="دور" \${s.unit==='دور'?'selected':''}>على الدور (للتصميم الداخلي)</option>
          </select>
        </div>`;
c = c.replace(oldEditSvcUnit, newEditSvcUnit);


// 4. Update PriceCalc2.calcService to handle 'دور'
// We will add an input for floors if a service with 'دور' is selected, or just let 'دور' multiply by 1 and the user can edit it, or we add a floors state.
// Let's add PricingState2.floors inside PricingState2.
const oldState = `  govFees: true, showDocs: true, showTimeline: true, showConditions: true,
  adminMode: false,
  clientName: '', projectName: '', notes: ''
};`;
const newState = `  govFees: true, showDocs: true, showTimeline: true, showConditions: true,
  adminMode: false,
  clientName: '', region: '', block: '', plot: '', landArea: '', notes: '', floors: 1
};`;
c = c.replace(oldState, newState);

const oldCalcSvc = `    if (svc.unit !== 'م²') return rate;
    const tier = this.getAreaTier(area);
    const tierMult = tier.custom ? 1 : tier.mult;
    return area * rate * tierMult;
  },`;
const newCalcSvc = `    if (svc.unit === 'دور') return rate * (PricingState2.floors || 1);
    if (svc.unit !== 'م²') return rate; // مقطوع
    const tier = this.getAreaTier(area);
    const tierMult = tier.custom ? 1 : tier.mult;
    return area * rate * tierMult;
  },`;
c = c.replace(oldCalcSvc, newCalcSvc);


// Add floors input in Area step if needed, or in Client Info. Let's add it in renderStep2 (Area)
const oldStep2Body = `<div class="area-val-display" style="margin:0; min-width:80px; text-align:center;">
            <span class="area-val-num" style="font-size:24px;">\${PricingState2.area}</span>
            <span class="area-val-unit">م²</span>
          </div>`;
const newStep2Body = `<div class="area-val-display" style="margin:0; min-width:80px; text-align:center;">
            <span class="area-val-num" style="font-size:24px;">\${PricingState2.area}</span>
            <span class="area-val-unit">م²</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-right:12px; border-right:1px solid #E2E8F0; padding-right:12px;">
            <span style="font-size:10px;color:#94A3B8;">الأدوار</span>
            <input type="number" value="\${PricingState2.floors||1}" min="1" max="50" oninput="PricingState2.floors=Math.max(1,+this.value);Pricing2.refreshSummary()" style="width:40px; text-align:center; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; padding:2px;">
          </div>`;
c = c.replace(oldStep2Body, newStep2Body);


fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Client format and Service Pricing implemented.');
