const fs = require('fs');
let content = fs.readFileSync('shared/memar_chatbot.js', 'utf8');

// 1. Update openAuthModal
content = content.replace(
"function openAuthModal(){",
"function openAuthModal(mode){"
);
content = content.replace(
"  if(!f.src.includes('memar_login.html')) f.src='memar_login.html';",
"  let url = 'memar_login.html';\n  if (mode) url += '?mode=' + mode;\n  f.src = url;"
);

// 2. Add message listener for 'chatbot_booking_success'
if (!content.includes("data === 'chatbot_booking_success'")) {
  const listenerStr = "\nwindow.addEventListener('message', function(e) {\n  if (e.data === 'chatbot_booking_success') {\n    closeAuthModal();\n    mShowBook();\n  } else if (e.data === 'close_chatbot_booking') {\n    closeAuthModal();\n  }\n});\n";
  content = content.replace('// ===== CHAT WIDGET ENGINE =====', listenerStr + '\n// ===== CHAT WIDGET ENGINE =====');
}

// 3. Update mCheckBooking
content = content.replace(
"window.mCheckBooking = function() {",
"window.mCheckBooking = function() {\n  const user = JSON.parse(localStorage.getItem('memar_user') || 'null');\n  if (!user || (!user.name && !user.fullName)) {\n      openAuthModal('chatbot_booking');\n      return;\n  }\n"
);

// 4. Update mGetBookingCard
content = content.replace(
"window.mGetBookingCard = function(b) {",
"window.mGetBookingCard = function(b) {\n  const clientName = b.client ? (b.client.name || b.client.fullName || 'مستخدم مسجل') : 'مستخدم غير مسجل';"
);
content = content.replace(
"<div style=\"display:flex;justify-content:space-between\"><span style=\"color:#6B7280;font-weight:700\">رقم الموعد:</span><strong style=\"color:#111827\">${b.id}</strong></div>",
"<div style=\"display:flex;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin-bottom:6px\"><span style=\"color:#6B7280;font-weight:700\">العميل:</span><strong style=\"color:#1B6CA8\">${clientName}</strong></div>\n        <div style=\"display:flex;justify-content:space-between\"><span style=\"color:#6B7280;font-weight:700\">رقم الموعد:</span><strong style=\"color:#111827\">${b.id}</strong></div>"
);

// 5. Update mBookSave (where setTimeout uses a fake b)
const targetBookSave = "const b = {id, day:dayDesc, hour:window._hr12(hr), typeLabel:window._cbMTLabel};";
const replaceBookSave = "const latestBs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');\n     const latestB = latestBs.find(x => x.id === id) || {id, day:dayDesc, hour:window._hr12(hr), typeLabel:window._cbMTLabel, client: clientInfo};";
content = content.replace(targetBookSave, replaceBookSave);

const targetMsg = "mBot('✅ تم استلام طلب الموعد بنجاح!\\nسيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.\\nشكراً لثقتك بمجموعة معمار 🙏', window.mGetBookingCard(b), ['تفاصيل الباقات', 'احسب مشروعي']);";
const replaceMsg = "mBot('✅ تم استلام طلب الموعد بنجاح!\\nسيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.\\nشكراً لثقتك بمجموعة معمار 🙏', window.mGetBookingCard(latestB), ['تفاصيل الباقات', 'احسب مشروعي']);";
content = content.replace(targetMsg, replaceMsg);

fs.writeFileSync('shared/memar_chatbot.js', content);
console.log('memar_chatbot updated');
