const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8').split('\n');

const correctLines = `      toName: toName,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
    
    ERP.closeModal();
    this.activeTab = 'sent';
    this.render();
    toast('تم إرسال الطلب بنجاح للجهة المعنية');
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: CHATBOT ADMIN
─────────────────────────────────────────────────────── */
const ChatbotAdmin = {
  render() {
    const pg = document.getElementById('p-chatbot');
    const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
    const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
    
    // Convert qa object to array
    const qaArray = Object.keys(qa).map(k => ({ key: k, text: qa[k].text, qr: qa[k].qr || [] }));
    
    pg.innerHTML = \`
      <div class="section-header" style="margin-bottom:20px">
        <div>
          <div class="section-title">🤖 إدارة المساعد الذكي</div>
          <div class="section-subtitle">إدارة المعرفة الفنية وتدريب المساعد الذكي</div>
        </div>
        <button class="btn btn-primary" onclick="ChatbotAdmin.addQAPrompt()">➕ إضافة سؤال وجواب</button>
      </div>

      <div class="grid-2">
        <!-- Q&A Configuration -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📚 قاعدة المعرفة (Q&A)</div>
            <span class="badge badge-blue">\${qaArray.length} عناصر مخصصة</span>
          </div>
          <div class="card-body">
            <div class="table-wrap">
            <table style="width:100%">
              <thead><tr><th>الكلمة المفتاحية / السؤال</th><th>الرد (معاينة)</th><th>إجراءات</th></tr></thead>
              <tbody>
                \${qaArray.map(item => \`
                  <tr>
                    <td class="td-bold" style="white-space:nowrap">\${ERP.h(item.key)}</td>
                    <td class="td-muted">\${ERP.h(item.text).substring(0, 30)}...</td>`.split('\n');

const startTarget = "      fromRole: DATA.user.role || 'مسؤول',";
const endTarget = `                    <td style="white-space:nowrap; display:flex; gap: 4px;">`;

let startIdx = lines.findIndex(l => l && l.includes(startTarget)) + 1;
let endIdx = lines.findIndex((l, i) => i >= startIdx && l && l.includes(endTarget));

if (startIdx !== 0 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx, ...correctLines);
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', lines.join('\n'));
    console.log('Fixed syntax & restored missing code!');
} else {
    console.log('Targets not found: start=' + startIdx + ' end=' + endIdx);
}
