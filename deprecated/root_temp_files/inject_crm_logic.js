const fs = require('fs');

let content = fs.readFileSync('shared/memar_chatbot.js', 'utf8');

// 1. Update mGetBookingCard
const target1 = \`window.mGetBookingCard = function(b) {
  const clientName = b.client ? (b.client.name || b.client.fullName || 'مستخدم مسجل') : 'مستخدم غير مسجل';
  return \\\`<div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <div style="font-weight:800;font-size:12px;color:#1B6CA8;margin-bottom:10px;display:flex;align-items:center;gap:6px">📌 تفاصيل الموعد</div>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:12px;font-size:10px;line-height:1.6">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin-bottom:6px"><span style="color:#6B7280;font-weight:700">العميل:</span><strong style="color:#1B6CA8">\${clientName}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#6B7280;font-weight:700">رقم الموعد:</span><strong style="color:#111827">\${b.id}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">التفاصيل:</span><strong style="color:#111827">\${b.day} الساعة \${b.hour}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">النوع:</span><strong style="color:#111827">\${b.typeLabel || 'غير محدد'}</strong></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
         <button onclick="mModifyBooking('\${b.id}')" style="flex:1;padding:8px;background:#1B6CA8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;transition:all 0.2s;box-shadow:0 3px 8px rgba(27,108,168,.2)" onmouseover="this.style.background='#0D4A7A'" onmouseout="this.style.background='#1B6CA8'">✏️ تعديل الموعد</button>
         <button onclick="mCancelBooking('\${b.id}')" style="padding:4px 8px;background:none;color:#9CA3AF;border:none;cursor:pointer;font-size:9px;font-weight:600;font-family:Cairo,sans-serif;text-decoration:underline;transition:all 0.2s" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#9CA3AF'">إلغاء</button>
      </div>
    </div>\\\`;
}\`;

const replace1 = \`window.mGetBookingCard = function(b) {
  const clientName = b.client ? (b.client.name || b.client.fullName || 'مستخدم مسجل') : 'مستخدم غير مسجل';
  const isGuest = b.client && (b.client.role === 'guest' || b.client.type === 'lead');
  let guestAlert = '';
  if (isGuest) {
      guestAlert = \\\`<div style="margin-top:10px;padding:8px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;text-align:center;font-size:10px;color:#92400E">
        <div style="font-weight:700;margin-bottom:4px">⚠️ لمتابعة تفاصيل موعدك وأعمالك</div>
        <button onclick="openAuthModal('chatbot_booking')" style="background:#F59E0B;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:9px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">سجل الدخول الآن ←</button>
      </div>\\\`;
  }

  return \\\`<div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <div style="font-weight:800;font-size:12px;color:#1B6CA8;margin-bottom:10px;display:flex;align-items:center;gap:6px">📌 تفاصيل الموعد</div>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:12px;font-size:10px;line-height:1.6">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin-bottom:6px"><span style="color:#6B7280;font-weight:700">العميل:</span><strong style="color:#1B6CA8">\${clientName}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#6B7280;font-weight:700">رقم الموعد:</span><strong style="color:#111827">\${b.id}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">التفاصيل:</span><strong style="color:#111827">\${b.day} الساعة \${b.hour}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">النوع:</span><strong style="color:#111827">\${b.typeLabel || 'غير محدد'}</strong></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
         <button onclick="mModifyBooking('\${b.id}')" style="flex:1;padding:8px;background:#1B6CA8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;transition:all 0.2s;box-shadow:0 3px 8px rgba(27,108,168,.2)" onmouseover="this.style.background='#0D4A7A'" onmouseout="this.style.background='#1B6CA8'">✏️ تعديل الموعد</button>
         <button onclick="mCancelBooking('\${b.id}')" style="padding:4px 8px;background:none;color:#9CA3AF;border:none;cursor:pointer;font-size:9px;font-weight:600;font-family:Cairo,sans-serif;text-decoration:underline;transition:all 0.2s" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#9CA3AF'">إلغاء</button>
      </div>
      \${guestAlert}
    </div>\\\`;
}\`;

content = content.replace(target1, replace1);

// 2. Update _cbExecuteBooking
const target2 = \`  const clientInfo = {
    name: clientName,
    phone: clientPhone,
    email: clientEmail,
    type: clientType,
    id: memarUser ? memarUser.id : null
  };

  bs.push({id,type:window._cbMT,typeLabel:window._cbMTLabel,day:dayDesc,hour:window._hr12(hr),datetime:dt,status:'pending',client:clientInfo,createdAt:new Date().toISOString(), activityLog: [creationLog]});
  try{localStorage.setItem('memar_bookings',JSON.stringify(bs));}catch(e){}\`;

const replace2 = \`  const roleStr = memarUser && memarUser.role ? memarUser.role : clientType;
  const clientInfo = {
    name: clientName,
    phone: clientPhone,
    email: clientEmail,
    type: clientType,
    role: roleStr,
    id: memarUser ? memarUser.id : ('CLT-' + Date.now())
  };

  bs.push({id,type:window._cbMT,typeLabel:window._cbMTLabel,day:dayDesc,hour:window._hr12(hr),datetime:dt,status:'pending',client:clientInfo,createdAt:new Date().toISOString(), activityLog: [creationLog]});
  try{localStorage.setItem('memar_bookings',JSON.stringify(bs));}catch(e){}
  
  // Create Lead or Request
  try {
      if (roleStr === 'guest' || clientType === 'lead') {
          let leads = JSON.parse(localStorage.getItem('memar_crm_leads') || '[]');
          leads.push({
              id: 'L-' + Date.now(),
              name: clientName,
              phone: clientPhone,
              email: clientEmail,
              status: 'new',
              source: 'chatbot_booking',
              created_at: new Date().toISOString(),
              notes: \\\`طلب حجز موعد (\${window._cbMTLabel}) بتاريخ \${dayDesc} \${window._hr12(hr)}. رقم الموعد: \${id}\\\`
          });
          localStorage.setItem('memar_crm_leads', JSON.stringify(leads));
      } else {
          let reqs = JSON.parse(localStorage.getItem('memar_requests') || '[]');
          reqs.push({
              id: 'REQ-' + Date.now(),
              clientId: clientInfo.id,
              clientName: clientName,
              type: 'booking',
              title: \\\`حجز موعد \${window._cbMTLabel}\\\`,
              desc: \\\`تم طلب موعد بتاريخ \${dayDesc} الساعة \${window._hr12(hr)}. رقم الموعد: \${id}\\\`,
              status: 'pending',
              date: new Date().toISOString()
          });
          localStorage.setItem('memar_requests', JSON.stringify(reqs));
      }
  } catch(e) { console.warn("Failed to create lead/request", e); }\`;

content = content.replace(target2, replace2);

fs.writeFileSync('shared/memar_chatbot.js', content);
console.log('Script done');
