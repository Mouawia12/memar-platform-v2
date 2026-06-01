const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8');

// Undo the ChatbotAdmin deletion
const badChatbot = `            <table style="width:100%">
              <thead><tr><th>الكلمة المفتاحية / السؤال</th><th>الرد (معاينة)</th><th>إجراءات</th></tr></thead>`;

const goodChatbot = `/* ───────────────────────────────────────────────────────
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
              <thead><tr><th>الكلمة المفتاحية / السؤال</th><th>الرد (معاينة)</th><th>إجراءات</th></tr></thead>\`;`;

if (text.includes('<table style="width:100%">\n              <thead><tr><th>الكلمة المفتاحية / السؤال</th>')) {
    console.log('Restoring Chatbot Admin section...');
    // Only replace if it doesn't already have 'const ChatbotAdmin' before it
    if (!text.includes('const ChatbotAdmin = {')) {
        text = text.replace(badChatbot, goodChatbot);
        console.log('Chatbot Admin restored!');
    } else {
        console.log('Chatbot Admin already exists, safely skipping.');
    }
}

// Ensure the schema users is applied
const usersBad = `    // 5. Users
    DB_TABLES.users = (DATA.employees || []).map(e => ({
      id: e.id,
      name: e.name,
      role_id: e.dept ? 'R_'+e.dept : 'R_USER',
      status: e.status || 'active'
    }));`;

const usersGood = `    // 5. Users (enhanced with login data for Userlogs)
    let storedUsers = [];
    try { storedUsers = JSON.parse(localStorage.getItem('memar_sys_users')) || []; }catch(e){}
    
    DB_TABLES.users = (DATA.employees || []).map((e, idx) => {
      const existing = storedUsers.find(u => u.id === e.id) || {};
      const status = existing.status || (e.status === 'frozen' ? 'frozen' : 'active');
      return Object.assign({
        id: e.id,
        name: e.name,
        email: existing.email || e.email || \`emp_\${e.id.toLowerCase()}@memar.com\`,
        username: existing.username || e.username || \`user_\${e.id.toLowerCase()}\`,
        password: existing.password || e.password || \`Memar@\${e.id}#2026\`,
        role_id: e.dept ? 'R_'+e.dept : 'R_USER',
        status: status
      }, existing);
    });`;

if (text.includes(usersBad)) {
    text = text.replace(usersBad, usersGood);
    console.log('Fixed users DB assignment!');
} else {
    console.log('Target users DB assignment pattern NOT found!');
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', text);
console.log('Done script execution.');
