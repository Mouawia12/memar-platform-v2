const fs = require('fs');

let content = fs.readFileSync('shared/memar_chatbot.js', 'utf8');

const target1 = "function openAuthModal(mode){\n  document.getElementById('auth-modal-bg').style.display='flex';\n  document.body.style.overflow='hidden';\n  const f=document.getElementById('auth-iframe');\n  let url = 'memar_login.html';\n  if (mode) url += '?mode=' + mode;\n  f.src = url;\n}";
const replace1 = "function openAuthModal(mode){\n  let url = 'memar_login.html';\n  if (mode) url += '?mode=' + mode;\n  \n  if (mode === 'chatbot_booking') {\n     const iframeHTML = `<iframe id=\"chat-auth-iframe\" src=\"${url}\" style=\"width:100%; height:420px; border:none; border-radius:12px; background:#fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05)\"></iframe>`;\n     mBot('يرجى تسجيل الدخول أو إنشاء حساب لمتابعة حجز الموعد:', iframeHTML);\n     return;\n  }\n\n  document.getElementById('auth-modal-bg').style.display='flex';\n  document.body.style.overflow='hidden';\n  const f=document.getElementById('auth-iframe');\n  f.src = url;\n}";

if (content.includes("function openAuthModal(mode){")) {
    content = content.replace("function openAuthModal(mode){\n  document.getElementById('auth-modal-bg').style.display='flex';\n  document.body.style.overflow='hidden';\n  const f=document.getElementById('auth-iframe');\n  let url = 'memar_login.html';\n  if (mode) url += '?mode=' + mode;\n  f.src = url;\n}", replace1);
}

const target2 = "window.addEventListener('message', function(e) {\n  if (e.data === 'chatbot_booking_success') {\n    closeAuthModal();\n    mShowBook();\n  } else if (e.data === 'close_chatbot_booking') {\n    closeAuthModal();\n  }\n});";
const replace2 = "window.addEventListener('message', function(e) {\n  if (e.data === 'chatbot_booking_success') {\n    closeAuthModal();\n    const chatIframe = document.getElementById('chat-auth-iframe');\n    if (chatIframe) {\n       chatIframe.parentElement.innerHTML = '<div style=\"color:#2D9B6F; font-weight:800; text-align:center; padding:15px; font-size:12px\">✅ تم تسجيل الدخول بنجاح!</div>';\n    }\n    mShowBook();\n  } else if (e.data === 'close_chatbot_booking') {\n    closeAuthModal();\n    const chatIframe = document.getElementById('chat-auth-iframe');\n    if (chatIframe) {\n       chatIframe.parentElement.innerHTML = '<div style=\"color:#9CA3AF; font-weight:700; text-align:center; padding:10px; font-size:11px\">❌ تم الإلغاء</div>';\n    }\n  }\n});";

content = content.replace(target2, replace2);

fs.writeFileSync('shared/memar_chatbot.js', content);
console.log("Replaced successfully");
