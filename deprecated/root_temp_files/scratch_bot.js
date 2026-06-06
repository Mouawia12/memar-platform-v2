const fs = require('fs');
const content = fs.readFileSync('shared/memar_chatbot.txt', 'utf8');

const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1].replace(/`/g, '\\`').trim() : '';

let htmlRegex = /<\/style>([\s\S]*?)<script>/;
let htmlMatch = content.match(htmlRegex);
let htmlCode = htmlMatch ? htmlMatch[1].replace(/`/g, '\\`').trim() : '';

let jsBlocks = [];
let re = /<script>([\s\S]*?)<\/script>/g;
let match;
while ((match = re.exec(content)) !== null) {
  jsBlocks.push(match[1].trim());
}

let jsCode = jsBlocks.join('\n\n');

let mKB_override = `
let base_mKB = mKB || {};
function getMemarKB() {
  try {
    const custom = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
    return { ...base_mKB, ...custom };
  } catch (e) {
    return base_mKB;
  }
}
`;

jsCode = jsCode.replace('const mKB={', 'let mKB={' + mKB_override + '; mKB={');

jsCode = jsCode.replace(
  'const resp = mKB[type] || mKB.default;',
  `const currentKB = getMemarKB();
      let resp = currentKB[type] || currentKB.default;
      if (type === 'default' && msg.length > 5) {
        let unanswered = [];
        try { unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]'); } catch(e){}
        unanswered.push({ text: msg, date: new Date().toISOString(), status: 'pending' });
        localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
        resp = { text: currentKB.default.text + '\\n\\n(لقد قمت بإرسال استفسارك للإدارة للرد عليه قريباً)', qr: currentKB.default.qr };
      }`
);

const finalWidget = `
/* ═══════════════════════════════════════════════════════
   MEMAR CHATBOT WIDGET v2.1
   Unified Floating Chatbot for Website, Portal, and ERP
═══════════════════════════════════════════════════════ */

(function initMemarChatbot() {
  if (document.getElementById('m-fab') || document.getElementById('m-win')) return;

  const styleEl = document.createElement('style');
  styleEl.innerHTML = \`${css}\`;
  document.head.appendChild(styleEl);

  const htmlWrapper = document.createElement('div');
  htmlWrapper.id = 'memar-chatbot-container';
  htmlWrapper.innerHTML = \`${htmlCode}\`;
  document.body.appendChild(htmlWrapper);

  ${jsCode}
})();
`;

fs.writeFileSync('shared/memar_chatbot.js', finalWidget);
console.log('SUCCESS');
