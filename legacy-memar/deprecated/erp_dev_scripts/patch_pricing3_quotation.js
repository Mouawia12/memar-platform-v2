const fs = require('fs');
let code = fs.readFileSync('pricing3.js', 'utf8');

// Replace the old openQuotationCreator with logic to switch mode
code = code.replace(
  "openQuotationCreator() {",
  "openQuotationCreator() {\n    PricingState3.isQuotationMode = true;\n    Pricing3.render();\n  }\n\n  closeQuotationCreator() {\n    PricingState3.isQuotationMode = false;\n    Pricing3.render();\n  }\n\n  openQuotationCreatorOld() {"
);

// We need to intercept the render() method to check for isQuotationMode
code = code.replace(
  "render() {",
  "render() {\n    if (PricingState3.isQuotationMode) {\n      return this.renderQuotationScreen();\n    }\n"
);

// Add renderQuotationScreen method right before renderNewHeader
code = code.replace(
  "renderNewHeader() {",
  `renderQuotationScreen() {
    const pg = document.getElementById('p-pricing3');
    if (!pg) return;
    
    // Fetch clients
    let clients = [];
    try {
      if (window.DB_TABLES && window.DB_TABLES.users) {
        clients = window.DB_TABLES.users.filter(u => u.role === 'client');
      } else {
        clients = JSON.parse(localStorage.getItem('memar_clients') || '[]');
      }
    } catch(e) {}
    
    const clientOptions = clients.map(c => \`<option value="\${c.name}"></option>\`).join('');
    
    pg.innerHTML = \`
      <div class="pr3-container" style="padding:24px;">
        <!-- Professional Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; background:linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding:20px 30px; border-radius:12px; color:white; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
           <div>
             <div style="font-size:36px; font-weight:900; display:flex; align-items:center; gap:12px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
               <span style="color:#DCA83A;">💰</span> محرك التسعير
             </div>
             <div style="font-size:14px; opacity:0.9; margin-top:4px;">إنشاء عرض سعر تفصيلي للعميل</div>
           </div>
           <button class="pr3-btn pr3-btn-secondary" onclick="Pricing3.closeQuotationCreator()">🔙 العودة للرئيسية</button>
        </div>
        
        <!-- Quotation Form Container -->
        <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:1px solid #E5E7EB; margin-bottom:24px;">
          
          <datalist id="clients-list">\${clientOptions}</datalist>
          <datalist id="blocks-list">
             \${[...Array(15).keys()].map(i=>\`<option value="\${i+1}"></option>\`).join('')}
          </datalist>

          <!-- Row 1: Notes (left), Plot, Block, Region, Client -->
          <div style="display:flex; gap:16px; margin-bottom:20px; align-items:flex-end;">
            <div class="p2-field" style="flex:2;">
              <label class="p2-label" style="font-size:12px;color:#4B5563;font-weight:700;">📝 الملاحظات</label>
              <input type="text" class="p2-input" id="quote-notes" value="\${PricingState3.notes || ''}" oninput="PricingState3.notes=this.value;Pricing3.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%;">
            </div>
            
            <div class="p2-field" style="flex:1.5;">
              <label class="p2-label" style="font-size:12px;color:#4B5563;font-weight:700;">🏠 القسيمة</label>
              <input type="text" class="p2-input" id="quote-plot" value="\${PricingState3.plot || ''}" oninput="PricingState3.plot=this.value;Pricing3.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%;">
            </div>

            <div class="p2-field" style="flex:1.5;">
              <label class="p2-label" style="font-size:12px;color:#4B5563;font-weight:700;">🔢 القطعة</label>
              <input type="text" list="blocks-list" class="p2-input" id="quote-block" value="\${PricingState3.block || ''}" oninput="PricingState3.block=this.value;Pricing3.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%;" placeholder="أدخل القطعة...">
            </div>
            
            <div class="p2-field" style="flex:1.5;">
              <label class="p2-label" style="font-size:12px;color:#4B5563;font-weight:700;">📍 المنطقة</label>
              <select class="p2-input" id="quote-region" onchange="PricingState3.region=this.value;Pricing3.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%;">
                <option value=""></option>
                \${['العاصمة','حولي','الفروانية','الأحمدي','الجهراء','مبارك الكبير'].map(r=>\`<option value="\${r}" \${PricingState3.region===r?'selected':''}>\${r}</option>\`).join('')}
              </select>
            </div>
            
            <div class="p2-field" style="flex:2;">
              <label class="p2-label" style="font-size:12px;color:#4B5563;font-weight:700;">👤 اسم العميل</label>
              <input type="text" list="clients-list" class="p2-input" id="quote-client" value="\${PricingState3.clientName || ''}" oninput="PricingState3.clientName=this.value;Pricing3.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%;" placeholder="اختر أو اكتب اسم العميل...">
            </div>
          </div>
          
          <!-- Row 2: Area and Project Type -->
          <div style="display:flex; gap:24px; align-items:center; background:#F9FAFB; padding:16px; border-radius:8px; border:1px solid #F3F4F6;">
            <!-- Area Slider (takes appropriate space) -->
            <div style="display:flex; align-items:center; gap:16px; flex:2;">
              <div style="min-width:100px; text-align:center;">
                <span style="font-size:28px; font-weight:900; color:#1e3c72;">\${PricingState3.area}</span>
                <span style="font-size:14px; color:#6B7280; font-weight:700;">م²</span>
              </div>
              <input type="range" id="area-slider" min="100" max="1500" step="50" value="\${Math.min(PricingState3.area,1500)}"
                style="flex:1; accent-color:#DCA83A; cursor:pointer;"
                oninput="PricingState3.area=+this.value;PricingState3.customArea=false;Pricing3.refresh()">
              <div style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-left:12px; border-left:1px solid #E5E7EB; padding-left:12px;">
                <span style="font-size:11px;color:#6B7280;font-weight:700;">الأدوار</span>
                <input type="number" value="\${PricingState3.floors||1}" min="1" max="50" oninput="PricingState3.floors=Math.max(1,+this.value);Pricing3.refreshSummary()" style="width:40px; text-align:center; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; padding:4px;">
              </div>
            </div>

            <!-- Project Type (New Build vs Modification) -->
            <div style="display:flex; gap:8px; flex:1;">
              <div class="restype-pill \${PricingState3.resType==='new_const'?'active':''}" onclick="PricingState3.resType='new_const';Pricing3.refresh()" style="flex:1; padding:12px; border:2px solid #E5E7EB; border-radius:8px; text-align:center; font-weight:700; cursor:pointer; color:#4B5563; background:\${PricingState3.resType==='new_const'?'#E0F2FE':'white'}; border-color:\${PricingState3.resType==='new_const'?'#0284C7':'#E5E7EB'};">🏗️ بناء جديد</div>
              <div class="restype-pill \${PricingState3.resType==='mod_add'?'active':''}" onclick="PricingState3.resType='mod_add';Pricing3.refresh()" style="flex:1; padding:12px; border:2px solid #E5E7EB; border-radius:8px; text-align:center; font-weight:700; cursor:pointer; color:#4B5563; background:\${PricingState3.resType==='mod_add'?'#E0F2FE':'white'}; border-color:\${PricingState3.resType==='mod_add'?'#0284C7':'#E5E7EB'};">🛠️ تعديل وإضافة</div>
            </div>
          </div>
        </div>

        <!-- The actual layout for quotation (Step 1,3,4,5, Summary) -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
           <div style="display:flex; flex-direction:column; gap:16px;">
             <div style="background:white; border-radius:12px; padding:16px; border:1px solid #E5E7EB; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
               \${this.renderStep1()}
             </div>
             <div style="background:white; border-radius:12px; padding:16px; border:1px solid #E5E7EB; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
               \${this.renderStep3()}
             </div>
           </div>
           
           <!-- Services & Addons and Summary -->
           <div style="display:flex; flex-direction:column; gap:16px;">
             <div style="background:white; border-radius:12px; padding:16px; border:1px solid #E5E7EB; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <div style="font-size:18px; font-weight:800; color:#1F2937;">🖨️ عرض السعر النهائي</div>
                  <button class="pr3-btn pr3-btn-primary" style="padding:6px 12px; font-size:12px;" onclick="window.print()">🖨️ طباعة العرض</button>
                </div>
                <div id="pricing-summary-panel">
                  \${this.renderSummary()}
                </div>
             </div>
           </div>
        </div>
        
      </div>
    \`;
  }

  renderNewHeader() {`
);

// Make the main header 'محرك التسعير' text bigger
code = code.replace(
  `class="pr3-title"><span style="color:#DCA83A">💰</span> محرك التسعير</div>`,
  `class="pr3-title" style="font-size:32px; font-weight:900;"><span style="color:#DCA83A">💰</span> محرك التسعير</div>`
);

fs.writeFileSync('pricing3.js', code, 'utf8');
console.log('Patch successful');
