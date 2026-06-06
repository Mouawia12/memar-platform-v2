const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Remove renderStep6 from Pricing2.render()
c = c.replace('${this.renderStep6()}', '');

// 2. Insert Client Info Row above Top Row
const oldRenderTop = `          <!-- Top Row: Sector/Category (Horizontal) -->`;
const newClientHeader = `          <!-- Professional Client Header -->
          <div class="p2-client-info" style="display:grid; grid-template-columns:1fr 1fr 2fr; gap:24px; background:#fff; padding:16px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">👤 اسم العميل الكريم</label>
              <input class="p2-input" id="quote-client" placeholder="اسم العميل..." value="\${PricingState2.clientName}" oninput="PricingState2.clientName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">📍 اسم / موقع المشروع</label>
              <input class="p2-input" id="quote-project" placeholder="مثال: فيلا حولي — قطعة 12" value="\${PricingState2.projectName}" oninput="PricingState2.projectName=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
            <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;">📝 ملاحظات العرض</label>
              <input class="p2-input" id="quote-notes" placeholder="ملاحظات إضافية للظهور في عرض السعر..." value="\${PricingState2.notes}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:none; border-bottom:2px solid #E2E8F0; border-radius:0; padding:8px 0; font-weight:800; font-size:15px; background:transparent;"></div>
          </div>
          <!-- Top Row: Sector/Category (Horizontal) -->`;
c = c.replace(oldRenderTop, newClientHeader);

// 3. Update CSS for hidden sections
const cssEnd = `</style>\`);`;
const newCss = `.qcard-sec-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-top:16px; }
.qcard-sec-title { margin-bottom:0 !important; border:none !important; padding-bottom:0 !important; margin-top:0 !important; }
.sec-toggle { cursor:pointer; background:none; border:none; opacity:0.3; font-size:14px; transition:all 0.2s; padding:4px; }
.sec-toggle:hover { opacity:1; transform:scale(1.1); }
.hidden-sec .qcard-sec-content { display:none; }
.hidden-sec .qcard-sec-title { color: #94A3B8 !important; text-decoration: line-through; }
@media print { .hidden-sec { display:none !important; } .sec-toggle { display:none !important; } .qcard-sec-hdr { border:none; margin-bottom:4px; padding-bottom:0; } }
</style>\`);`;
c = c.replace(cssEnd, newCss);

// 4. We will replace sections in renderSummary() with the new toggleable HTML.
// This is somewhat complex, so we will do a targeted replacement block by block.

// Gov Fees Block
const oldGovFeesPackage = `<div class="qcard-sec-title">الرسوم الحكومية</div>
          \${r.feeLines.map(f=>\`<div class="qline"><span>\${f.name}</span><span class="qval">\${f.price} د.ك</span></div>\`).join('')}`;

const newGovFeesPackage = `<div class="qcard-section \${!PricingState2.govFees ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr"><div class="qcard-sec-title">🏛 الرسوم الحكومية</div>
            <button class="sec-toggle" onclick="PricingState2.govFees = !PricingState2.govFees; Pricing2.refreshSummary()">\${PricingState2.govFees ? '👁️' : '🙈'}</button></div>
            <div class="qcard-sec-content">
              \${r.feeLines.map(f=>\`<div class="qline"><span>\${f.name}</span><span class="qval">\${f.price} د.ك</span></div>\`).join('')}
            </div>
          </div>`;

c = c.replace(oldGovFeesPackage, newGovFeesPackage);

const oldGovFeesCustom = `\${r.feeLines.length ? \`<div class="qcard-sec-title">الرسوم الحكومية</div>
        \${r.feeLines.map(f=>\\\`<div class="qline"><span>\\\${f.name}</span><span class="qval">\\\${f.price} د.ك</span></div>\\\`).join('')}\` : ''}`;

const newGovFeesCustom = `\${r.feeLines.length ? \`<div class="qcard-section \${!PricingState2.govFees ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr"><div class="qcard-sec-title">🏛 الرسوم الحكومية</div>
          <button class="sec-toggle" onclick="PricingState2.govFees = !PricingState2.govFees; Pricing2.refreshSummary()">\${PricingState2.govFees ? '👁️' : '🙈'}</button></div>
          <div class="qcard-sec-content">
            \${r.feeLines.map(f=>\\\`<div class="qline"><span>\\\${f.name}</span><span class="qval">\\\${f.price} د.ك</span></div>\\\`).join('')}
          </div>
        </div>\` : ''}`;
c = c.replace(oldGovFeesCustom, newGovFeesCustom);


// Timeline Block
const oldTimeline = `\${PricingState2.showTimeline && r.pkg.duration && r.pkg.showTimeline !== false ? \`
          <div class="qcard-sec-title">الجدول الزمني المتوقع</div>
          <div class="qconds"><ul>
            <li>المدة الإجمالية التقديرية: <strong>\${r.pkg.duration} يوم عمل</strong></li>
            <li>المدة قابلة للتغيير بناءً على سرعة استجابة الجهات الحكومية والمالك.</li>
          </ul></div>
          \` : ''}`;

const newTimeline = `\${r.pkg.duration && r.pkg.showTimeline !== false ? \`
          <div class="qcard-section \${!PricingState2.showTimeline ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr"><div class="qcard-sec-title">⏳ الجدول الزمني المتوقع</div>
            <button class="sec-toggle" onclick="PricingState2.showTimeline = !PricingState2.showTimeline; Pricing2.refreshSummary()">\${PricingState2.showTimeline ? '👁️' : '🙈'}</button></div>
            <div class="qcard-sec-content">
              <div class="qconds"><ul>
                <li>المدة الإجمالية التقديرية: <strong>\${r.pkg.duration} يوم عمل</strong></li>
                <li>المدة قابلة للتغيير بناءً على سرعة استجابة الجهات الحكومية والمالك.</li>
              </ul></div>
            </div>
          </div>
          \` : ''}`;
c = c.replace(oldTimeline, newTimeline);

// Docs Block
const oldDocs = `\${PricingState2.showDocs && reqDocs.length ? \`
          <div class="qcard-sec-title">المستندات المطلوبة</div>
          <div class="qconds"><ul>\${reqDocs.map(d=>\`<li>\${d.name} \${d.required?'<span style="color:#EF4444;font-size:10px;">(إلزامي)</span>':''}</li>\`).join('')}</ul></div>
          \` : ''}`;

const newDocs = `\${reqDocs.length ? \`
          <div class="qcard-section \${!PricingState2.showDocs ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr"><div class="qcard-sec-title">📄 المستندات المطلوبة</div>
            <button class="sec-toggle" onclick="PricingState2.showDocs = !PricingState2.showDocs; Pricing2.refreshSummary()">\${PricingState2.showDocs ? '👁️' : '🙈'}</button></div>
            <div class="qcard-sec-content">
              <div class="qconds"><ul>\${reqDocs.map(d=>\`<li>\${d.name} \${d.required?'<span style="color:#EF4444;font-size:10px;">(إلزامي)</span>':''}</li>\`).join('')}</ul></div>
            </div>
          </div>
          \` : ''}`;
c = c.replace(oldDocs, newDocs);


// Conditions & Payment Terms Block (Package Mode)
const oldCondsPkg = `\${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul>
            \${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}
          </ul></div>\` : ''}

          \${PricingState2.showConditions && PricingDB2.paymentTerms ? \`<div class="qcard-sec-title">شروط الدفع</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;">
              <span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span>
              <span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span>
            </div>\`).join('')}
          </div>\` : ''}`;

const newCondsPkg = `<div class="qcard-section \${!PricingState2.showConditions ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr"><div class="qcard-sec-title">⚠️ الشروط والأحكام وشروط الدفع</div>
            <button class="sec-toggle" onclick="PricingState2.showConditions = !PricingState2.showConditions; Pricing2.refreshSummary()">\${PricingState2.showConditions ? '👁️' : '🙈'}</button></div>
            <div class="qcard-sec-content">
              <div class="qconds"><ul>
                \${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}
              </ul></div>
              \${PricingDB2.paymentTerms ? \`
              <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">
                \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;">
                  <span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span>
                  <span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span>
                </div>\`).join('')}
              </div>\` : ''}
            </div>
          </div>`;
c = c.replace(oldCondsPkg, newCondsPkg);


// Conditions & Payment Terms Block (Custom Mode)
const oldCondsCustom = `\${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul>\${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}</ul></div>
          \${PricingDB2.paymentTerms ? \`<div class="qcard-sec-title">شروط الدفع</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;"><span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span><span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span></div>\`).join('')}
          </div>\` : ''}\` : ''}`;

const newCondsCustom = `<div class="qcard-section \${!PricingState2.showConditions ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr"><div class="qcard-sec-title">⚠️ الشروط والأحكام وشروط الدفع</div>
          <button class="sec-toggle" onclick="PricingState2.showConditions = !PricingState2.showConditions; Pricing2.refreshSummary()">\${PricingState2.showConditions ? '👁️' : '🙈'}</button></div>
          <div class="qcard-sec-content">
            <div class="qconds"><ul>\${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}</ul></div>
            \${PricingDB2.paymentTerms ? \`
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">
              \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;"><span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span><span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span></div>\`).join('')}
            </div>\` : ''}
          </div>
        </div>`;
c = c.replace(oldCondsCustom, newCondsCustom);

// 5. Notes are already at the top now, we can remove the old Notes block from renderSummary
const oldNotesPkg = `\${PricingState2.notes ? \`<div class="qcard-sec-title">ملاحظات</div><div class="qnotes">\${PricingState2.notes}</div>\` : ''}`;
c = c.replace(oldNotesPkg, '');
const oldNotesCustom = `\${PricingState2.notes ? \`<div class="qcard-sec-title">ملاحظات</div><div class="qnotes">\${PricingState2.notes}</div>\` : ''}`;
c = c.replace(oldNotesCustom, '');


fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Summary Toggles and Client Info applied.');
