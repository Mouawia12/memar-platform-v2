const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// The new methods to replace the placeholder rFinanceTab and add payment functions
const newFinanceLogic = `  rFinanceTab(p) {
    const cost = p.cost || 0;
    const paid = p.paid || 0;
    const remaining = cost - paid;
    const ratio = cost > 0 ? Math.round((paid / cost) * 100) : 0;
    const payments = p.payments || [];
    
    // Warning for delayed payments (heuristic: if remaining > 0 and project is late, or just show if not fully paid)
    const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && remaining > 0;
    
    let html = \`
<div class="g2" style="margin-bottom:20px">
  <div class="card" style="border:1px solid var(--border)">
    <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي العقد</div>
    <div style="font-size:28px;font-weight:900;color:var(--text)">\${cost} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
  <div class="card" style="border:1px solid var(--border)">
    <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي المحصّل</div>
    <div style="font-size:28px;font-weight:900;color:var(--success)">\${paid} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
  <div class="card" style="border:1px solid \${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--border)'};background:\${remaining > 0 ? (isLate ? 'var(--danger-50)' : 'var(--warning-50)') : 'var(--bg-card)'}">
    <div style="font-size:12px;color:\${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--text-3)'};margin-bottom:4px">المبلغ المتبقي</div>
    <div style="font-size:28px;font-weight:900;color:\${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--text)'}">\${remaining} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
</div>

<div class="card" style="border:1px solid var(--border);margin-bottom:20px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <div style="font-size:14px;font-weight:800;color:var(--text)">نسبة التحصيل</div>
    <div style="font-size:16px;font-weight:900;color:var(--primary)">\${ratio}%</div>
  </div>
  <div class="prj-pb" style="height:12px"><div class="prj-pf" style="width:\${ratio}%;background:var(--primary)"></div></div>
</div>

<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--success-50);color:var(--success)">💳</div>سجل الدفعات</div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-outline btn-xs" onclick="Projects.printInvoice(\${p.id})">🖨️ طباعة إيصال إجمالي</button>
      <button class="btn btn-primary btn-xs" onclick="Projects.addPayment(\${p.id})" \${remaining <= 0 ? 'disabled' : ''}>+ إضافة دفعة</button>
    </div>
  </div>
  
  \${isLate ? \`<div style="padding:10px;background:var(--danger);color:#fff;border-radius:6px;font-size:12px;font-weight:bold;margin-bottom:16px;text-align:center">⚠️ المشروع متأخر ويوجد مبالغ مستحقة للتحصيل</div>\` : ''}

  <div class="prj-tw" style="margin-bottom:0;border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <table style="margin:0;width:100%">
      <thead style="background:var(--bg)">
        <tr>
          <th style="padding:10px;text-align:right">التاريخ</th>
          <th style="padding:10px;text-align:right">المبلغ</th>
          <th style="padding:10px;text-align:right">الطريقة</th>
          <th style="padding:10px;text-align:right">البيان / ملاحظات</th>
          <th style="padding:10px;text-align:center">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        \${payments.length ? payments.map((py, idx) => \`
        <tr style="border-bottom:1px solid var(--divider)">
          <td style="padding:10px">\${py.date}</td>
          <td style="padding:10px;font-weight:bold;color:var(--success)">\${py.amount} د.ك</td>
          <td style="padding:10px"><span class="badge badge-gray">\${py.method}</span></td>
          <td style="padding:10px;color:var(--text-3);font-size:12px">\${py.note || '—'}</td>
          <td style="padding:10px;text-align:center">
             <button class="btn btn-ghost btn-xs" onclick="Projects.deletePayment(\${p.id}, \${idx})" style="color:var(--danger)">🗑️</button>
          </td>
        </tr>
        \`).join('') : \`<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-4)">لا توجد دفعات مسجلة</td></tr>\`}
      </tbody>
    </table>
  </div>
</div>
\`;
    return html;
  },

  addPayment(pid) {
    const p = this.projects().find(x => x.id === pid);
    if (!p) return;
    const remaining = (p.cost || 0) - (p.paid || 0);
    ERP.openModal('إضافة دفعة مالية', \`
      <div class="card" style="background:var(--info-50);border:1px solid var(--info);margin-bottom:16px;padding:12px">
         <div style="font-size:12px;color:var(--info)">المبلغ المتبقي للتحصيل: <strong style="font-size:16px">\${remaining} د.ك</strong></div>
      </div>
      <div class="fr fr2">
        <div class="fg">
          <label>المبلغ (د.ك) *</label>
          <input type="number" id="pay_amt" value="\${remaining > 0 ? remaining : 0}" max="\${remaining}" min="1">
        </div>
        <div class="fg">
          <label>التاريخ *</label>
          <input type="date" id="pay_date" value="\${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="fg">
        <label>طريقة الدفع</label>
        <select id="pay_method" class="prj-select" style="width:100%">
          <option>تحويل بنكي</option>
          <option>كي نت (KNET)</option>
          <option>نقدي (كاش)</option>
          <option>شيك</option>
          <option>رابط دفع (أونلاين)</option>
        </select>
      </div>
      <div class="fg">
        <label>البيان / ملاحظات</label>
        <input id="pay_note" placeholder="مثال: الدفعة الثانية للترخيص...">
      </div>
    \`, \`
      <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="Projects.savePayment(\${pid})">حفظ الدفعة</button>
    \`);
  },

  savePayment(pid) {
    const amt = parseFloat(document.getElementById('pay_amt').value);
    const date = document.getElementById('pay_date').value;
    const method = document.getElementById('pay_method').value;
    const note = document.getElementById('pay_note').value.trim();
    
    if (!amt || amt <= 0 || !date) {
      if(typeof toast !== 'undefined') toast('يرجى إدخال مبلغ صحيح وتاريخ', 'err');
      return;
    }

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.payments) p.payments = [];
    p.payments.push({ amount: amt, date, method, note, receipt: null });
    
    // Update total paid
    p.paid = (parseFloat(p.paid) || 0) + amt;
    
    // Update original projects array
    this.saveProjects(prj);
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast('تم تسجيل الدفعة بنجاح', 'success');
    
    // Optional: add timeline event automatically if Phase 6 is ready, we'll do that in Phase 6.
    
    this.rPView(pid); // re-render
  },

  deletePayment(pid, pIdx) {
    if(!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p || !p.payments || !p.payments[pIdx]) return;
    
    const amt = parseFloat(p.payments[pIdx].amount) || 0;
    p.paid = Math.max(0, (parseFloat(p.paid) || 0) - amt);
    p.payments.splice(pIdx, 1);
    
    this.saveProjects(prj);
    if(typeof toast !== 'undefined') toast('تم حذف الدفعة', 'info');
    this.rPView(pid);
  },

  printInvoice(pid) {
    const p = this.projects().find(x => x.id === pid);
    if (!p) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(\`
      <html dir="rtl">
      <head>
        <title>فاتورة - \${p.svc}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #274A78; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #274A78; margin: 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .info-box { padding: 15px; border: 1px solid #ddd; border-radius: 8px; width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #f4f6f9; color: #274A78; }
          .totals { width: 40%; margin-left: 0; margin-right: auto; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شركة معمار الهندسية</h1>
          <p>كشف حساب مشروع</p>
        </div>
        
        <div class="info">
          <div class="info-box">
            <strong>بيانات العميل:</strong><br><br>
            الاسم: \${p.cNm}<br>
            التاريخ: \${new Date().toISOString().split('T')[0]}
          </div>
          <div class="info-box">
            <strong>بيانات المشروع:</strong><br><br>
            المشروع: \${p.svc}<br>
            الموقع: \${p.loc || 'غير محدد'}<br>
            رقم المرجع: MEP-2026-\${p.id}
          </div>
        </div>
        
        <h3>سجل الدفعات المستلمة</h3>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>طريقة الدفع</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            \${(p.payments||[]).map(py => \`
            <tr>
              <td>\${py.date}</td>
              <td>\${py.note || 'دفعة مالية'}</td>
              <td>\${py.method}</td>
              <td>\${py.amount} د.ك</td>
            </tr>
            \`).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr><th>إجمالي العقد</th><td>\${p.cost || 0} د.ك</td></tr>
            <tr><th>إجمالي المدفوع</th><td>\${p.paid || 0} د.ك</td></tr>
            <tr><th>المبلغ المتبقي</th><td style="color:\${((p.cost||0)-(p.paid||0))>0?'red':'green'}">\${(p.cost||0)-(p.paid||0)} د.ك</td></tr>
          </table>
        </div>
        
        <div class="footer">
          هذا المستند تم إصداره آلياً من نظام معمار ERP
        </div>
        
        <script>
          window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
        </script>
      </body>
      </html>
    \`);
    printWindow.document.close();
  },
`;

const oldFinancePlaceholderRegex = /  rFinanceTab\(p\) \{\s*return '<div class="card"><div class="empty" style="padding:40px"><p>النظام المالي \(سيتم برمجته في المرحلة 5\)<\/p><\/div><\/div>';\s*\},/;

if (oldFinancePlaceholderRegex.test(code)) {
  code = code.replace(oldFinancePlaceholderRegex, newFinanceLogic);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ Phase 5 applied successfully');
} else {
  console.log('❌ Could not find rFinanceTab placeholder to replace.');
}
