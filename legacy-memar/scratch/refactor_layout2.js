const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Update Pricing2.render() layout
const oldRender = `          <!-- Main Grid: Left (Area, Services, Addons) & Right (Packages, Summary) -->
          <div class="p2-main-grid" style="display:grid; grid-template-columns:360px 1fr; gap:24px; align-items:start;">
            
            <div class="p2-grid-left" style="display:flex; flex-direction:column; gap:16px;">
              \${this.renderStep2()}
              \${this.renderStep3()}
              \${this.renderStep4()}
              \${this.renderStep5()}
              \${this.renderStep6()}
            </div>

            <div class="p2-grid-right" style="display:flex; flex-direction:column; gap:16px; position:sticky; top:24px;">
              <div id="pricing-summary-panel">
                \${this.renderSummary()}
              </div>
            </div>

          </div>`;

const newRender = `          <!-- Row 2: Packages (Right in RTL) & Area (Left in RTL) -->
          <div class="p2-middle-row" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom: 16px;">
            <div>\${this.renderStep3()}</div>
            <div>\${this.renderStep2()}</div>
          </div>

          <!-- Bottom Grid: Left (Services, Addons) & Right (Summary) -->
          <div class="p2-main-grid" style="display:grid; grid-template-columns:360px 1fr; gap:24px; align-items:start;">
            
            <div class="p2-grid-left" style="display:flex; flex-direction:column; gap:16px;">
              \${this.renderStep4()}
              \${this.renderStep5()}
              \${this.renderStep6()}
            </div>

            <div class="p2-grid-right" style="display:flex; flex-direction:column; gap:16px; position:sticky; top:24px;">
              <div id="pricing-summary-panel">
                \${this.renderSummary()}
              </div>
            </div>

          </div>`;
c = c.replace(oldRender, newRender);

// 2. Make renderStep2() more horizontal and compact
const oldStep2Body = `      <div class="p2-step-body">
        <div class="area-val-display">
          <span class="area-val-num">\${PricingState2.area}</span>
          <span class="area-val-unit">م²</span>
        </div>
        <input type="range" id="area-slider" min="100" max="1500" step="50" value="\${Math.min(PricingState2.area,1500)}"
          style="width:100%;accent-color:var(--p2-primary,#4F46E5);cursor:pointer;"
          oninput="PricingState2.area=+this.value;PricingState2.customArea=false;Pricing2.refresh()">
        <div class="area-tier-info">
          <span class="area-tier-badge \${tier.custom?'custom-tier':'normal'}">
            🏷️ \${tier.label} · معامل: ×\${tier.custom?'تسعير يدوي':tier.mult}
          </span>
        </div>
        \${tier.custom ? \`<div class="p2-custom-tier-warning" style="margin-top:12px;">⚠️ المساحة أكبر من 1000 م² — يتطلب تسعيراً يدوياً واعتمادًا من الإدارة</div>\` : ''}
        <div class="area-presets">
          \${presets.map(a=>\`<div class="area-preset \${!PricingState2.customArea&&PricingState2.area===a?'active':''}" onclick="PricingState2.area=\${a};PricingState2.customArea=false;document.getElementById('area-slider').value=\${a};Pricing2.refresh()">\${a} م²</div>\`).join('')}
          <div class="area-preset \${PricingState2.customArea?'active':''}" onclick="PricingState2.customArea=true;Pricing2.refresh()">✏️ مخصص</div>
        </div>
        \${PricingState2.customArea ? \`<div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
          <input type="number" class="p2-input" id="custom-area-input" value="\${PricingState2.area}" min="50" max="50000" style="max-width:160px" placeholder="أدخل المساحة">
          <span style="font-size:13px;color:#64748B">م²</span>
        </div>\` : ''}
      </div>`;

const newStep2Body = `      <div class="p2-step-body" style="padding:12px 16px;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="area-val-display" style="margin:0; min-width:80px; text-align:center;">
            <span class="area-val-num" style="font-size:24px;">\${PricingState2.area}</span>
            <span class="area-val-unit">م²</span>
          </div>
          <input type="range" id="area-slider" min="100" max="1500" step="50" value="\${Math.min(PricingState2.area,1500)}"
            style="flex:1;accent-color:var(--p2-primary,#4F46E5);cursor:pointer;"
            oninput="PricingState2.area=+this.value;PricingState2.customArea=false;Pricing2.refresh()">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <div class="area-tier-info" style="margin:0;">
            <span class="area-tier-badge \${tier.custom?'custom-tier':'normal'}" style="font-size:10px; padding:4px 8px;">
              🏷️ \${tier.label}
            </span>
          </div>
          <div class="area-presets" style="margin:0; gap:4px; flex-wrap:nowrap; overflow-x:auto;">
            \${presets.slice(0,5).map(a=>\`<div class="area-preset \${!PricingState2.customArea&&PricingState2.area===a?'active':''}" style="padding:4px 8px;font-size:10px;" onclick="PricingState2.area=\${a};PricingState2.customArea=false;document.getElementById('area-slider').value=\${a};Pricing2.refresh()">\${a}</div>\`).join('')}
            <div class="area-preset \${PricingState2.customArea?'active':''}" style="padding:4px 8px;font-size:10px;" onclick="PricingState2.customArea=true;Pricing2.refresh()">✏️ مخصص</div>
          </div>
        </div>
        \${tier.custom ? \`<div class="p2-custom-tier-warning" style="margin-top:8px;font-size:11px;padding:8px;">⚠️ مساحة كبيرة — تسعير يدوي</div>\` : ''}
        \${PricingState2.customArea ? \`<div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
          <input type="number" class="p2-input" id="custom-area-input" value="\${PricingState2.area}" min="50" max="50000" style="max-width:120px;padding:4px;font-size:12px;" placeholder="أدخل المساحة">
          <span style="font-size:12px;color:#64748B">م²</span>
        </div>\` : ''}
      </div>`;
c = c.replace(oldStep2Body, newStep2Body);

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Layout updated.');
