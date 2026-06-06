const fs = require('fs');
let content = fs.readFileSync('erp_app.js', 'utf8');

const missingCode = `              btnsHtml = \`<button class="btn btn-outline btn-sm" style="flex:1;background:var(--bg);border-color:var(--primary);color:var(--primary)" onclick="CRMMeetings.requestJoin('\${m.id}', '\${m.client}')">طلب دخول للاجتماع ✋</button>\`;
            }
          }

          return \`
          <div class="card" style="border:1px solid \${m.status==='active'?'var(--primary)':'var(--border)'};box-shadow:var(--sh-sm)">
            <div class="card-body" style="padding:15px;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge \${m.status==='active'?'badge-green':'badge-orange'}">\${m.status==='active'?'مباشر 🔴':'انتظار ⏳'}</span>
                <span style="font-size:11px;color:var(--text-3)">\${m.time}</span>
              </div>
              <h3 style="margin:5px 0;font-size:15px">العميل: \${ERP.getUserName(m.client_id)}</h3>
              <div style="font-size:12px;color:var(--text-2);flex:1">
                👥 الموظفين الحاليين: <br>
                \${m.employees.length > 0 ? m.employees.map(e => \`<span style="display:inline-block;background:var(--bg-card);padding:2px 6px;border-radius:4px;border:1px solid var(--border);margin-top:4px">\${e}</span>\`).join(' ') : '<span style="color:var(--text-4)">لا أحد بعد</span>'}
              </div>
              <div style="display:flex;gap:4px;margin-top:10px">
                \${btnsHtml}
              </div>
            </div>
          </div>
          \`;
        }).join('')}
      </div>
    \`;
  },

  requestJoin(meetingId, clientName) {
    let requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    requests.push({
      id: 'RQ' + Date.now().toString().slice(-4),
      type: 'meeting',
      meetingId: meetingId,
      desc: 'طلب انضمام للاجتماع مع العميل: ' + clientName,
      by: DATA.user.name,
      role: DATA.user.role,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
    toast('تم إرسال طلب الانضمام للإدارة بنجاح');
    this.render();
  },

  joinRoom(id, role) {
    const pg = document.getElementById('p-crm_meetings');
    const isObserver = role === 'management';

    pg.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="CRMMeetings.render()">🚪 مغادرة الجلسة</button>
          <div style="font-size:16px;font-weight:900;color:var(--primary)">🔴 جلسة مرئية قيد التشغيل</div>
          \${isObserver ? '<span class="badge badge-orange" style="font-size:10px">وضع المشاهد (إدارة)</span>' : ''}
        </div>
        <div style="font-size:12px;color:var(--text-3)">زمن المكالمة: 14:32</div>
      </div>

      <div style="display:grid;grid-template-columns: 1fr 280px;gap:16px;height:calc(100vh - 200px);min-height:500px">
        
        <!-- Client View Stream (Main) -->
        <div style="background:#111;border-radius:12px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 50px rgba(0,0,0,0.5)">
           <div style="position:absolute;top:15px;left:15px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:6px;">
             <span>👤 العميل</span>
           </div>
           
           <!-- Simulated Video Placeholder -->
           <div style="text-align:center;color:#666">
             <div style="font-size:60px;margin-bottom:10px">💻</div>
             <div style="font-size:14px;color:#aaa">كاميرا العميل نشطة</div>
           </div>

           <!-- Meeting Controls Bar -->
           <div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.85);backdrop-filter:blur(10px);padding:10px 20px;border-radius:30px;display:flex;gap:15px;border:1px solid rgba(255,255,255,0.1)">
             \${isObserver ? \`
                <button class="btn-video" title="الميكروفون مغلق (مراقب)" style="opacity:0.5;background:none;border:none;color:#fff;font-size:20px">🎤❌</button>
                <button class="btn-video" title="تنبيه الموظفين (رسالة)" style="background:none;border:none;color:#fff;font-size:20px">💬</button>
             \` : \`
                <button class="btn-video" title="كتم الصوت" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">🎤</button>
                <button class="btn-video" title="إيقاف الكاميرا" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">📹</button>
                <button class="btn-video" title="مشاركة الشاشة" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">🖥️</button>
             \`}
             <button title="إنهاء المكالمة" onclick="CRMMeetings.render()" style="background:#ef4444;border:none;color:#fff;font-size:20px;cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:10px">📞</button>
           </div>
        </div>

        <!-- Employees Pane (Sidebar) -->
        <div style="display:flex;flex-direction:column;gap:12px">`;

const sIdx = content.indexOf('btnsHtml = `<button class="btn btn-secondary btn-sm" style="flex:1; cursor:not-allowed;" title="طلبك في انتظار موافقة الإدارة">طلبك قيد الانتظار ⏳</button>`;');
if (sIdx !== -1) {
  const insertPos = content.indexOf('} else {', sIdx) + 8;
  const eIdx = content.indexOf('<!-- Employee 1 -->', insertPos);
  
  if (eIdx !== -1) {
    content = content.substring(0, insertPos) + "\n" + missingCode + "\n          " + content.substring(eIdx);
    fs.writeFileSync('erp_app.js', content, 'utf8');
    console.log('Restored perfectly!');
  } else {
    console.log('End marker not found');
  }
} else {
  console.log('Start marker not found');
}
