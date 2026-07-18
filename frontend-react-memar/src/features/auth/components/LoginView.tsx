import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useLogin } from '../hooks/useAuth';

interface Props {
  onClose?: () => void;
}

const FEATURES = [
  { icon: '🧮', t: 'تسعير فوري أونلاين', s: 'احصل على عرض سعرك خلال دقيقة' },
  { icon: '📊', t: 'تابع مشروعك لحظة بلحظة', s: 'Timeline تفاعلي + مستندات + اجتماعات' },
  { icon: '🤖', t: 'ذكاء اصطناعي مدمج', s: 'مساعد ذكي + ملخصات الاجتماعات' },
  { icon: '🔐', t: 'بياناتك آمنة 100%', s: 'بروتوكولات أمان عالمية' },
];

const STATS = [
  { n: '+19', l: 'سنة خبرة' },
  { n: '+500', l: 'مشروع منجز' },
  { n: '87', l: 'عميل نشط' },
];

/** شاشة تسجيل الدخول — تصميم عمودين (لوحة مزايا + نموذج) مطابق للموقع القديم. */
export function LoginView({ onClose }: Props) {
  const login = useLogin();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email: id.trim(), password: pass });
  };
  const fillDemo = () => { setId('admin@memar.local'); setPass('password'); login.mutate({ email: 'admin@memar.local', password: 'password' }); };

  return (
    <div className="memar-login" style={wrap}>
      <style>{scopedCss}</style>

      {/* اللوحة الجانبية (المزايا) */}
      <div className="ml-left" style={leftPanel}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
          <div style={brand}>
            <div style={brandIcon}>م</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>مجموعة معمار</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.65)' }}>منصة الاستشارات الهندسية المتكاملة</div>
            </div>
          </div>
          <h1 style={lpTitle}>منصتك الهندسية <span style={{ color: '#E8A838' }}>الذكية</span> بالكويت</h1>
          <p style={lpSub}>بوابة واحدة تجمع العملاء والمهندسين والإدارة — تصاميم، تراخيص، إشراف، وتقارير — كل شيء أونلاين.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((f) => (
              <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={featIcon}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{f.t}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)' }}>{f.s}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={stats}>
            {STATS.map((s) => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#E8A838' }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* لوحة النموذج */}
      <div style={rightPanel}>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        )}
        <div style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏛️</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1F2E', margin: 0 }}>مرحباً بك في معمار</h2>
            <p style={{ fontSize: '13px', color: '#5A6478', marginTop: '6px' }}>سجّل دخولك للوصول للوحتك المخصصة</p>
          </div>

          <div style={authTabs}>
            <div onClick={() => setTab('login')} style={{ ...authTab, ...(tab === 'login' ? authTabActive : null) }}>تسجيل الدخول</div>
            <div onClick={() => setTab('register')} style={{ ...authTab, ...(tab === 'register' ? authTabActive : null) }}>تسجيل جديد</div>
          </div>

          {login.isError && <div style={errMsg}>{apiErrorMessage(login.error, 'فشل تسجيل الدخول — تحقّق من البيانات')}</div>}

          {tab === 'login' ? (
            <form onSubmit={submit}>
              <div style={{ marginBottom: '13px' }}>
                <label style={lbl}>البريد الإلكتروني أو الهاتف</label>
                <div style={{ position: 'relative' }}>
                  <span style={inputIcon}>📧</span>
                  <input className="ml-input" style={{ ...input, paddingInlineStart: '40px' }} value={id} onChange={(e) => setId(e.target.value)} placeholder="email@example.com | 5XXXXXXXX" autoComplete="username" required />
                </div>
              </div>
              <div style={{ marginBottom: '13px' }}>
                <label style={lbl}>كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <span style={inputIcon}>🔒</span>
                  <input className="ml-input" style={{ ...input, paddingInlineStart: '40px' }} type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
                  <button type="button" onClick={() => setShowPass((s) => !s)} style={pwdToggle}>👁️</button>
                </div>
              </div>
              <div style={formOpts}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> تذكرني</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('لإعادة تعيين كلمة المرور، تواصل مع إدارة النظام.'); }} style={{ color: '#1B6CA8', textDecoration: 'none' }}>نسيت كلمة المرور؟</a>
              </div>
              <button className="ml-btn" type="submit" disabled={login.isPending} style={btnPrimary}>{login.isPending ? 'جارٍ الدخول…' : '🚀 تسجيل الدخول'}</button>

              <div style={divider}><span style={dividerLine} />أو<span style={dividerLine} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button type="button" className="ml-soc" style={socBtn} onClick={() => alert('تسجيل الدخول عبر Google — قريباً.')}>🌐 Google</button>
                <button type="button" className="ml-soc" style={socBtn} onClick={() => alert('تسجيل الدخول عبر واتساب — قريباً.')}>💬 واتساب OTP</button>
              </div>

              <div style={demoBox}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1B6CA8', marginBottom: '8px' }}>🎯 حساب تجريبي للدخول السريع</div>
                <button type="button" className="ml-demo" style={demoBtn} onClick={fillDemo}>
                  <span>👑 مدير النظام</span><span style={dbadge}>admin@memar.local</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: '13px' }}>
                <label style={lbl}>نوع الحساب</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ ...roleCard, ...roleCardSel }}><div style={{ fontSize: '24px', marginBottom: '6px' }}>🏠</div><div style={{ fontSize: '13px', fontWeight: 700 }}>عميل</div><div style={{ fontSize: '10px', opacity: 0.85 }}>متابعة مشاريع</div></div>
                  <div style={roleCard}><div style={{ fontSize: '24px', marginBottom: '6px' }}>🏢</div><div style={{ fontSize: '13px', fontWeight: 700 }}>شركة / مستثمر</div><div style={{ fontSize: '10px', opacity: 0.7 }}>مشاريع متعددة</div></div>
                </div>
              </div>
              <div style={{ marginBottom: '13px' }}><label style={lbl}>الاسم الكامل *</label><input className="ml-input" style={input} placeholder="أدخل اسمك الكريم" /></div>
              <div style={{ marginBottom: '13px' }}><label style={lbl}>رقم الهاتف *</label><input className="ml-input" style={input} placeholder="5XXXXXXXX" dir="ltr" /></div>
              <div style={{ marginBottom: '13px' }}><label style={lbl}>البريد الإلكتروني *</label><input className="ml-input" style={input} type="email" placeholder="email@example.com" dir="ltr" /></div>
              <div style={{ marginBottom: '13px' }}><label style={lbl}>كلمة المرور *</label><input className="ml-input" style={input} type="password" placeholder="8 أحرف على الأقل" /></div>
              <button type="button" style={btnPrimary} onClick={() => alert('التسجيل الذاتي غير مُفعّل حاليًا — تواصل مع إدارة معمار لإنشاء حسابك.')}>إنشاء الحساب</button>
              <p style={{ fontSize: '12px', color: '#5A6478', textAlign: 'center', marginTop: '12px' }}>لديك حساب؟ <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: '#1B6CA8', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>سجّل الدخول</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const scopedCss = `
.memar-login .ml-input:focus{border-color:#1B6CA8 !important}
.memar-login .ml-btn:hover{background:#0D4A7A !important;transform:translateY(-1px);box-shadow:0 4px 14px rgba(27,108,168,.35)}
.memar-login .ml-soc:hover{border-color:#1B6CA8 !important}
.memar-login .ml-demo:hover{border-color:#1B6CA8 !important;background:#F0F6FC !important}
@media(max-width:900px){.memar-login .ml-left{display:none !important}}
`;

const wrap: CSSProperties = { fontFamily: "'Cairo', sans-serif", direction: 'rtl', display: 'flex', width: '100%', height: '100%', minHeight: '100%', background: '#F0F2F5' };
const leftPanel: CSSProperties = { flex: 1, background: 'linear-gradient(160deg,#0D4A7A 0%,#1B6CA8 60%,#1E8BC3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative', overflow: 'hidden' };
const rightPanel: CSSProperties = { width: '520px', maxWidth: '100%', background: '#fff', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 36px', boxShadow: '-4px 0 30px rgba(0,0,0,.08)', overflowY: 'auto', position: 'relative' };
const brand: CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' };
const brandIcon: CSSProperties = { width: '52px', height: '52px', background: 'rgba(255,255,255,.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#fff', border: '1px solid rgba(255,255,255,.2)' };
const lpTitle: CSSProperties = { fontSize: '30px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '16px' };
const lpSub: CSSProperties = { fontSize: '14px', color: 'rgba(255,255,255,.8)', lineHeight: 1.8, marginBottom: '32px' };
const featIcon: CSSProperties = { width: '36px', height: '36px', background: 'rgba(255,255,255,.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 };
const stats: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '32px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,.15)' };
const authTabs: CSSProperties = { display: 'flex', border: '1.5px solid #E4E8EF', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' };
const authTab: CSSProperties = { flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#5A6478', background: '#F0F2F5', transition: 'all .2s' };
const authTabActive: CSSProperties = { background: '#1B6CA8', color: '#fff' };
const lbl: CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1F2E', marginBottom: '5px' };
const input: CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E4E8EF', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '13px', color: '#1A1F2E', outline: 'none', background: '#fff' };
const inputIcon: CSSProperties = { position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#5A6478' };
const pwdToggle: CSSProperties = { position: 'absolute', insetInlineStart: '36px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 };
const formOpts: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '12px' };
const btnPrimary: CSSProperties = { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#1B6CA8', color: '#fff', marginTop: '4px', transition: 'all .22s' };
const divider: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0', color: '#5A6478', fontSize: '12px' };
const dividerLine: CSSProperties = { flex: 1, height: '1px', background: '#E4E8EF' };
const socBtn: CSSProperties = { padding: '10px', border: '1.5px solid #E4E8EF', borderRadius: '8px', background: '#fff', fontFamily: "'Cairo',sans-serif", fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1A1F2E', transition: 'border .2s' };
const demoBox: CSSProperties = { background: '#F8FAFF', border: '1px solid #D0E4F5', borderRadius: '10px', padding: '11px', marginTop: '12px' };
const demoBtn: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid transparent', background: '#fff', fontFamily: "'Cairo',sans-serif", fontSize: '12px', cursor: 'pointer', color: '#1A1F2E', transition: 'all .18s' };
const dbadge: CSSProperties = { fontSize: '10px', background: '#1B6CA8', color: '#fff', padding: '2px 8px', borderRadius: '4px', direction: 'ltr' };
const errMsg: CSSProperties = { background: '#FDE8E8', border: '1px solid #DC4A3D33', color: '#DC4A3D', padding: '9px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' };
const roleCard: CSSProperties = { border: '2px solid #E4E8EF', borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', color: '#1A1F2E' };
const roleCardSel: CSSProperties = { borderColor: '#1B6CA8', background: '#1B6CA8', color: '#fff' };
const closeBtn: CSSProperties = { position: 'absolute', top: '12px', insetInlineStart: '14px', width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#F0F2F5', color: '#5A6478', fontSize: '20px', cursor: 'pointer', lineHeight: 1 };
