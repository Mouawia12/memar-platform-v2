const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

const oldLayoutStart = `          <!-- Professional Client Header + Area Slider -->
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
          </div>

          <!-- Bottom Grid: Left (Services, Addons) & Right (Summary) -->
          <div class="p2-main-grid" style="display:grid; grid-template-columns:360px 1fr; gap:24px; align-items:start;">
            
            <div class="p2-grid-left" style="display:flex; flex-direction:column; gap:16px;">
              \${this.renderStep4()}
              \${this.renderStep5()}
              
            </div>

            <div class="p2-grid-right" style="display:flex; flex-direction:column; gap:16px; position:sticky; top:24px;">
              <div id="pricing-summary-panel">
                \${this.renderSummary()}
              </div>
            </div>

          </div>`;

const newLayout = `          <!-- Professional Client Header + Area Slider -->
          <div class="p2-client-info" style="display:flex; flex-direction:column; gap:16px; background:#fff; padding:20px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
            
            <div style="display:grid; grid-template-columns:2fr 1.5fr 1fr 1.5fr 3fr; gap:16px; align-items:center;">
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">👤 اسم العميل</label>
                <input class="p2-input" id="quote-client" value="\${PricingState2.clientName || ''}" oninput="PricingState2.clientName=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">📍 المنطقة</label>
                <select class="p2-input" id="quote-region" onchange="PricingState2.region=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;">
                  <option value=""></option>
                  \${['العاصمة','حولي','الفروانية','الأحمدي','الجهراء','مبارك الكبير'].map(r=>\`<option value="\${r}" \${PricingState2.region===r?'selected':''}>\${r}</option>\`).join('')}
                </select></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">🔢 القطعة</label>
                <select class="p2-input" id="quote-block" onchange="PricingState2.block=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;">
                  <option value=""></option>
                  \${[...Array(15).keys()].map(i=>\`<option value="\${i+1}" \${PricingState2.block==String(i+1)?'selected':''}>\${i+1}</option>\`).join('')}
                </select></div>
              
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">🏠 القسيمة</label>
                <input type="text" class="p2-input" id="quote-plot" value="\${PricingState2.plot || ''}" oninput="PricingState2.plot=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>

              <div class="p2-field" style="margin:0;">
                \${this.renderStep2()}
              </div>
            </div>

            <div style="border-top:1px dashed #E2E8F0; padding-top:16px;">
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">📝 الملاحظات</label>
                <input class="p2-input" id="quote-notes" value="\${PricingState2.notes || ''}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>
            </div>
          </div>

          <!-- Row 2: Sector/Category (Right, Bigger) & Packages (Left, Smaller) -->
          <div class="p2-middle-row" style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom: 24px;">
            <div>\${this.renderStep1()}</div> <!-- Right (First child in RTL) -->
            <div>\${this.renderStep3()}</div> <!-- Left (Second child in RTL) -->
          </div>

          <!-- Bottom Grid: Summary (Right, Bigger) & Services (Left, Smaller) -->
          <div class="p2-main-grid" style="display:grid; grid-template-columns: 1fr 340px; gap:24px; align-items:start;">
            
            <!-- First child in RTL -> Right -> Quote Summary -->
            <div class="p2-grid-right" style="display:flex; flex-direction:column; gap:16px; position:sticky; top:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:-8px;">
                <div style="font-size:18px; font-weight:800; color:#1E293B;">🖨️ عرض السعر النهائي</div>
                <button class="admin-btn" style="background:#1E293B; color:#fff;" onclick="window.print()">🖨️ طباعة العرض</button>
              </div>
              <div id="pricing-summary-panel">
                \${this.renderSummary()}
              </div>
            </div>

            <!-- Second child in RTL -> Left -> Services & Addons -->
            <div class="p2-grid-left" style="display:flex; flex-direction:column; gap:16px;">
              \${this.renderStep4()}
              \${this.renderStep5()}
            </div>

          </div>`;

c = c.replace(oldLayoutStart, newLayout);

// Also remove the body padding from renderStep2 so it blends nicely in the grid cell
const oldStep2Body = `      <div class="p2-step-body" style="padding:12px 16px;">`;
const newStep2Body = `      <div class="p2-step-body" style="padding:0;">`;
c = c.replace(oldStep2Body, newStep2Body);

// Make renderStep2 a bit cleaner for the top row
const oldAreaHeader = `      <div class="p2-step-hdr">
        
        <div><div class="p2-step-title">مساحة المشروع / القسيمة</div><div class="p2-step-sub">حدد المساحة الإجمالية بالمتر المربع</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.manageAreaTiers()">⚙️ إعدادات الشرائح</button>\` : ''}
      </div>`;
const newAreaHeader = `      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;margin:0;">📐 مساحة المشروع/القسيمة (م²)</label>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="padding:2px 6px; font-size:10px;" onclick="Pricing2.manageAreaTiers()">⚙️ شرائح</button>\` : ''}
      </div>`;
c = c.replace(oldAreaHeader, newAreaHeader);

// Clean up area div wrap
c = c.replace('return `<div class="p2-step">', 'return `<div class="p2-step-area-wrapper">');

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Layout 6 updated.');
