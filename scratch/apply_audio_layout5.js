const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

const oldLayoutStart = `          <!-- Professional Client Header -->
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
          </div>
          <!-- Top Row: Sector/Category (Horizontal) -->
          <div class="p2-top-row" style="width:100%;">
            \${this.renderStep1()}
          </div>

          <!-- Row 2: Packages (Right in RTL) & Area (Left in RTL) -->
          <div class="p2-middle-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom: 16px;">
            <div>\${this.renderStep3()}</div>
            <div>\${this.renderStep2()}</div>
          </div>`;

const newLayout = `          <!-- Professional Client Header + Area Slider -->
          <div class="p2-client-info" style="display:flex; flex-direction:column; gap:16px; background:#fff; padding:16px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 2fr; gap:16px;">
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">👤 اسم العميل</label>
                <input class="p2-input" id="quote-client" placeholder="الاسم..." value="\${PricingState2.clientName || ''}" oninput="PricingState2.clientName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">📍 المنطقة</label>
                <select class="p2-input" id="quote-region" onchange="PricingState2.region=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;">
                  <option value="">اختر...</option>
                  \${['العاصمة','حولي','الفروانية','الأحمدي','الجهراء','مبارك الكبير'].map(r=>\`<option value="\${r}" \${PricingState2.region===r?'selected':''}>\${r}</option>\`).join('')}
                </select></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">🔢 القطعة</label>
                <select class="p2-input" id="quote-block" onchange="PricingState2.block=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;">
                  <option value="">اختر...</option>
                  \${[...Array(15).keys()].map(i=>\`<option value="\${i+1}" \${PricingState2.block==String(i+1)?'selected':''}>\${i+1}</option>\`).join('')}
                </select></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">🏠 القسيمة</label>
                <input type="text" class="p2-input" id="quote-plot" placeholder="رقم/حرف..." value="\${PricingState2.plot || ''}" oninput="PricingState2.plot=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>

              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;">📝 ملاحظات</label>
                <input class="p2-input" id="quote-notes" placeholder="إضافية..." value="\${PricingState2.notes || ''}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:14px; background:transparent;"></div>
            </div>
            <div style="border-top:1px dashed #E2E8F0; padding-top:16px;">
              \${this.renderStep2()}
            </div>
          </div>

          <!-- Row 2: Packages (Left in RTL) & Sector/Category (Right in RTL) -->
          <div class="p2-middle-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom: 16px;">
            <div>\${this.renderStep3()}</div> <!-- Left -->
            <div>\${this.renderStep1()}</div> <!-- Right -->
          </div>`;

c = c.replace(oldLayoutStart, newLayout);

// Also remove the "Land Area" field as they asked the Area Slider to serve as the plot area/built area. 
// "مساحة القسيمة لستة اختيارات او سلايدر، ومخصص تعديل مخصص... جزء مساحة المشروع دا تخليه هو اللي جنب بيانات العميل والقسيمة فوق"

// Fix area step title from 'مساحة المشروع' to 'مساحة المشروع / القسيمة'
c = c.replace('<div class="p2-step-title">مساحة المشروع</div>', '<div class="p2-step-title">مساحة المشروع / القسيمة</div>');
// Remove the step number 2 visually so it blends smoothly into the header.
c = c.replace('<div class="p2-step-num">٢</div>', '');

// Remove step number 1 and 3 to keep it clean since they are moved around
c = c.replace('<div class="p2-step-num">١</div>', '');
c = c.replace('<div class="p2-step-num">٣</div>', '');
c = c.replace('<div class="p2-step-num">٤</div>', '');
c = c.replace('<div class="p2-step-num">٥</div>', '');

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Layout 5 executed.');
