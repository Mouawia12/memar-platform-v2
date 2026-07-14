
/* ═══════════════════════════════════════════════════════
   MEMAR CHATBOT WIDGET v2.1
   Unified Floating Chatbot for Website, Portal, and ERP
═══════════════════════════════════════════════════════ */

(function initMemarChatbot() {
  window.MEMAR_COUNTRIES = [
    {iso:'KW',code:'+965',flag:'🇰🇼'},{iso:'SA',code:'+966',flag:'🇸🇦'},{iso:'AE',code:'+971',flag:'🇦🇪'},{iso:'BH',code:'+973',flag:'🇧🇭'},{iso:'QA',code:'+974',flag:'🇶🇦'},{iso:'OM',code:'+968',flag:'🇴🇲'},{iso:'EG',code:'+20',flag:'🇪🇬'},{iso:'JO',code:'+962',flag:'🇯🇴'},{iso:'LB',code:'+961',flag:'🇱🇧'},{iso:'IQ',code:'+964',flag:'🇮🇶'},{iso:'SY',code:'+963',flag:'🇸🇾'},{iso:'PS',code:'+970',flag:'🇵🇸'},{iso:'YE',code:'+967',flag:'🇾🇪'},{iso:'SD',code:'+249',flag:'🇸🇩'},{iso:'MA',code:'+212',flag:'🇲🇦'},{iso:'DZ',code:'+213',flag:'🇩🇿'},{iso:'TN',code:'+216',flag:'🇹🇳'},{iso:'LY',code:'+218',flag:'🇱🇾'},{iso:'MR',code:'+222',flag:'🇲🇷'},{iso:'SO',code:'+252',flag:'🇸🇴'},{iso:'US',code:'+1',flag:'🇺🇸'},{iso:'CA',code:'+1',flag:'🇨🇦'},{iso:'GB',code:'+44',flag:'🇬🇧'},{iso:'AU',code:'+61',flag:'🇦🇺'},{iso:'DE',code:'+49',flag:'🇩🇪'},{iso:'FR',code:'+33',flag:'🇫🇷'},{iso:'IT',code:'+39',flag:'🇮🇹'},{iso:'ES',code:'+34',flag:'🇪🇸'},{iso:'TR',code:'+90',flag:'🇹🇷'},{iso:'IN',code:'+91',flag:'🇮🇳'},{iso:'PK',code:'+92',flag:'🇵🇰'},{iso:'CN',code:'+86',flag:'🇨🇳'},{iso:'JP',code:'+81',flag:'🇯🇵'}
  ];
  
  if (localStorage.getItem('memar_disable_chatbot') === 'true') return;
  if (document.getElementById('m-fab') || document.getElementById('m-win')) return;

  const styleEl = document.createElement('style');
  styleEl.innerHTML = `#m-fab{position:fixed;bottom:24px;left:24px;width:56px;height:56px;background:linear-gradient(135deg,#1B6CA8,#0D4A7A);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;box-shadow:0 4px 16px rgba(27,108,168,.4);z-index:9998;transition:transform .3s;animation:mPulse 2.5s infinite}
#m-fab:hover{transform:scale(1.08)}
@keyframes mPulse{0%,100%{box-shadow:0 4px 16px rgba(27,108,168,.4),0 0 0 0 rgba(27,108,168,.2)}60%{box-shadow:0 4px 16px rgba(27,108,168,.4),0 0 0 14px rgba(27,108,168,0)}}
#m-dot{position:absolute;top:4px;right:4px;width:11px;height:11px;background:#2ECC71;border-radius:50%;border:2px solid #fff}
#m-win{position:fixed;bottom:92px;left:24px;width:340px;height:520px;background:#F0F4F8;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.18);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:Cairo,sans-serif;direction:rtl}
#m-win.open{display:flex}
#m-win{isolation:isolate}
#m-head{background:linear-gradient(135deg,#0D4A7A,#1B6CA8) !important;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;color:#fff !important}
#m-head:hover{background:linear-gradient(135deg,#0D4A7A,#1B6CA8) !important}
.m-hl{display:flex;align-items:center;gap:9px}
.m-ic{width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;position:relative;flex-shrink:0}
.m-ic-d{position:absolute;bottom:1px;right:1px;width:9px;height:9px;background:#2ECC71;border-radius:50%;border:1.5px solid #fff}
.m-name{color:#fff !important;font-size:12px;font-weight:700}.m-stat{color:rgba(255,255,255,.75) !important;font-size:9px;margin-top:1px}
.m-hr{display:flex;gap:4px}
.m-hb{width:26px;height:26px;background:rgba(255,255,255,.15);border:none;border-radius:6px;color:#fff !important;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
.m-hb:hover{background:rgba(255,255,255,.3) !important;color:#fff !important}
#m-head a,#m-head a:hover{color:#fff !important;background:transparent !important}
#m-sug{display:flex;gap:5px;padding:7px 10px;overflow-x:auto;flex-shrink:0;background:#fff;border-bottom:1px solid #E8EDF2;cursor:grab;scrollbar-width:none;-webkit-overflow-scrolling:touch;user-select:none}
#m-sug::-webkit-scrollbar{display:none}
.m-chip{flex-shrink:0;padding:4px 9px;background:#EBF3FB;color:#1B6CA8;border-radius:20px;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;border:1px solid #D0E4F5;transition:all .2s}
.m-chip:hover{background:#1B6CA8;color:#fff}
#m-chat-area{flex:1;overflow-y:auto;padding:10px 8px;display:flex;flex-direction:column;gap:7px}
#m-chat-area::-webkit-scrollbar{width:4px}
#m-chat-area::-webkit-scrollbar-thumb{background:#D0D9E4;border-radius:4px}
.m-msg{display:flex;gap:6px;align-items:flex-start;max-width:100%}
.m-msg.user{flex-direction:row-reverse}
.m-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1B6CA8,#0D4A7A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;margin-top:2px}
.m-msg.user .m-av{background:linear-gradient(135deg,#2D9B6F,#1A7A55)}
.m-bub{background:#fff;border-radius:12px 12px 12px 3px;padding:8px 11px;font-size:11.5px;line-height:1.55;color:#1A1F2E;box-shadow:0 1px 4px rgba(0,0,0,.08);max-width:248px}
.m-msg.user .m-bub{background:linear-gradient(135deg,#1B6CA8,#0D4A7A);color:#fff;border-radius:12px 12px 3px 12px;max-width:220px}
.m-time{font-size:9px;color:#9CA3AF;margin-top:2px;padding:0 2px}
.m-typing{display:flex;gap:4px;padding:8px 12px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.m-typing span{width:7px;height:7px;background:#94A3B8;border-radius:50%;animation:mBounce .9s infinite}
.m-typing span:nth-child(2){animation-delay:.15s}.m-typing span:nth-child(3){animation-delay:.3s}
@keyframes mBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.m-qrs{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.m-qr{padding:4px 9px;background:#EBF3FB;color:#1B6CA8;border-radius:14px;font-size:10px;cursor:pointer;border:1px solid #D0E4F5;font-weight:600;transition:all .2s}
.m-qr:hover{background:#1B6CA8;color:#fff}
#m-inp-area{display:flex;gap:5px;padding:7px 8px;background:#fff;border-top:1px solid #E8EDF2;flex-shrink:0;align-items:flex-end}
#m-inp{flex:1;border:1.5px solid #E4E8EF;border-radius:10px;padding:7px 9px;font-family:Cairo,sans-serif;font-size:12px;resize:none;outline:none;min-height:34px;max-height:68px;direction:rtl;background:#F9FAFB;transition:border .2s}
#m-inp:focus{border-color:#1B6CA8;background:#fff}
#m-send{width:34px;height:34px;background:linear-gradient(135deg,#1B6CA8,#0D4A7A);border:none;border-radius:10px;color:#fff;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
#m-send:hover{transform:scale(1.06)}
.m-pc{background:linear-gradient(135deg,#0D4A7A,#1B6CA8);border-radius:11px;padding:12px;color:#fff;font-size:11px}
.m-pc-gr{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px}
.m-pb{padding:4px 8px;border:1.5px solid rgba(255,255,255,.3);border-radius:18px;cursor:pointer;font-size:10px;font-weight:600;transition:all .2s}
.m-pb:hover,.m-pb.a{background:rgba(255,255,255,.22);border-color:#fff}
.m-prow{display:flex;align-items:center;gap:5px;margin-bottom:7px}
.m-pi{flex:1;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.3);border-radius:7px;padding:6px 9px;color:#fff;font-family:Cairo,sans-serif;font-size:12px;outline:none}
.m-pi::placeholder{color:rgba(255,255,255,.55)}
.m-punit{font-size:10px;opacity:.75}
.m-pcalc{width:100%;padding:8px;background:#2D9B6F;border:none;border-radius:7px;color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:Cairo,sans-serif;transition:background .2s}
.m-pcalc:hover{background:#16A34A}
.m-pres{display:none;background:rgba(255,255,255,.14);border-radius:7px;padding:9px;text-align:center;margin-top:7px}
.m-pres-v{font-size:19px;font-weight:800;margin:3px 0}.m-pres-n{font-size:9px;opacity:.7}
.m-qform{background:#fff;border:2px solid #1B6CA8;border-radius:11px;padding:13px;direction:rtl}
.m-qform input,.m-qform select{width:100%;padding:7px 9px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:12px;outline:none;margin-bottom:6px;box-sizing:border-box;background:#F9FAFB;direction:rtl}
.m-qform input:focus,.m-qform select:focus{border-color:#1B6CA8;background:#fff}
.m-qfbtn{width:100%;padding:9px;background:linear-gradient(135deg,#1B6CA8,#2D9B6F);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:Cairo,sans-serif}
.mbook-card{background:#fff;border:1.5px solid #E4E8EF;border-radius:11px;padding:11px;direction:rtl;font-size:11px}
.mbt-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:9px}
.mbt{padding:7px 5px;border:1.5px solid #E4E8EF;border-radius:8px;cursor:pointer;text-align:center;font-size:10px;font-weight:600;color:#374151;transition:all .2s;background:#F9FAFB}
.mbt:hover{border-color:#1B6CA8;color:#1B6CA8;background:#EBF3FB}
.mbt.active{border-color:#1B6CA8;background:#1B6CA8;color:#fff}
.mbook-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;border-bottom:1px solid #F3F4F6;padding-bottom:7px}
.mbook-nav span{font-size:10px;font-weight:700;color:#374151}
.mbook-nav-btn{padding:4px 9px;background:#F3F4F6;border:1px solid #E4E8EF;border-radius:6px;cursor:pointer;font-size:9px;font-family:Cairo,sans-serif;color:#374151;transition:all .2s}
.mbook-nav-btn:hover:not(:disabled){background:#EBF3FB;color:#1B6CA8;border-color:#1B6CA8}
.mbook-nav-btn:disabled{opacity:.35;cursor:not-allowed}
.mbook-table{border-collapse:collapse;width:100%;font-size:9px}
.cal-th{padding:5px 2px;font-weight:700;color:#374151;text-align:center;border-bottom:2px solid #E4E8EF;background:#F9FAFB;white-space:nowrap}
.cal-th.today{border-bottom-color:#1B6CA8;color:#1B6CA8}
.cal-date{font-size:8px;font-weight:400;display:block;margin-top:1px;color:#6B7280}
.cal-th.today .cal-date{color:#1B6CA8;font-weight:600}
.cal-hour{padding:3px 4px;font-size:8px;color:#6B7280;font-weight:600;white-space:nowrap;background:#F9FAFB;border-bottom:1px solid #F3F4F6;border-right:1px solid #F3F4F6}
.cal-slot{padding:5px 2px;text-align:center;border:1px solid #F3F4F6;font-size:9px;transition:all .15s}
.slot-av{background:#F0FDF4;color:#16A34A;cursor:pointer}
.slot-av:hover{background:#16A34A;color:#fff}
.slot-av.sel{background:#1B6CA8!important;color:#fff!important;font-weight:700}
.slot-bk{background:#FEF2F2;color:#DC2626;cursor:not-allowed}
.slot-ps{background:#F9FAFB;color:#CBD5E1;cursor:not-allowed}
.slot-hol{background:#FFFBEB;color:#D97706;cursor:not-allowed}
.mlegend{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}
.leg{font-size:8px;padding:2px 6px;border-radius:10px}
.leg.av{background:#F0FDF4;color:#16A34A}.leg.bk{background:#FEF2F2;color:#DC2626}
.leg.ps{background:#F9FAFB;color:#9CA3AF}.leg.hol{background:#FFFBEB;color:#D97706}
.m-old .m-qr,.m-old .m-pb,.m-old .mbt,.m-old .mbt-cb,.m-old .mwk-day,.m-old button,.m-old [onclick],.m-old a{filter:grayscale(100%);opacity:0.6;pointer-events:none !important;cursor:default !important}`;
  document.head.appendChild(styleEl);

  const htmlWrapper = document.createElement('div');
  htmlWrapper.id = 'memar-chatbot-container';
  htmlWrapper.innerHTML = `<div id="m-fab" onclick="mOpen()" title="تحدث مع المساعد الذكي">🤖<div id="m-dot"></div></div>
<div id="m-win">
  <div id="m-head">
    <div class="m-hl">
      <div class="m-ic">🤖<div class="m-ic-d"></div></div>
      <div><div class="m-name">مساعد معمار الذكي</div><div class="m-stat">🟢 متاح الآن · يجيب خلال ثوانٍ</div></div>
    </div>
    <div class="m-hr" onclick="event.stopPropagation()">
      <button class="m-hb" id="m-share-btn" style="display:none" onclick="mShareChat()" title="مشاركة المحادثة">🔗</button>
      <button class="m-hb" onclick="mBig()" title="فتح الشات الكامل">⛶</button>
      <button class="m-hb" onclick="mClose()" title="إغلاق">✕</button>
    </div>
  </div>
  <div id="m-sug">
    <div class="m-chip" onclick="mSug('أريد حجز استشارة')">📅 حجز موعد</div>
    <div class="m-chip" onclick="mSug('احسب سعر مشروعي')">🧮 تسعير فوري</div>
    <div class="m-chip" onclick="mSug('أين موقعكم؟')">📍 الموقع</div>
    <div class="m-chip" onclick="mSug('سكن خاص')">🏠 سكن خاص</div>
    <div class="m-chip" onclick="mSug('استثماري')">🏢 استثماري</div>
    <div class="m-chip" onclick="mSug('تجاري')">🏪 تجاري</div>
    <div class="m-chip" onclick="mSug('صناعي')">🏭 صناعي</div>
    <div class="m-chip" onclick="mSug('ما هي خدماتكم؟')">🔧 خدمات</div>
    <div class="m-chip" onclick="mSug('من انتم؟')">ℹ️ عن المكتب</div>
  </div>
  <div id="m-chat-area"></div>
  <div id="m-inp-area">
    <textarea id="m-inp" placeholder="اكتب رسالتك..." oninput="mRsz(this)" onkeydown="mKey(event)" rows="1"></textarea>
    <button id="m-send" onclick="mSend()">➤</button>
  </div>
</div>

<!-- ===== AUTH MODAL – iframe صفحة تسجيل الدخول الأصلية ===== -->
<div id="auth-modal-bg" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;align-items:center;justify-content:center;backdrop-filter:blur(6px)" onclick="closeAuthModal(event)">
  <div style="position:relative;width:min(960px,96vw);height:min(88vh,720px);border-radius:18px;overflow:hidden;box-shadow:0 28px 72px rgba(0,0,0,.35)" onclick="event.stopPropagation()">
    <!-- زر إغلاق فوق الـ iframe -->
    <button onclick="closeAuthModal()" style="position:absolute;top:12px;left:12px;z-index:10;background:rgba(0,0,0,.35);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .2s" onmouseover="this.style.background='rgba(0,0,0,.6)'" onmouseout="this.style.background='rgba(0,0,0,.35)'">✕</button>
    <iframe id="auth-iframe" src="memar_login.html" style="width:100%;height:100%;border:none;border-radius:18px" title="تسجيل الدخول"></iframe>
  </div>
</div>`;
  document.body.appendChild(htmlWrapper);

  function openAuthModal(mode){
  let url = 'memar_login.html';
  if (mode) url += '?mode=' + mode;
  
  const uStr = localStorage.getItem('memar_user');
  if (uStr) {
    const u = JSON.parse(uStr);
    url += (url.includes('?') ? '&' : '?') + 'action=register&name=' + encodeURIComponent(u.name||'') + '&phone=' + encodeURIComponent(u.rawPhone || u.phone || '') + '&cc=' + encodeURIComponent(u.countryCode || '');
  }
  
  if (mode && mode.startsWith('chatbot_booking')) {
     const iframeHTML = `<iframe id="chat-auth-iframe" src="${url}" style="width:100%; height:420px; border:none; border-radius:12px; background:#fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05)"></iframe>`;
     mBot('يرجى استكمال التسجيل أو تسجيل الدخول لمتابعة أعمالك:', iframeHTML);
     return;
  }

  document.getElementById('auth-modal-bg').style.display='flex';
  document.body.style.overflow='hidden';
  const f=document.getElementById('auth-iframe');
  f.src = url;
}
window.openAuthModal = openAuthModal;

function closeAuthModal(e){
  if(e && e.target!==document.getElementById('auth-modal-bg')) return;
  document.getElementById('auth-modal-bg').style.display='none';
  document.body.style.overflow='';
}
// إغلاق بمفتاح Escape
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeAuthModal({target:document.getElementById('auth-modal-bg')});
});


window.addEventListener('message', function(e) {
  if (e.data === 'chatbot_booking_success') {
    closeAuthModal();
    const chatIframe = document.getElementById('chat-auth-iframe');
    if (chatIframe) {
       chatIframe.parentElement.innerHTML = '<div style="color:#2D9B6F; font-weight:800; text-align:center; padding:15px; font-size:12px">✅ تم تسجيل الدخول بنجاح!</div>';
    }
    mShowBook();
  } else if (e.data === 'close_chatbot_booking') {
    closeAuthModal();
    const chatIframe = document.getElementById('chat-auth-iframe');
    if (chatIframe) {
       chatIframe.parentElement.innerHTML = '<div style="color:#9CA3AF; font-weight:700; text-align:center; padding:10px; font-size:11px">❌ تم الإلغاء</div>';
    }
  }
});

// ===== CHAT WIDGET ENGINE =====
const mPRICES={residential:{full:[550,595,950,1350,2150],design:[150,150,150,200,300]},investment:{full:[1800,2500,3500,5000],design:[400,550,750,1000]},commercial:{full:[2000,2800,4000,5500],design:[450,600,850,1100]},industrial:{full:[1500,2000,3000],design:[350,500,700]},hotel:{full:[3000,5000,7000],design:[700,1100,1500]},government:{full:[2200,3500,5500],design:[500,800,1200]}};
const mPNAMES={residential:'سكن خاص',investment:'استثماري',commercial:'تجاري',industrial:'صناعي',hotel:'فندقي',government:'حكومي'};
const mSNAMES={full:'📦 شاملة',design:'📐 تصميم',license:'🔑 ترخيص',supervision:'👷 إشراف'};
let base_mKB = {
  pricing_villa:{text:'أسعار السكن الخاص:',extra:'<table style="font-size:11px;width:100%;border-collapse:collapse;margin-top:6px"><tr style="background:#1B6CA8;color:#fff"><th style="padding:4px 7px;text-align:right">المساحة</th><th style="padding:4px 7px">شاملة</th><th style="padding:4px 7px">تصميم</th></tr><tr><td style="padding:4px 7px">≤100م²</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">550</td><td style="padding:4px 7px">150</td></tr><tr style="background:#f5f8fc"><td style="padding:4px 7px">≤400م²</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">595</td><td style="padding:4px 7px">150</td></tr><tr><td style="padding:4px 7px">≤600م²</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">950</td><td style="padding:4px 7px">150</td></tr><tr style="background:#f5f8fc"><td style="padding:4px 7px">&gt;600م²</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">1,350+</td><td style="padding:4px 7px">200+</td></tr></table>',qr:['احسب مشروعي بالتفصيل','الباقات','احجز استشارة']},
  packages:{text:'5 باقات متكاملة:',extra:'<table style="font-size:11px;width:100%;border-collapse:collapse;margin-top:6px"><tr style="background:#1B6CA8;color:#fff"><th style="padding:4px 7px;text-align:right">الباقة</th><th style="padding:4px 7px">السعر</th></tr><tr><td style="padding:4px 7px">📦 مخططات</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">550</td></tr><tr style="background:#f5f8fc"><td style="padding:4px 7px">🔑 ترخيص</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">595</td></tr><tr><td style="padding:4px 7px">⭐ تمييز</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">950</td></tr><tr style="background:#f5f8fc"><td style="padding:4px 7px">🏛️ معمار</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">1,350</td></tr><tr><td style="padding:4px 7px">👁️ رؤية</td><td style="padding:4px 7px;font-weight:700;color:#1B6CA8">2,150</td></tr></table>',qr:['تفاصيل باقة تمييز','احسب مشروعي','تواصل']},
  license:{text:'خدمات التراخيص:\n🔑 رخصة البناء\n🔥 رخصة الإطفاء\n⚡ موافقة الكهرباء\n📐 المخرج الصحي\n\nجميع الرسوم مشمولة ✅',qr:['كم يستغرق؟','احسب السعر']},
  meeting:{text:'يسعدنا جدولة استشارة! 📅\n\nاختر طريقة الاجتماع وموعدك المناسب.',qr:['احجز الآن']},
  location:{text:'📍 حولي – شارع ابن خلدون\nبرج النفيسي – الدور الأول\n\n🕐 الأحد–الخميس: 9ص–5م',qr:['احجز أونلاين']},
  contact:{text:'📞 66227785 / 65656923\n💬 واتساب: 96566227785+\n📧 memar.group.kw@gmail.com',qr:['واتساب مباشر'],cta:'whatsapp'},
  supervision:{text:'خدمة الإشراف الهندسي:\n👷 زيارات يومية\n📋 تقارير أسبوعية\n✅ مراقبة الجودة\n\nالأسعار:\n≤400م²: 150 د.ك/شهر\n>400م²: 200 د.ك/شهر',qr:['اطلب إشراف']},
  reminder:{text:'تم ضبط التذكير بنجاح! ⏰\nسيقوم النظام بتذكيرك في الوقت المحدد لجدولة استشارتك.',qr:['احسب تسعيرة','الباقات']},
  default:{text:'يسعدني مساعدتك! 😊\n\nأنا أساعدك في:\n• أسعار المشاريع\n• التراخيص والخدمات\n• حجز استشارة مجانية\n• الباقات المتاحة',qr:['احسب مشروعي','الخدمات','احجز']}
};

function getMemarKB() {
  try {
    const custom = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
    return { ...base_mKB, ...custom };
  } catch (e) {
    return base_mKB;
  }
}
let mKB = base_mKB;

function mDetect(m){
  const norm = (str) => str.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/[ًٌٍَُِّْ]/g, '');
  const normT = norm(m);
  const includesNorm = (kw) => normT.includes(norm(kw));

  const fuzzy = (kw) => {
    const nk = norm(kw);
    if (includesNorm(kw)) return true;
    
    const words = normT.split(/\s+/);
    for (let w of words) {
       if (Math.abs(w.length - nk.length) <= 2) {
         let diff = 0;
         for (let char of nk) {
            if (!w.includes(char)) diff++;
         }
         if (diff <= 1 && nk.length > 3) return true;
       }
    }
    return false;
  };

  const h = a => a.some(k => fuzzy(k));

  if(h(['احسب','تسعير','حاسبه','حاسبة','سعر'])) return 'pricing';
  if(h(['سعر','تكلفه','كم']) && h(['فيلا','سكن','منزل','خاص'])) return 'pricing_villa';
  if(h(['باقه','باقات','حزمه'])) return 'packages';
  if(h(['رخصه','ترخيص','بلديه','اطفاء'])) return 'license';
  if(h(['اجتماع','استشاره','موعد','حجز'])) return 'meeting';
  if(h(['عنوان','موقع','وين','مكتب'])) return 'location';
  if(h(['تواصل','اتصل','هاتف','واتساب','رقم'])) return 'contact';
  if(h(['اشراف','إشراف'])) return 'supervision';
  if(h(['تذكير','ذكرنى','ذكر'])) return 'reminder';

  const customKB = getMemarKB();
  for(let k in customKB) {
    if(k !== 'default' && !base_mKB[k]) {
      const keywords = k.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
      if(h(keywords)) return k;
    }
  }

  return 'default';
}

let mExpanded=false,mpcA=false,mpcN=0;
function mTime(){return new Date().toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'});}
function mHTML(type,text,extra,qrs,cta){
  const av=type==='bot'?'🤖':'أ';
  const txt=text.replace(/\n/g,'<br>');
  const exH=extra||'';
  const qrH=(qrs&&qrs.length)?'<div class="m-qrs">'+qrs.map(r=>'<div class="m-qr" onclick="mSug(\''+r+'\')">'+r+'</div>').join('')+'</div>':'';
  let ctaH='';
  if(cta==='whatsapp') ctaH='<a href="https://wa.me/96566227785" target="_blank" style="display:inline-flex;align-items:center;gap:5px;margin-top:7px;padding:7px 13px;background:#25D366;color:#fff;border-radius:7px;text-decoration:none;font-size:11px;font-weight:700">💬 واتساب مباشر</a>';
  return '<div class="m-av">'+av+'</div><div><div class="m-bub">'+txt+exH+qrH+ctaH+'</div><div class="m-time">'+mTime()+'</div></div>';}
function mRender(type,html,skipSave=false){
  const a=document.getElementById('m-chat-area');
  if (type === 'bot' || type === 'user') {
      a.querySelectorAll('.m-msg.bot:not(.m-old)').forEach(msg => {
         msg.classList.add('m-old');
         msg.querySelectorAll('.m-qr, .m-pb, .mbt-cb, .mwk-day, button, [onclick], strong[onclick], a').forEach(el => {
           el.style.pointerEvents = 'none';
           el.style.cursor = 'default';
           el.removeAttribute('onclick');
         });
      });
  }
  const d=document.createElement('div');d.className='m-msg '+type;d.innerHTML=html;a.appendChild(d);a.scrollTop=9999;
  if(!skipSave){
    const u = JSON.parse(localStorage.getItem('memar_user') || 'null');
    if (u) {
      const k = 'memar_chat_history_' + (u.phone || 'def');
      let hist=[];try{hist=JSON.parse(localStorage.getItem(k)||'[]');}catch(e){}
      hist.push({type,html});if(hist.length>50){hist=hist.slice(-50);}
      try{localStorage.setItem(k,JSON.stringify(hist));}catch(e){}
    }
  }
}
function mBot(text,extra,qrs,cta){mRender('bot',mHTML('bot',text,extra||'',qrs||[],cta||''));}
function mUser(text){mRender('user',mHTML('user',text,'','',''));}
function mTyping(){const a=document.getElementById('m-chat-area'),d=document.createElement('div');d.className='m-msg bot';d.id='m-t';d.innerHTML='<div class="m-av">🤖</div><div class="m-typing"><span></span><span></span><span></span></div>';a.appendChild(d);a.scrollTop=9999;}
function mHT(){const t=document.getElementById('m-t');if(t)t.remove();}

function mOpenPricing(){
  if(mpcA){document.getElementById('m-chat-area').scrollTop=9999;return;}
  mpcA=true;const id='p'+(++mpcN);
  const rows=Object.entries(mPRICES).map(([k,v])=>'<div class="m-pb'+(k==='residential'?' a':'')+'" data-v="'+k+'" onclick="mPS(this,\''+id+'-t\')">'+mPNAMES[k]+'</div>').join('');
  const svcs=Object.entries(mSNAMES).map(([k,v],i)=>'<div class="m-pb'+(i===0?' a':'')+'" data-v="'+k+'" onclick="mPS(this,\''+id+'-s\')">'+v+'</div>').join('');
  const card='<div class="m-pc"><div style="font-size:12px;font-weight:700;margin-bottom:9px">🧮 حاسبة تكلفة المشروع</div><div style="font-size:10px;opacity:.8;margin-bottom:5px">نوع المشروع:</div><div class="m-pc-gr" id="'+id+'-t">'+rows+'</div><div style="font-size:10px;opacity:.8;margin-bottom:5px">الخدمة:</div><div class="m-pc-gr" id="'+id+'-s">'+svcs+'</div><div class="m-prow"><input class="m-pi" id="'+id+'-a" type="number" placeholder="المساحة م²"><span class="m-punit">م²</span></div><button class="m-pcalc" onclick="mCalc(\''+id+'\')">احسب التكلفة التقديرية</button><div class="m-pres" id="'+id+'-r"><div style="font-size:10px;opacity:.7;margin-bottom:3px">التكلفة التقديرية</div><div class="m-pres-v" id="'+id+'-v">—</div><div class="m-pres-n">تشمل جميع الرسوم الحكومية ✅</div></div><div id="'+id+'-act" style="display:none;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px"><button onclick="mAcceptQuote()" style="padding:7px;background:#2ECC71;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;font-family:Cairo,sans-serif">✅ موافق على عرض السعر</button><button onclick="mDiscussQuote()" style="padding:7px;background:rgba(255,255,255,.15);color:#fff;border:1.5px solid rgba(255,255,255,.4);border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;font-family:Cairo,sans-serif">💬 أريد مناقشة السعر</button></div></div>';
  mBot('بكل سرور! 🧮 اختر نوع مشروعك وأدخل المساحة:',card,['لديّ سؤال آخر','احجز استشارة']);}

window.mPS=function(el,gid){document.getElementById(gid).querySelectorAll('.m-pb').forEach(b=>b.classList.remove('a'));el.classList.add('a');};
window.mCalc=function(id){
  const tEl=document.getElementById(id+'-t').querySelector('.a');
  const sEl=document.getElementById(id+'-s').querySelector('.a');
  const area=parseFloat(document.getElementById(id+'-a').value);
  if(!area||area<=0){alert('أدخل المساحة');return;}
  const tbl=mPRICES[tEl?.dataset.v||'residential'];
  const svc=sEl?.dataset.v||'full';
  const col=(svc==='design'||svc==='license')?tbl.design:tbl.full;
  let p;if(area<=100)p=col[0];else if(area<=400)p=col[1];else if(area<=600)p=col[2];else if(area<=1000&&col[3])p=col[3];else p=col[col.length-1];
  document.getElementById(id+'-v').textContent=p.toLocaleString('ar-KW')+' د.ك';
  document.getElementById(id+'-r').style.display='block';
  window._mQ={p,t:tEl?.dataset.v||'residential',s:svc,a:area};
  const actDiv=document.getElementById(id+'-act');if(actDiv)actDiv.style.display='grid';
  mpcA=false;};

// ===== QUOTE DATA =====
const mWORKS={
  full:['تصميم معماري شامل (مخططات + واجهات ثلاثية الأبعاد)','تصميم إنشائي وحسابات التسليح','مخطط مساحي معتمد','فحص التربة','اعتماد تيار الكهرباء','اعتماد المخرج الصحي','استخراج رخصة البناء من البلدية'],
  design:['تصميم معماري شامل (مخططات + واجهات ثلاثية الأبعاد)','تصميم إنشائي وحسابات التسليح','مخطط مساحي'],
  license:['استخراج رخصة البناء من البلدية','اعتماد تيار الكهرباء','اعتماد المخرج الصحي','فحص التربة'],
  supervision:['إشراف هندسي ميداني يومي','تقارير أسبوعية للمالك','مراقبة جودة ومطابقة المواصفات','متابعة جداول الأعمال']
};
const mDUR={residential:60,investment:90,commercial:90,industrial:90,hotel:120,government:90};
const mDOCS=['صورة الهوية الوطنية المدنية','وثيقة الملكية / الصك','مخطط الموقع المساحي','خطاب التفويض (إن لزم)'];
const mTERMS=['السعر تقديري وقابل للمناقشة مع إدارة المكتب','صلاحية عرض السعر 30 يوماً من تاريخ الإصدار','يبدأ العمل بعد التوقيع على العقد وسداد الدفعة الأولى','جميع الرسوم والضرائب الحكومية مشمولة في السعر المذكور','لا تشمل أعمال الهدم أو إزالة المباني القائمة','تعديلات التصميم مجانية حتى 3 تعديلات رئيسية'];

// Step 1: Show registration form inside chat
window.mAcceptQuote = function() {
  const q = window._mQ; if(!q) return;
  const fid = 'cf'+Date.now();
  const f = `<div style="background:#fff;border:2px solid #1B6CA8;border-radius:12px;padding:14px;font-size:11px;direction:rtl">
    <div style="color:#1B6CA8;font-weight:700;font-size:13px;margin-bottom:4px">📋 بيانات العميل</div>
    <div style="color:#888;font-size:10px;margin-bottom:12px">أدخل بياناتك لإنشاء عرض السعر الرسمي</div>
    <div style="display:flex;flex-direction:column;gap:7px">
      <input id="${fid}-n" placeholder="الاسم الكريم *" style="padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:12px;outline:none;direction:rtl;width:100%;box-sizing:border-box">
      <input id="${fid}-p" placeholder="رقم الهاتف *" type="tel" style="padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:12px;outline:none;direction:rtl;width:100%;box-sizing:border-box">
      <input id="${fid}-e" placeholder="البريد الإلكتروني" type="email" style="padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:12px;outline:none;direction:rtl;width:100%;box-sizing:border-box">
      <select id="${fid}-t" style="padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:12px;outline:none;background:#fff;width:100%;box-sizing:border-box">
        <option value="individual">فرد – مالك سكن خاص</option>
        <option value="investor">مستثمر</option>
        <option value="company">شركة عقارية</option>
        <option value="government">جهة حكومية</option>
      </select>
      <button onclick="mSubmitClient('${fid}')" style="padding:9px;background:linear-gradient(135deg,#1B6CA8,#2D9B6F);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;font-family:Cairo,sans-serif;width:100%">إنشاء عرض السعر الرسمي ←</button>
    </div>
  </div>`;
  mUser('✅ موافق على عرض السعر');
  setTimeout(()=>mBot('يرجى إدخال بياناتك لإنشاء عرض السعر:',f,[]),500);
};

// Step 2: Validate and generate full quote
window.mSubmitClient = function(fid) {
  const name = document.getElementById(fid+'-n')?.value.trim();
  const phone = document.getElementById(fid+'-p')?.value.trim();
  const email = document.getElementById(fid+'-e')?.value.trim()||'';
  const ctype = document.getElementById(fid+'-t')?.value||'individual';
  const ctypeNames={individual:'فرد – مالك سكن خاص',investor:'مستثمر',company:'شركة عقارية',government:'جهة حكومية'};
  if(!name||!phone){alert('⚠️ الاسم والهاتف مطلوبان');return;}
  const q=window._mQ; if(!q) return;
  window._mClient={name,phone,email,ctype};
  
  if (typeof window.memar_createLeadAndClient === 'function') {
    window.memar_createLeadAndClient({ 
      name, 
      phone, 
      email, 
      type: 'lead', 
      source: 'chatbot_quote',
      details: 'طلب تسعير عن طريق الشات بوت | النوع: ' + (window.mPNAMES ? window.mPNAMES[q.t] : q.t)
    });
  }
  
  mUser('👤 '+name+' · '+phone);
  setTimeout(()=>mShowFullQuote(q,{name,phone,email,ctype,ctypeName:ctypeNames[ctype]}),700);
};

// Step 3: Show full quote card in chat
window.mShowFullQuote = function(q,cl) {
  const qn='MEQ-'+new Date().getFullYear()+'-'+Math.floor(1000+Math.random()*9000);
  const today=new Date(); const validDate=new Date(today); validDate.setDate(validDate.getDate()+30);
  const fmt=d=>d.toLocaleDateString('ar-KW');
  const works=mWORKS[q.s]||mWORKS.full;
  const dur=mDUR[q.t]||90;
  window._mCurrentQuote={qn,q,cl,works,dur};

  const worksHTML=works.map(w=>`<div style="display:flex;gap:6px;padding:4px 0;border-bottom:1px solid #f0f4f8;font-size:10px"><span style="color:#2D9B6F;flex-shrink:0">✓</span><span>${w}</span></div>`).join('');
  const docsHTML=mDOCS.map(d=>`<div style="font-size:10px;padding:2px 0">• ${d}</div>`).join('');
  const termsHTML=mTERMS.map((t,i)=>`<div style="font-size:10px;padding:2px 0;color:#5A6478">${i+1}. ${t}</div>`).join('');

  const card=`<div style="background:#fff;border:2px solid #1B6CA8;border-radius:12px;overflow:hidden;font-size:11px;direction:rtl;box-shadow:0 4px 16px rgba(27,108,168,.12)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D4A7A,#1B6CA8);padding:14px 14px 10px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-size:14px;font-weight:800">مجموعة معمار</div><div style="font-size:9px;opacity:.8">للاستشارات الهندسية · الكويت</div></div>
        <div style="text-align:left;font-size:9px;opacity:.8"><div>${qn}</div><div>${fmt(today)}</div><div>صلاحية: ${fmt(validDate)}</div></div>
      </div>
      <div style="margin-top:8px;font-size:11px;font-weight:700;background:rgba(255,255,255,.15);border-radius:6px;padding:5px 8px">📋 عرض سعر هندسي</div>
    </div>
    <!-- Sections -->
    <div style="padding:12px;display:flex;flex-direction:column;gap:10px">
      <!-- 1. بيانات العميل -->
      <div>
        <div style="font-size:10px;font-weight:700;color:#1B6CA8;border-bottom:2px solid #E6F1FB;padding-bottom:4px;margin-bottom:6px">👤 بيانات العميل</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:10px">
          <span style="color:#888">الاسم:</span><span style="font-weight:600">${cl.name}</span>
          <span style="color:#888">الهاتف:</span><span>${cl.phone}</span>
          ${cl.email?`<span style="color:#888">البريد:</span><span>${cl.email}</span>`:''}
          <span style="color:#888">نوع العميل:</span><span>${cl.ctypeName}</span>
        </div>
      </div>
      <!-- 2. بيانات المشروع -->
      <div>
        <div style="font-size:10px;font-weight:700;color:#1B6CA8;border-bottom:2px solid #E6F1FB;padding-bottom:4px;margin-bottom:6px">🏗️ بيانات المشروع</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:10px">
          <span style="color:#888">نوع المشروع:</span><span style="font-weight:600">${mPNAMES[q.t]||q.t}</span>
          <span style="color:#888">المساحة:</span><span>${q.a} م²</span>
          <span style="color:#888">الخدمة:</span><span>${mSNAMES[q.s]||q.s}</span>
          <span style="color:#888">المدة التقديرية:</span><span>${dur} يوم عمل</span>
        </div>
      </div>
      <!-- 3. الأعمال المشمولة -->
      <div>
        <div style="font-size:10px;font-weight:700;color:#1B6CA8;border-bottom:2px solid #E6F1FB;padding-bottom:4px;margin-bottom:6px">📌 الأعمال المشمولة</div>
        ${worksHTML}
      </div>
      <!-- 4. السعر -->
      <div style="background:#E6F1FB;border-radius:8px;padding:10px">
        <div style="font-size:10px;font-weight:700;color:#1B6CA8;margin-bottom:6px">💰 السعر الإجمالي التقديري</div>
        <div style="font-size:22px;font-weight:800;color:#1B6CA8;text-align:center;margin:4px 0">${q.p.toLocaleString('ar-KW')} <span style="font-size:14px">د.ك</span></div>
        <div style="font-size:9px;color:#888;text-align:center">شامل جميع الرسوم الحكومية</div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;justify-content:space-between;font-size:10px;background:#fff;border-radius:5px;padding:4px 8px"><span>📌 الدفعة الأولى عند التوقيع (40%)</span><strong style="color:#1B6CA8">${Math.round(q.p*.4).toLocaleString('ar-KW')} د.ك</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;background:#fff;border-radius:5px;padding:4px 8px"><span>📌 الدفعة الثانية عند رخصة الإطفاء (30%)</span><strong style="color:#1B6CA8">${Math.round(q.p*.3).toLocaleString('ar-KW')} د.ك</strong></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;background:#fff;border-radius:5px;padding:4px 8px"><span>📌 الدفعة الثالثة عند رخصة البناء (30%)</span><strong style="color:#1B6CA8">${Math.round(q.p*.3).toLocaleString('ar-KW')} د.ك</strong></div>
        </div>
      </div>
      <!-- 5. الأوراق المطلوبة -->
      <div>
        <div style="font-size:10px;font-weight:700;color:#1B6CA8;border-bottom:2px solid #E6F1FB;padding-bottom:4px;margin-bottom:6px">📂 الأوراق المطلوبة</div>
        ${docsHTML}
      </div>
      <!-- 6. الشروط والأحكام -->
      <div style="background:#F7F8FA;border-radius:7px;padding:8px">
        <div style="font-size:10px;font-weight:700;color:#5A6478;margin-bottom:5px">📜 الشروط والأحكام</div>
        ${termsHTML}
      </div>
      <!-- Actions -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px">
        <button onclick="mGenPDF()" style="padding:8px;background:#1B6CA8;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:10px;font-weight:700;font-family:Cairo,sans-serif">⬇️ تحميل PDF</button>
        <button onclick="mGenWA()" style="padding:8px;background:#25D366;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:10px;font-weight:700;font-family:Cairo,sans-serif">💬 إرسال واتساب</button>
        <button onclick="mDiscussQuote()" style="padding:8px;background:#fff;color:#1B6CA8;border:1.5px solid #1B6CA8;border-radius:7px;cursor:pointer;font-size:10px;font-weight:700;font-family:Cairo,sans-serif;grid-column:span 2">📅 احجز موعد لمناقشة السعر</button>
      </div>
    </div>
  </div>`;
  mBot('تم إنشاء عرض السعر الرسمي:',card,[]);
};

// ===== PDF Generation =====
window.mGenPDF = function() {
  const d=window._mCurrentQuote; if(!d) return;
  const {qn,q,cl,works,dur}=d;
  const today=new Date(); const vd=new Date(today); vd.setDate(vd.getDate()+30);
  const fmt=x=>x.toLocaleDateString('ar-KW');
  const worksRows=works.map(w=>`<tr><td style="padding:6px 10px">✓ ${w}</td></tr>`).join('');
  const docsRows=mDOCS.map(d=>`<li>${d}</li>`).join('');
  const termRows=mTERMS.map((t,i)=>`<li>${i+1}. ${t}</li>`).join('');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>عرض سعر ${qn}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;direction:rtl;color:#1A1F2E;font-size:12px;background:#fff}
    .page{max-width:800px;margin:0 auto;padding:30px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;padding:20px;background:linear-gradient(135deg,#0D4A7A,#1B6CA8);color:#fff;border-radius:10px 10px 0 0;margin-bottom:0}
    .co-name{font-size:20px;font-weight:800}.co-sub{font-size:10px;opacity:.8;margin-top:2px}
    .qn-info{text-align:left;font-size:10px;opacity:.8;line-height:1.7}
    .q-title{background:#E6F1FB;padding:10px 20px;font-size:14px;font-weight:700;color:#1B6CA8;border-bottom:2px solid #1B6CA8}
    .section{padding:16px 20px;border-bottom:1px solid #E4E8EF}
    .section-title{font-size:11px;font-weight:700;color:#1B6CA8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;border-bottom:2px solid #E6F1FB;padding-bottom:5px}
    .grid2{display:grid;grid-template-columns:140px 1fr;gap:4px 16px;font-size:12px}
    .grid2 .lbl{color:#888;font-size:11px}
    .grid2 .val{font-weight:600}
    table.works{width:100%;border-collapse:collapse}
    table.works tr{border-bottom:1px solid #f0f4f8}
    table.works td{padding:6px 10px;font-size:11px}
    .price-box{background:linear-gradient(135deg,#0D4A7A,#1B6CA8);color:#fff;border-radius:8px;padding:16px;text-align:center;margin:10px 0}
    .price-total{font-size:28px;font-weight:800;margin:4px 0}
    .pay-row{display:flex;justify-content:space-between;padding:7px 12px;background:#fff;border-radius:6px;margin-bottom:4px;font-size:11px;border:1px solid #E4E8EF}
    .pay-row strong{color:#1B6CA8}
    ul.docs,ul.terms{padding-right:16px;line-height:2;font-size:11px;color:#5A6478}
    .footer{background:#F7F8FA;padding:14px 20px;font-size:10px;color:#888;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #E4E8EF}
    .sign-area{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:16px;padding:16px 20px}
    .sign-box{border-top:1px solid #888;padding-top:6px;text-align:center;font-size:10px;color:#888}
    @media print{.no-print{display:none}body{font-size:11px}}
  </style></head><body><div class="page">
  <div class="hdr">
    <div><div class="co-name">مجموعة معمار</div><div class="co-sub">للاستشارات الهندسية · الكويت</div><div class="co-sub">📞 66227785 | memar.group.kw@gmail.com</div></div>
    <div class="qn-info"><div>رقم العرض: <strong>${qn}</strong></div><div>تاريخ الإصدار: ${fmt(today)}</div><div>صالح حتى: ${fmt(vd)}</div></div>
  </div>
  <div class="q-title">📋 عرض سعر هندسي</div>

  <div class="section">
    <div class="section-title">👤 بيانات العميل</div>
    <div class="grid2">
      <span class="lbl">الاسم الكريم:</span><span class="val">${cl.name}</span>
      <span class="lbl">رقم الهاتف:</span><span class="val">${cl.phone}</span>
      ${cl.email?`<span class="lbl">البريد الإلكتروني:</span><span class="val">${cl.email}</span>`:''}
      <span class="lbl">نوع العميل:</span><span class="val">${cl.ctypeName}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏗️ بيانات المشروع</div>
    <div class="grid2">
      <span class="lbl">نوع المشروع:</span><span class="val">${mPNAMES[q.t]||q.t}</span>
      <span class="lbl">مساحة الأرض:</span><span class="val">${q.a} م²</span>
      <span class="lbl">الخدمة المطلوبة:</span><span class="val">${mSNAMES[q.s]||q.s}</span>
      <span class="lbl">المدة التقديرية:</span><span class="val">${dur} يوم عمل</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📌 الأعمال المشمولة في عرض السعر</div>
    <table class="works">${worksRows}</table>
  </div>

  <div class="section">
    <div class="section-title">💰 السعر الإجمالي التقديري</div>
    <div class="price-box">
      <div style="font-size:11px;opacity:.8">الإجمالي شامل جميع الرسوم الحكومية</div>
      <div class="price-total">${q.p.toLocaleString('ar-KW')} د.ك</div>
      <div style="font-size:10px;opacity:.7">دينار كويتي فقط</div>
    </div>
    <div style="margin-top:10px">
      <div style="font-size:11px;font-weight:700;margin-bottom:6px;color:#1B6CA8">📅 جدول الدفعات (40% – 30% – 30%)</div>
      <div class="pay-row"><span>الدفعة الأولى: عند توقيع العقد (40%)</span><strong>${Math.round(q.p*.4).toLocaleString('ar-KW')} د.ك</strong></div>
      <div class="pay-row"><span>الدفعة الثانية: عند استلام رخصة الإطفاء (30%)</span><strong>${Math.round(q.p*.3).toLocaleString('ar-KW')} د.ك</strong></div>
      <div class="pay-row"><span>الدفعة الثالثة: عند استلام رخصة البناء (30%)</span><strong>${Math.round(q.p*.3).toLocaleString('ar-KW')} د.ك</strong></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📂 الأوراق المطلوبة من العميل</div>
    <ul class="docs">${docsRows}</ul>
  </div>

  <div class="section">
    <div class="section-title">📜 الشروط والأحكام</div>
    <ul class="terms">${termRows}</ul>
  </div>

  <div class="sign-area">
    <div class="sign-box">توقيع العميل<br>${cl.name}</div>
    <div class="sign-box">ختم وتوقيع المكتب<br>مجموعة معمار</div>
  </div>

  <div class="footer">
    <span>📍 حولي – برج النفيسي – الدور الأول · 📞 66227785 / 65656923</span>
    <button class="no-print" onclick="window.print()" style="padding:8px 20px;background:#1B6CA8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:Arial">🖨️ طباعة / PDF</button>
  </div>
  </div></body></html>`);
  w.document.close();
};

// ===== WhatsApp Share =====
window.mGenWA = function() {
  const d=window._mCurrentQuote; if(!d) return;
  const {qn,q,cl}=d;
  const txt=`*عرض سعر هندسي*\nمجموعة معمار للاستشارات الهندسية\n\nرقم العرض: ${qn}\nالعميل: ${cl.name}\nالمشروع: ${mPNAMES[q.t]||q.t} – ${q.a} م²\nالخدمة: ${mSNAMES[q.s]||q.s}\n\n*الإجمالي: ${q.p.toLocaleString('ar-KW')} د.ك*\nشامل جميع الرسوم الحكومية\nصلاحية 30 يوم\n\n📞 66227785\nmemar.group.kw@gmail.com`;
  window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
};

// ===== Discuss: Show booking after =====
window.mDiscussQuote = function() {
  mUser('💬 أريد مناقشة السعر');
  setTimeout(()=>mCheckBooking(),500);
};

window.mGetBookingCard = function(b) {
  const clientName = b.client ? (b.client.name || b.client.fullName || 'مستخدم مسجل') : 'مستخدم غير مسجل';
  const isGuest = b.client && (b.client.role === 'guest' || b.client.type === 'lead');
  let guestAlert = '';
  if (isGuest) {
      const qName = encodeURIComponent(b.client && b.client.name ? b.client.name : '');
      const qPhone = encodeURIComponent(b.client && b.client.phone ? b.client.phone : '');
      const authMode = 'chatbot_booking&action=register&name=' + qName + '&phone=' + qPhone;
      guestAlert = `<div style="margin-top:10px;padding:8px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;text-align:center;font-size:10px;color:#92400E">
        <div style="font-weight:700;margin-bottom:4px">⚠️ لمتابعة تفاصيل موعدك وأعمالك</div>
        <button onclick="openAuthModal('${authMode}')" style="background:#F59E0B;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:9px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">استكمل تسجيلك الآن ←</button>
      </div>`;
  }

  return `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <div style="font-weight:800;font-size:12px;color:#1B6CA8;margin-bottom:10px;display:flex;align-items:center;gap:6px">📌 تفاصيل الموعد</div>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:12px;font-size:10px;line-height:1.6">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin-bottom:6px"><span style="color:#6B7280;font-weight:700">العميل:</span><strong style="color:#1B6CA8">${clientName}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#6B7280;font-weight:700">رقم الموعد:</span><strong style="color:#111827">${b.id}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">التفاصيل:</span><strong style="color:#111827">${b.day} الساعة ${b.hour}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#6B7280;font-weight:700">النوع:</span><strong style="color:#111827">${b.typeLabel || 'غير محدد'}</strong></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
         <button onclick="mModifyBooking('${b.id}')" style="flex:1;padding:8px;background:#1B6CA8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;transition:all 0.2s;box-shadow:0 3px 8px rgba(27,108,168,.2)" onmouseover="this.style.background='#0D4A7A'" onmouseout="this.style.background='#1B6CA8'">✏️ تعديل الموعد</button>
         <button onclick="mCancelBooking('${b.id}')" style="padding:4px 8px;background:none;color:#9CA3AF;border:none;cursor:pointer;font-size:9px;font-weight:600;font-family:Cairo,sans-serif;text-decoration:underline;transition:all 0.2s" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#9CA3AF'">إلغاء</button>
      </div>
      ${guestAlert}
    </div>`;
};

window.mCheckBooking = function() {
  const user = JSON.parse(localStorage.getItem('memar_user') || 'null');
  if (!user || (!user.name && !user.fullName)) {
      const authCard = `<div style="background:#fff;border:1.5px solid #E4E8EF;border-radius:11px;padding:12px;direction:rtl;font-size:11px">
        <div style="font-weight:700;color:#1B6CA8;margin-bottom:10px">كيف تفضل المتابعة؟</div>
        <button onclick="openAuthModal('chatbot_booking')" style="width:100%;padding:9px;background:linear-gradient(135deg,#1B6CA8,#0D4A7A);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:Cairo,sans-serif;margin-bottom:6px">تسجيل الدخول / إنشاء حساب</button>
        <button onclick="window.mShowGuestBookingForm()" style="width:100%;padding:9px;background:#F3F4F6;color:#374151;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:Cairo,sans-serif;transition:all 0.2s" onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">تسجيل بيانات سريع</button>
      </div>`;
      mBot('يرجى تحديد طريقة المتابعة لحجز موعدك:', authCard);
      return;
  }

  const bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
  const active = bs.filter(b => b.status !== 'cancelled');
  if (active.length > 0) {
    const b = active[active.length - 1];
    mBot('لديك موعد محجوز سلفاً، يمكنك إدارته من هنا:', window.mGetBookingCard(b), ['احسب مشروعي', 'الخدمات']);
  } else {
    mShowBook();
  }
};

window.mShowGuestBookingForm = function() {
  const fid = 'gbf-' + Date.now();
  const cList = window.MEMAR_COUNTRIES || [
    { code: '+965', flag: '🇰🇼' },
    { code: '+966', flag: '🇸🇦' },
    { code: '+971', flag: '🇦🇪' },
    { code: '+974', flag: '🇶🇦' },
    { code: '+973', flag: '🇧🇭' },
    { code: '+968', flag: '🇴🇲' },
    { code: '+20',  flag: '🇪🇬' },
    { code: '+962', flag: '🇯🇴' }
  ];
  const cOpts = cList.map(c => `<option value="${c.code}">${c.flag} ${c.code}</option>`).join('');
  
  const formHTML = `<div style="margin-top:10px;direction:rtl;font-size:11px">
    <div style="display:flex;flex-direction:column;gap:7px">
      <input id="${fid}-n" placeholder="الاسم الكريم *" style="padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:11px;outline:none;width:100%;box-sizing:border-box">
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;gap:5px;direction:ltr;width:100%">
          <select id="${fid}-cc" style="width:85px;padding:8px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:11px;outline:none;background:#F9FAFB">
             ${cOpts}
          </select>
          <input id="${fid}-p" placeholder="رقم الهاتف *" type="tel" style="flex:1;min-width:0;direction:rtl;padding:8px 10px;border:1.5px solid #E4E8EF;border-radius:7px;font-family:Cairo,sans-serif;font-size:11px;outline:none;box-sizing:border-box" oninput="const nv=this.value.replace(/[^0-9]/g,''); if(nv!==this.value){this.value=nv; const e=document.getElementById('${fid}-err'); if(e){e.style.display='block'; clearTimeout(this.to); this.to=setTimeout(()=>e.style.display='none',2000);}}">
        </div>
        <div id="${fid}-err" style="color:#DC2626;font-size:10px;display:none;text-align:right">* يرجى إدخال أرقام فقط</div>
      </div>
      <button onclick="window.mSubmitGuestBooking('${fid}')" style="width:100%;padding:9px;background:linear-gradient(135deg,#2D9B6F,#1A7A55);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:Cairo,sans-serif">متابعة الحجز ←</button>
    </div>
  </div>`;
  mUser('تسجيل بيانات سريع');
  setTimeout(() => mBot('الرجاء إدخال اسمك ورقم هاتفك:', formHTML), 400);
};

window.mSubmitGuestBooking = function(fid) {
  const name = document.getElementById(fid + '-n')?.value.trim();
  const phoneVal = document.getElementById(fid + '-p')?.value.trim();
  const ccVal = document.getElementById(fid + '-cc')?.value || '';
  const phone = phoneVal ? ccVal + phoneVal : '';
  if (!name || !phoneVal) {
    alert('يرجى إدخال الاسم ورقم الهاتف.');
    return;
  }
  if (!/^[0-9]+$/.test(phoneVal)) {
    alert('يجب تعديل إلى رقم تليفون صحيح (أرقام فقط).');
    return;
  }
  localStorage.setItem('memar_user', JSON.stringify({
    name: name,
    phone: phone,
    role: 'guest',
    loginAt: new Date().toISOString()
  }));
  
  if (typeof window.memar_createLeadAndClient === 'function') {
    window.memar_createLeadAndClient({ name, phone, email: '', source: 'chatbot_booking', role: 'guest', type: 'lead' });
  }
  
  mUser('تم إدخال البيانات (' + name + ')');
  setTimeout(() => mShowBook(), 500);
};

window.mCancelConfirm = function(isCancel) {
  if (!window._cbTargetBookingId) return;
  const id = window._cbTargetBookingId;
  const bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
  const activeBooking = bs.find(b => b.id === id);

  if(isCancel) {
     mUser('❌ نعم، ألغي');
     const updated = bs.map(b => b.id === id ? { ...b, status: 'cancelled' } : b);
     localStorage.setItem('memar_bookings', JSON.stringify(updated));
     window._cbTargetBookingId = null;
     mTyping();
     setTimeout(() => { 
        mHT(); 
        const cancelCardHTML = `<div style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:12px;padding:14px;color:#9CA3AF;font-size:11px;direction:rtl">
            <div style="font-weight:800;font-size:12px;color:#6B7280;margin-bottom:12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px">🚫 تم الإلغاء</div>
            <div style="background:#fff;border:1px solid #F3F4F6;border-radius:8px;padding:12px;font-size:10px;line-height:1.6;color:#9CA3AF">
              <div style="display:flex;justify-content:space-between"><span>📌 رقم:</span><strong style="text-decoration:line-through">#${activeBooking.id.replace('B','')}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px"><span>📅 اليوم:</span><strong style="text-decoration:line-through">${activeBooking.day}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px"><span>🕐 الساعة:</span><strong style="text-decoration:line-through">${activeBooking.hour}</strong></div>
            </div>
            <div style="margin-top:12px;font-size:11px;color:#6B7280;text-align:center;font-weight:700">ماذا تريد أن نفعل الآن؟</div>
          </div>`;
        mBot('', cancelCardHTML, ['حجز موعد جديد', 'تذكيري بعد أسبوع', 'تذكيري بعد أسبوعين', 'تذكيري بعد ٣ أسابيع', 'تذكيري بعد شهر']); 
     }, 600);
  } else {
     mUser('↩ احتفظ بالموعد');
     window._cbTargetBookingId = null;
     mTyping();
     setTimeout(() => { 
        mHT(); 
        const cardHTML = `<div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:14px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
            <div style="font-weight:800;font-size:12px;color:#16A34A;margin-bottom:12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px">✅ موعدك لا يزال محجوزاً</div>
            <div style="background:#fff;border:1px solid #DCFCE7;border-radius:8px;padding:12px;font-size:10px;line-height:1.6">
              <div style="display:flex;justify-content:space-between"><span style="color:#6B7280;font-weight:700">📌 رقم:</span><strong style="color:#111827">#${activeBooking.id.replace('B','')}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="color:#6B7280;font-weight:700">📅 اليوم:</span><strong style="color:#111827">${activeBooking.day}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="color:#6B7280;font-weight:700">🕐 الساعة:</span><strong style="color:#111827">${activeBooking.hour}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="color:#6B7280;font-weight:700">📋 الطريقة:</span><strong style="color:#111827">${activeBooking.typeLabel || 'غير محدد'}</strong></div>
            </div>
          </div>`;
        mBot('تمتع! موعدك محجوز ونحن بانتظارك ❤️', cardHTML, ['لديّ سؤال آخر']); 
     }, 600);
  }
};

window.mCancelBooking = function(id) {
  window._cbTargetBookingId = id;
  const card = `<div style="background:#fff;border:1px solid #FCA5A5;border-radius:12px;padding:16px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <div style="font-weight:800;font-size:12px;color:#DC2626;margin-bottom:14px;text-align:center;line-height:1.5">
         ⚠️ هل تريد فعلاً إلغاء الموعد مع مجموعة معمار؟
      </div>
      <div style="display:flex;gap:8px">
         <button onclick="window.mCancelConfirm(false)" style="flex:1;padding:10px;background:#F3F4F6;color:#374151;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;transition:all 0.2s">↩ احتفظ بالموعد</button>
         <button onclick="window.mCancelConfirm(true)" style="flex:1;padding:10px;background:#DC2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;transition:all 0.2s;box-shadow:0 4px 10px rgba(220,38,38,.2)">❌ نعم، ألغي</button>
      </div>
    </div>`;
  mBot('تأكيد إلغاء الموعد:', card, []);
};

window.mModifyBooking = function(id) {
  window._cbTargetBookingId = id;
  mUser('✏️ تعديل الموعد');
  const bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
  const updated = bs.map(b => b.id === window._cbTargetBookingId ? { ...b, status: 'cancelled' } : b);
  localStorage.setItem('memar_bookings', JSON.stringify(updated));
  window._cbTargetBookingId = null;
  mTyping();
  setTimeout(() => { mHT(); mShowBook(); }, 600);
};

// ===== Booking Calendar Helpers =====
window._fmtD = function(d){const yr=d.getFullYear(),mo=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0');return yr+'-'+mo+'-'+da;};
window._fmtFull = function(d){const mo=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];return d.getDate()+' '+mo[d.getMonth()]+' '+d.getFullYear();};
window._hr12 = function(hr){return hr===12?'12:00 مساءً':hr>12?String(hr-12).padStart(2,'0')+':00 مساءً':String(hr).padStart(2,'0')+':00 صباحاً';};

// ===== Booking Calendar (Modern Dynamic) =====
window.mShowBook = function() {
  const uid = Date.now() + Math.floor(Math.random() * 1000);
  const card = `<div id="mbook-card-${uid}" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:12px;color:#374151;font-size:11px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <div style="font-weight:800;font-size:12px;color:#1B6CA8;margin-bottom:10px;display:flex;align-items:center;gap:6px">
         <span style="font-size:14px">📅</span> احجز موعد اجتماع
      </div>
      <div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:8px">① طريقة الاجتماع</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px" id="mbtg-cb-${uid}">
          <div class="mbt-cb" data-t="office" data-l="🏢 حضوري في المكتب" style="padding:8px;background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;transition:all .2s;color:#374151">🏢 حضوري</div>
          <div class="mbt-cb" data-t="video" data-l="📹 اجتماع أونلاين" style="padding:8px;background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;transition:all .2s;color:#374151">💻 أونلاين</div>
          <div class="mbt-cb" data-t="voice" data-l="📞 مكالمة صوتية" style="padding:8px;background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;transition:all .2s;color:#374151">📞 صوتي</div>
          <div class="mbt-cb" data-t="whatsapp" data-l="💬 تواصل واتساب" style="padding:8px;background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;transition:all .2s;color:#374151">💬 واتساب</div>
      </div>
      <div id="mwk-cb-${uid}"></div>
      <div id="mhr-cb-${uid}" style="display:none"></div>
      <div id="mcf-cb-${uid}" style="display:none"></div>
    </div>`;
  mBot('يسعدنا تنظيم اجتماع معك:', card, []);

  setTimeout(() => {
    const grid = document.getElementById(`mbtg-cb-${uid}`);
    if(grid) {
      window._cbMT = null;
      grid.querySelectorAll('.mbt-cb').forEach(el=>{
        el.addEventListener('click', ()=>{
          grid.querySelectorAll('.mbt-cb').forEach(b=>{
             b.style.background='#fff';
             b.style.color='#374151';
             b.style.border='1.5px solid #E5E7EB';
          });
          el.style.background='#1B6CA8';
          el.style.color='#fff';
          el.style.border='1.5px solid #1B6CA8';
          window._cbMT=el.dataset.t;
          window._cbMTLabel=el.dataset.l;
          if (document.getElementById(`mcf-cb-${uid}`) && document.getElementById(`mcf-cb-${uid}`).style.display === 'block' && window._cbCurConfirm && window._cbCurConfirm.uid === uid) {
            window._cbConfirmBookUI(uid, window._cbCurConfirm.dateStr, window._cbCurConfirm.dayName, window._cbCurConfirm.hr);
          }
        });
      });
      window._cbRenderWeek(uid, 0);
    }
  }, 200);
};

window._cbRenderWeek = function(uid, wo){
  const now=new Date();
  const minBook=new Date(now.getTime()+60*60*1000);
  const cfg=JSON.parse(localStorage.getItem('memar_office_config')||'{}');
  const allH=new Set(Array.from(typeof MHOL!=='undefined'?MHOL:[]).concat(cfg.holidays||[]));
  const bkd=new Set(JSON.parse(localStorage.getItem('memar_bookings')||'[]').filter(b=>b.status!=='cancelled').map(b=>b.datetime||''));
  const DN={6:'السبت',0:'الأحد',1:'الاثنين',2:'الثلاثاء',3:'الأربعاء',4:'الخميس'};
  
  const dow=now.getDay();const daysSinceSat=(dow-6+7)%7;
  const wS=new Date(now);wS.setDate(now.getDate()-daysSinceSat+wo*7);wS.setHours(0,0,0,0);
  const days=[];for(let i=0;i<6;i++){let d=new Date(wS);d.setDate(wS.getDate()+i);days.push(d);}

  function _dayHours(day){return day.getDay()===4?[11,12]:[11,12,13,14,15,16,17,18,19];}
  function hasAv(day){
    if(allH.has(window._fmtD(day)))return false;
    return _dayHours(day).some(h=>{let t=new Date(day);t.setHours(h,0,0,0);return t>minBook&&!bkd.has(window._fmtD(day)+'T'+String(h).padStart(2,'0'));});
  }
  function isToday(d){return window._fmtD(d)===window._fmtD(now);}
  function isPast(d){return d<new Date(now.getFullYear(),now.getMonth(),now.getDate());}

  const wL=days[0].getDate()+'/'+(days[0].getMonth()+1)+' – '+days[5].getDate()+'/'+(days[5].getMonth()+1);
  let h='<div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:8px">② اختر اليوم المناسب</div>'
   +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
   +`<button style="padding:4px 10px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;font-size:10px;color:#374151;font-weight:700;transition:all .2s" ${wo<=0?'disabled style="opacity:.4;cursor:not-allowed"':'onmouseover="this.style.background=\'#F9FAFB\'" onmouseout="this.style.background=\'#fff\'"'} onclick="window._cbRenderWeek('${uid}', ${wo-1})">◀ السابق</button>`
   +'<span style="font-size:11px;font-weight:800;color:#1B6CA8">'+wL+'</span>'
   +`<button style="padding:4px 10px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;font-size:10px;color:#374151;font-weight:700;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'" onclick="window._cbRenderWeek('${uid}', ${wo+1})">التالي ▶</button>`
   +'</div>'
   +'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:6px">';
  
  days.forEach(d=>{
    const hd=window._fmtD(d);
    const av=hasAv(d),hol=allH.has(hd),past=isPast(d),tod=isToday(d),dis=!av||past;
    const bg=dis?'#F3F4F6':hol?'#FEF3C7':tod?'#EFF6FF':'#fff';
    const br=tod?'#3B82F6':dis?'#E5E7EB':'#E5E7EB';
    const col=dis?'#9CA3AF':tod?'#1D4ED8':'#374151';
    h+=`<div ${dis?'':`onclick="window._cbShowHours('${uid}','${hd}','${DN[d.getDay()]}', this)"`} class="mwk-day" style="padding:6px 2px;background:${bg};border:1px solid ${br};border-radius:8px;text-align:center;cursor:${dis?'not-allowed':'pointer'};transition:all .2s" ${dis?'':`onmouseenter="this.style.border='1px solid #3B82F6'" onmouseleave="if(!this.classList.contains('sel'))this.style.border='1px solid ${br}'"`}>`
     +`<div style="font-size:9px;font-weight:700;color:${col}">${DN[d.getDay()]}</div>`
     +`<div style="font-size:12px;font-weight:800;color:${col};margin:3px 0">${d.getDate()}/${d.getMonth()+1}</div>`
     +`<div style="font-size:8px;color:${hol?'#D97706':dis?'#9CA3AF':'#6B7280'}">${hol?'🎌':past?'—':(d.getDay()===4?'قصير':'')}</div>`
     +'</div>';
  });
  h+='</div>';
  const wkEl = document.getElementById(`mwk-cb-${uid}`);
  if(wkEl) wkEl.innerHTML=h;
  const hrEl=document.getElementById(`mhr-cb-${uid}`);if(hrEl){hrEl.style.display='none';hrEl.innerHTML='';}
  const cfEl=document.getElementById(`mcf-cb-${uid}`);if(cfEl){cfEl.style.display='none';cfEl.innerHTML='';}
}

window._cbShowHours = function(uid, dateStr,dayName,el){
  
  const wkEl = document.getElementById(`mwk-cb-${uid}`);
  if(wkEl) {
    wkEl.querySelectorAll('.mwk-day').forEach(d => {
      d.classList.remove('sel');
      if(!d.style.background.includes('F3F4F6')) d.style.border = '1px solid #E5E7EB';
    });
    if(el) {
       el.classList.add('sel');
       el.style.border = '2px solid #3B82F6';
    }
  }

  const now=new Date();const minBook=new Date(now.getTime()+60*60*1000);
  const cfg=JSON.parse(localStorage.getItem('memar_office_config')||'{}');
  const allH=new Set(Array.from(typeof MHOL!=='undefined'?MHOL:[]).concat(cfg.holidays||[]));
  const bkd=new Set(JSON.parse(localStorage.getItem('memar_bookings')||'[]').filter(b=>b.status!=='cancelled').map(b=>b.datetime||''));
  const isThurs=new Date(dateStr).getDay()===4;
  const HOURS=isThurs?[11,12]:[11,12,13,14,15,16,17,18,19];
  const day=new Date(dateStr);
  const avail=HOURS.filter(hr=>{
    let t=new Date(day);t.setHours(hr,0,0,0);
    return t>minBook&&!bkd.has(dateStr+'T'+String(hr).padStart(2,'0'))&&!allH.has(dateStr);
  });

  let h='<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E5E7EB">'
   +`<div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:8px">③ اختر الوقت — <strong style="color:#111827">${dayName} ${window._fmtFull(day)}</strong></div>`;
  if(!avail.length){
    h+='<div style="text-align:center;padding:10px;color:#6B7280;font-size:10px;background:#F3F4F6;border-radius:10px">لا تتوفر مواعيد في هذا اليوم</div>';
  }else{
    h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
    avail.forEach(hr=>{
      h+=`<div onclick="window._cbConfirmBookUI('${uid}','${dateStr}','${dayName}',${hr})" style="padding:6px 2px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;text-align:center;cursor:pointer;transition:all .2s;color:#374151" onmouseenter="this.style.background='#F9FAFB';this.style.borderColor='#9CA3AF'" onmouseleave="this.style.background='#fff';this.style.borderColor='#E5E7EB'">`
       +`<div style="font-size:11px;font-weight:700">${window._hr12(hr)}</div></div>`;
    });
    h+='</div>';
  }
  h+='</div>';
  const ael=document.getElementById(`mhr-cb-${uid}`);if(ael){ael.style.display='block';ael.innerHTML=h;}
  const cfEl=document.getElementById(`mcf-cb-${uid}`);if(cfEl){cfEl.style.display='none';cfEl.innerHTML='';}
  const chatArea=document.getElementById('m-chat-area');if(chatArea)chatArea.scrollTop=9999;
}

window._cbSetMT = function(uid, type, label) {
  window._cbMT = type;
  window._cbMTLabel = label;
  const grid = document.getElementById(`mbtg-cb-${uid}`);
  if(grid) {
    grid.querySelectorAll('.mbt-cb').forEach(b=>{
       b.style.background='#fff';
       b.style.color='#374151';
       b.style.border='1.5px solid #E5E7EB';
       if(b.dataset.t === type) {
          b.style.background='#1B6CA8';
          b.style.color='#fff';
          b.style.border='1.5px solid #1B6CA8';
       }
    });
  }
  if (document.getElementById(`mcf-cb-${uid}`) && document.getElementById(`mcf-cb-${uid}`).style.display === 'block' && window._cbCurConfirm && window._cbCurConfirm.uid === uid) {
    window._cbConfirmBookUI(uid, window._cbCurConfirm.dateStr, window._cbCurConfirm.dayName, window._cbCurConfirm.hr);
  }
};

window._cbConfirmBookUI = function(uid,dateStr,dayName,hr){
  window._cbCurConfirm = {uid, dateStr, dayName, hr};
  const day=new Date(dateStr);
  const methodHtml = window._cbMTLabel 
      ? `<strong style="color:#111827">${window._cbMTLabel}</strong>`
      : `<strong style="color:#DC2626;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="document.getElementById('m-mtd-drop-${uid}').style.display='grid'">يرجى تحديد الطريقة ▼</strong>`;
      
  let h='<div style="margin-top:12px;padding-top:10px;border-top:1px solid #E5E7EB">'
   +'<div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:12px">'
   +'<div style="font-size:11px;color:#16A34A;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:6px">✅ تأكيد تفاصيل الموعد</div>'
   +'<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:10px;margin-bottom:12px;color:#374151;border-bottom:1px solid #DCFCE7;padding-bottom:10px">'
   +`<span style="color:#6B7280;font-weight:700">📅 اليوم:</span><strong style="color:#111827">${dayName} ${window._fmtFull(day)}</strong>`
   +`<span style="color:#6B7280;font-weight:700">🕐 الساعة:</span><strong style="color:#111827">${window._hr12(hr)}</strong>`
   +`<span style="color:#DC2626;font-weight:800">طريقة الاجتماع:</span>${methodHtml}`
   +(window._cbMTLabel ? '' : `<div id="m-mtd-drop-${uid}" style="display:none;grid-column:1 / -1;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;padding-top:6px;border-top:1px dashed #DCFCE7">
          <div onclick="window._cbSetMT('${uid}','office','🏢 حضوري في المكتب')" style="padding:6px;background:#fff;border:1.5px solid #E5E7EB;border-radius:6px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;color:#374151;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">🏢 حضوري</div>
          <div onclick="window._cbSetMT('${uid}','video','📹 اجتماع أونلاين')" style="padding:6px;background:#fff;border:1.5px solid #E5E7EB;border-radius:6px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;color:#374151;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">💻 أونلاين</div>
          <div onclick="window._cbSetMT('${uid}','voice','📞 مكالمة صوتية')" style="padding:6px;background:#fff;border:1.5px solid #E5E7EB;border-radius:6px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;color:#374151;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">📞 صوتي</div>
          <div onclick="window._cbSetMT('${uid}','whatsapp','💬 تواصل واتساب')" style="padding:6px;background:#fff;border:1.5px solid #E5E7EB;border-radius:6px;cursor:pointer;text-align:center;font-size:10px;font-weight:700;color:#374151;transition:all .2s" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">💬 واتساب</div>
        </div>`)
   +'</div>'
   +`<button id="cbbkbtn-${uid}" style="width:100%;padding:8px;background:${window._cbMT?'#16A34A':'#DC2626'};border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:11px;font-weight:800;font-family:Cairo,sans-serif;box-shadow:0 4px 12px rgba(22,163,74,.25);transition:all .2s">✓ تأكيد وحجز الموعد</button>`
   +'</div></div>';
  const el=document.getElementById(`mcf-cb-${uid}`);if(el){el.style.display='block';el.innerHTML=h;}
  const chatArea=document.getElementById('m-chat-area');if(chatArea)chatArea.scrollTop=9999;
  setTimeout(()=>{
    const btn=document.getElementById(`cbbkbtn-${uid}`);
    if(btn) btn.addEventListener('click', ()=>{
      if(!window._cbMT){
        btn.innerText = '⚠️ يرجى تحديد طريقة الاجتماع من الأعلى أولاً!';
        setTimeout(() => { if(!window._cbMT) btn.innerText = '✓ تأكيد وحجز الموعد'; }, 2000);
        return;
      }
      window._cbExecuteBooking(dayName+' '+window._fmtFull(day), hr, dateStr+'T'+String(hr).padStart(2,'0'));
      el.style.display='none';
    });
  }, 50);
}

window._cbExecuteBooking = function(dayDesc, hr, dt){
  const parts = dt.split('T'), dp = parts[0].split('-');
  let bs = []; try { bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]'); } catch(e) {}
  
  const YY = dp[0].slice(2);
  const MM = dp[1];
  const DD = dp[2];
  const HH = String(parseInt(parts[1])).padStart(2, '0');
  
  const countToday = bs.filter(b => b.datetime && b.datetime.startsWith(parts[0])).length;
  const NN = String(countToday + 1).padStart(2, '0');
  
  const id = 'B' + YY + MM + DD + HH + NN;
  const creationLog = {action: "تم إنشاء الموعد (المساعد الذكي)", user: "العميل عبر الويب", time: new Date().toISOString()};
  
  // Merge memar_user with initial bot inputs (window._mClient)
  const memarUser = JSON.parse(localStorage.getItem('memar_user') || 'null');
  const prevClient = window._mClient || {};
  
  const clientName = (memarUser && memarUser.name) ? memarUser.name : (prevClient.name || 'عميل محتمل');
  const clientPhone = (memarUser && memarUser.phone) ? memarUser.phone : (prevClient.phone || '');
  const clientEmail = (memarUser && memarUser.email) ? memarUser.email : (prevClient.email || '');
  const clientType = (memarUser && memarUser.roles && memarUser.roles.includes('client')) ? 'client' : 'lead';
  const roleStr = memarUser && memarUser.role ? memarUser.role : clientType;

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
              notes: `طلب حجز موعد (${window._cbMTLabel}) بتاريخ ${dayDesc} ${window._hr12(hr)}. رقم الموعد: ${id}`
          });
          localStorage.setItem('memar_crm_leads', JSON.stringify(leads));
      } else {
          let reqs = JSON.parse(localStorage.getItem('memar_requests') || '[]');
          reqs.push({
              id: 'REQ-' + Date.now(),
              clientId: clientInfo.id,
              clientName: clientName,
              type: 'booking',
              title: `حجز موعد ${window._cbMTLabel}`,
              desc: `تم طلب موعد بتاريخ ${dayDesc} الساعة ${window._hr12(hr)}. رقم الموعد: ${id}`,
              status: 'pending',
              date: new Date().toISOString()
          });
          localStorage.setItem('memar_requests', JSON.stringify(reqs));
      }
  } catch(e) { console.warn("Failed to create lead/request", e); }
  mUser('طلب موعد: '+window._cbMTLabel+' – '+dayDesc+' '+window._hr12(hr));
  setTimeout(()=>{
     const latestBs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
     const latestB = latestBs.find(x => x.id === id) || {id, day:dayDesc, hour:window._hr12(hr), typeLabel:window._cbMTLabel, client: clientInfo};
     mBot('✅ تم استلام طلب الموعد بنجاح!\nسيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.\nشكراً لثقتك بمجموعة معمار 🙏', window.mGetBookingCard(latestB), ['تفاصيل الباقات', 'احسب مشروعي']);
  }, 600);
}

// Legacy aliases
window.mDLPDF=window.mGenPDF;
window.mWA=window.mGenWA;

// Legacy aliases
window.mDLPDF=window.mGenPDF;
window.mWA=window.mGenWA;
window.mDLPDF=function(name,phone,qn,price,type,area,svc){const w=window.open('','_blank');w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>عرض سعر ${qn}</title><style>body{font-family:Arial;padding:40px;direction:rtl}.hdr{display:flex;justify-content:space-between;margin-bottom:24px}.co{font-size:20px;font-weight:800;color:#1B6CA8}.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}.tot{background:#1B6CA8;color:#fff;border-radius:8px;padding:16px;text-align:center;margin:16px 0}.tot-n{font-size:26px;font-weight:800}@media print{button{display:none}}</style></head><body><div class="hdr"><div class="co">مجموعة معمار<br><small style="font-size:11px;font-weight:400;color:#888">للاستشارات الهندسية · الكويت</small></div><div style="text-align:left;font-size:12px;color:#888">${qn}<br>${new Date().toLocaleDateString('ar-KW')}<br>صلاحية 30 يوماً</div></div><div class="row"><span>العميل</span><span>${name} ${phone}</span></div><div class="row"><span>نوع المشروع</span><span>${type}</span></div><div class="row"><span>المساحة</span><span>${area} م²</span></div><div class="row"><span>الخدمة</span><span>${svc}</span></div><div class="tot"><div style="font-size:11px;opacity:.8">إجمالي عرض السعر</div><div class="tot-n">${Number(price).toLocaleString('ar-KW')} د.ك</div><div style="font-size:9px;opacity:.7">شامل جميع الرسوم الحكومية</div></div><div class="row"><span>الدفعة الأولى (40%)</span><span>${Math.round(price*.4)} د.ك</span></div><div class="row"><span>الدفعة الثانية (30%)</span><span>${Math.round(price*.3)} د.ك</span></div><div class="row"><span>الدفعة الثالثة (30%)</span><span>${Math.round(price*.3)} د.ك</span></div><div style="margin-top:20px;font-size:10px;color:#888;border:1px solid #eee;border-radius:6px;padding:10px">✅ شامل الرسوم الحكومية · 📞 66227785 · memar.group.kw@gmail.com</div><div style="text-align:center;margin-top:16px"><button onclick="window.print()" style="padding:8px 20px;background:#1B6CA8;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></div></body></html>`);w.document.close();};
window.mWA=function(name,qn,price,type){window.open('https://wa.me/?text='+encodeURIComponent(`عرض سعر من مجموعة معمار\nرقم: ${qn}\nالعميل: ${name}\nالمشروع: ${type}\nالإجمالي: ${Number(price).toLocaleString('ar-KW')} د.ك\nشامل الرسوم · صلاحية 30 يوم\nللتواصل: +96566227785`),'_blank');};


function mOpen(){
  document.getElementById('m-win').classList.add('open');
  document.getElementById('m-fab').style.display='none';
  const a=document.getElementById('m-chat-area');
  if(!a.hasChildNodes()){
     const u=JSON.parse(localStorage.getItem('memar_user')||'null');
     let hist=[];
     if(u) {
       const k='memar_chat_history_'+(u.phone||'def');
       try{hist=JSON.parse(localStorage.getItem(k)||'[]');}catch(e){}
     }
     if(hist.length>0){
       hist.forEach(h=>mRender(h.type,h.html,true));
     }else{
       const custom = JSON.parse(localStorage.getItem('memar_chatbot_qa')||'{}');
       const customKeys = Object.keys(custom).filter(k=>k!=='default').map(k=>k.split(',')[0].trim()).slice(0, 3);
       const qrs = ['احسب مشروعي','الباقات','احجز', ...customKeys];
       mBot('أهلاً بك في موقع مجموعة معمار! 👋\n\nأنا هنا لمساعدتك — يمكنني المساعدة في:\n• معرفة أسعار مشروعك\n• الخدمات والتراخيص\n• حجز استشارة مجانية','',qrs);
     }
  }
}
function mClose(){document.getElementById('m-win').classList.remove('open','big');document.getElementById('m-fab').style.display='flex';mExpanded=false;document.getElementById('m-exp')?.remove();}
function mBig(e){ alert("واجهة المحادثة المستقلة قيد التطوير وسيتم ربطها قريباً!"); }
async function mReply(msg) {
  mTyping();
  
  try {
    const currentKB = getMemarKB();
    
    // Fallback simple detection to skip API if exact command matched
    const type = mDetect(msg);
    if(type === 'pricing') {
       mHT(); mOpenPricing(); return;
    } else if(type === 'meeting') {
       mHT(); if(typeof mCheckBooking === 'function') mCheckBooking(); return;
    }
    
    // Construct Knowledge Base Text (Subset to save tokens)
    let kbText = "";
    const kbKeys = Object.keys(currentKB).filter(k => k !== 'default');
    
    // Optimization: find top matching keys based on words, else send all (since it's small)
    kbKeys.forEach(key => {
        kbText += `Topic/Keywords: ${key}\nAnswer: ${currentKB[key].text}\n\n`;
    });
    
    // Get History
    const u = JSON.parse(localStorage.getItem('memar_user') || 'null');
    const histKey = 'memar_chat_history_' + (u ? (u.phone || 'def') : 'def');
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(histKey) || '[]'); } catch(e){}
    const formattedHist = hist.slice(-10).map(h => ({ 
        role: h.type === 'bot' ? 'assistant' : 'user', 
        content: h.html.replace(/<[^>]*>?/gm, '') 
    }));
    
    const response = await fetch('/api/v1/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           message: msg,
           kbContext: kbText,
           history: formattedHist
        })
    });
    
    mHT();
    if(response.ok) {
        const data = await response.json();
        let replyText = data.reply || '';
        
        // Handle Action Triggers
        if (replyText.includes('[ACTION:PRICING]')) {
            replyText = replyText.replace(/\[ACTION:PRICING\]/g, '').trim();
            if(replyText) mBot(replyText);
            mOpenPricing();
            return;
        }
        if (replyText.includes('[ACTION:MEETING]')) {
            replyText = replyText.replace(/\[ACTION:MEETING\]/g, '').trim();
            if(replyText) mBot(replyText);
            if(typeof mCheckBooking === 'function') mCheckBooking();
            return;
        }
        
        // Log unanswered if AI couldn't find an answer and acts confused
        if (replyText.includes('لا أعرف') || replyText.includes('ليس لدي معلومات')) {
            let unanswered = [];
            try { unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]'); } catch(e){}
            unanswered.push({ text: msg, date: new Date().toISOString(), status: 'pending' });
            localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
        }

        mBot(replyText);
    } else {
        mBot("عذراً، نظام الذكاء الاصطناعي قيد الإعداد حالياً. يرجى الاتصال بنا عبر الهاتف.");
    }
  } catch(err) {
    console.error("OpenAI Chatbot Error:", err);
    mHT();
    mBot("عذراً، واجهت مشكلة في الاتصال بالخادم. حاول مجدداً.");
  }
}
function mSend(){const i=document.getElementById('m-inp'),msg=i.value.trim();if(!msg)return;mUser(msg);i.value='';i.style.height='auto';mReply(msg);}
function mSug(text){mUser(text);mReply(text);}
function mKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();mSend();}}
function mRsz(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,70)+'px';}

// User Menu Auth Check
document.addEventListener('DOMContentLoaded', function() {
  try {
    const user = JSON.parse(localStorage.getItem('memar_user') || 'null');
    if(user && (user.name || user.fullName)) {
      document.getElementById('nav-actions').innerHTML = `
        <a href="#pricing" class="btn btn-outline">عرض سعر فوري</a>
        <div class="user-menu">
           <button class="user-menu-btn">👤 ${user.name || 'صفحتي'} ▼</button>
           <div class="user-menu-content">
             <a href="${user.dest || '../portal/index.html'}">💻 الصفحة الشخصية</a>
             <a href="#" onclick="localStorage.removeItem('memar_user'); if(typeof memar_signOut === 'function') { memar_signOut().then(()=>location.reload()) } else { location.reload() }">🛑 تسجيل خروج</a>
           </div>
        </div>
      `;
    }
  } catch(e) {}
});

// Expose chatbot methods to strictly the window scope for raw HTML onclick events
Object.assign(window, {
  mOpen, mClose, mBig, mReply, mSend, mSug, mKey, mRsz
});

// Close chatbot when clicking outside
document.addEventListener('click', function(e) {
  const win = document.getElementById('m-win');
  const fab = document.getElementById('m-fab');
  if(win && win.classList.contains('open')) {
    if(!win.contains(e.target) && (!fab || !fab.contains(e.target))) {
      mClose();
    }
  }
});

})();
