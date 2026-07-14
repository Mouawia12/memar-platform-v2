// Fix renderSummary to use documentsBySector + generalConditions + paymentTerms
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// Fix the reqDocs selection in renderSummary
const oldReqDocs = `    const reqDocs = PricingDB2.documentsMaster.filter(d => {
      if (PricingState2.category === 'residential') return d.condition === PricingState2.resType;
      return d.required;
    });`;

const newReqDocs = `    // Get documents from new sector-specific structure
    const docsBySector = PricingDB2.documentsBySector?.[PricingState2.category];
    const reqDocs = docsBySector?.[PricingState2.resType] ||
                   docsBySector?.['new_const'] ||
                   PricingDB2.documentsMaster.filter(d => d.required) || [];`;

c = c.replace(oldReqDocs, newReqDocs);

// Fix conditions in PACKAGE MODE summary
const oldConds1 = `          \${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
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
    }`;

const newConds1 = `          \${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul>
            \${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}
          </ul></div>\` : ''}

          \${PricingState2.showConditions && PricingDB2.paymentTerms ? \`<div class="qcard-sec-title">شروط الدفع</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;">
              <span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span>
              <span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span>
            </div>\`).join('')}
          </div>\` : ''}

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
    }`;

c = c.replace(oldConds1, newConds1);

// Fix conditions in CUSTOM MODE summary too
const oldConds2 = `        \${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul><li>الأسعار بالدينار الكويتي (KWD)</li><li>العرض غير شامل للتعديلات الجوهرية</li><li>الرسوم الحكومية قابلة للتغيير</li></ul></div>\` : ''}
        <div class="qcard-validity">⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار</div>`;

const newConds2 = `        \${PricingState2.showConditions ? \`<div class="qcard-sec-title">الشروط والأحكام</div>
          <div class="qconds"><ul>\${(PricingDB2.generalConditions||[]).map(t=>\`<li>\${t}</li>\`).join('')}</ul></div>
          \${PricingDB2.paymentTerms ? \`<div class="qcard-sec-title">شروط الدفع</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            \${PricingDB2.paymentTerms.map((pt,i)=>\`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;"><span>الدفعة \${['الأولى','الثانية','الثالثة'][i]}: \${pt.desc}</span><span style="font-weight:700;color:#4F46E5">\${pt.pct}%</span></div>\`).join('')}
          </div>\` : ''}\` : ''}
        <div class="qcard-validity">⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار</div>`;

c = c.replace(oldConds2, newConds2);

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Summary conditions fixed. Lines:', c.split('\n').length);
