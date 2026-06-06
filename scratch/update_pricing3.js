const fs = require('fs');

function updateFile() {
    let content = fs.readFileSync('erp/pricing2.js', 'utf8');

    const pdfOldDocs = `\${PricingState2.showDocs ? \`
    <div class="sec-title">المستندات المطلوبة</div>
    <div class="docs">
      \${PricingDB2.documentsMaster.filter(d=>d.required).map(d=>\`<div class="doc req">✅ \${d.name} — إلزامي</div>\`).join('')}
      \${PricingDB2.documentsMaster.filter(d=>!d.required).map(d=>\`<div class="doc">📎 \${d.name}</div>\`).join('')}
    </div>\` : ''}

    \${PricingState2.notes ? \`
    <div class="notes-box">📝 <strong>ملاحظات:</strong> \${PricingState2.notes}</div>\` : ''}`;

    const pdfNewDocs = `\${PricingState2.showDocs ? \`
    <div class="sec-title">المستندات المطلوبة</div>
    <div class="docs">
      \${PricingDB2.documentsMaster.filter(d=>d.required).map(d=>\`<div class="doc req">✅ \${d.name} — إلزامي</div>\`).join('')}
      \${PricingDB2.documentsMaster.filter(d=>!d.required).map(d=>\`<div class="doc">📎 \${d.name}</div>\`).join('')}
    </div>\` : ''}

    \${PricingState2.showTimeline && r.services.some(l => l.svc.duration) ? \`
    <div class="sec-title">الجدول الزمني المتوقع</div>
    <div class="docs" style="columns:2;">
      \${r.services.filter(l => l.svc.duration).map(l => \`<div class="doc">🕒 \${l.svc.name}: <strong style="color:#4F46E5">\${l.svc.duration} يوم</strong></div>\`).join('')}
    </div>\` : ''}

    \${PricingState2.notes ? \`
    <div class="notes-box">📝 <strong>ملاحظات:</strong> \${PricingState2.notes}</div>\` : ''}
    
    \${PricingState2.showConditions ? \`
    <div class="notes-box" style="background:#F8FAFC; border-color:#E2E8F0;">
      <strong style="color:#64748B">⚠️ الشروط والأحكام:</strong>
      <ul style="margin-right:20px; color:#475569; margin-top:5px;">
         <li>الأسعار بالدينار الكويتي (KWD).</li>
         <li>العرض غير شامل لأي تعديلات جوهرية على نطاق العمل بعد الاعتماد.</li>
         <li>الرسوم الحكومية قابلة للتغيير وفق تحديثات الجهات الرسمية.</li>
      </ul>
    </div>\` : ''}`;

    content = content.replace(pdfOldDocs, pdfNewDocs);

    fs.writeFileSync('erp/pricing2.js', content, 'utf8');
}

updateFile();
