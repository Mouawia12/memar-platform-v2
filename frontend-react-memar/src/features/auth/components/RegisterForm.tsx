import { type CSSProperties, useMemo, useState } from 'react';

import { PasswordStrength } from './PasswordStrength';

type AccountType = 'client' | 'company';

const REP_ROLES = [
  { value: 'owner', label: 'مالك' },
  { value: 'ceo', label: 'مدير تنفيذي' },
  { value: 'engineer', label: 'مهندس' },
  { value: 'secretary', label: 'سكرتير' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'employee', label: 'موظف' },
  { value: 'partner', label: 'شريك' },
  { value: 'other', label: 'أخرى...' },
];

/** اقتراحات محلية لأسماء الشركات (بلا خدمة خارجية). */
const COMPANY_SUGGESTIONS = [
  'شركة الخليج للمقاولات',
  'مجموعة الديار العقارية',
  'شركة الكويت للاستثمار العقاري',
  'مجموعة الصفاة العقارية',
  'شركة المباني للتطوير',
  'شركة الأولى للمقاولات',
  'مجموعة العقيلة الهندسية',
];

/** نموذج التسجيل — عميل فرد أو شركة، بحقول مختلفة لكل نوع (مطابق للأصل). */
export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [type, setType] = useState<AccountType>('client');
  const [password, setPassword] = useState('');
  const [repRole, setRepRole] = useState('owner');
  const [customRole, setCustomRole] = useState('');
  const [company, setCompany] = useState('');
  const [companyTouched, setCompanyTouched] = useState(false);

  const suggestions = useMemo(() => {
    const q = company.trim();
    if (!q || !companyTouched) return [];
    return COMPANY_SUGGESTIONS.filter((c) => c.includes(q)).slice(0, 5);
  }, [company, companyTouched]);

  const notAvailable = () => alert('التسجيل الذاتي غير مُفعّل حاليًا — تواصل مع إدارة معمار لإنشاء حسابك.');

  return (
    <div>
      {/* نوع الحساب */}
      <div style={{ marginTop: '10px' }}>
        <label style={lbl}>نوع الحساب</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <RoleCard icon="🏠" name="عميل" sub="متابعة مشاريع" active={type === 'client'} onClick={() => setType('client')} />
          <RoleCard icon="🏢" name="شركة / مستثمر" sub="مشاريع متعددة" active={type === 'company'} onClick={() => setType('company')} />
        </div>
      </div>

      {type === 'client' ? (
        <>
          <Field label="الاسم الكامل *"><input className="ml-input" style={input} placeholder="أدخل اسمك الكريم" /></Field>
          <Field label="رقم الهاتف *"><input className="ml-input" style={input} placeholder="5XXXXXXXX" dir="ltr" /></Field>
          <Field label="البريد الإلكتروني *"><input className="ml-input" style={input} type="email" placeholder="email@example.com" dir="ltr" /></Field>
          <Field label="كلمة المرور *">
            <input className="ml-input" style={input} type="password" placeholder="8 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordStrength value={password} />
          </Field>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Field label="اسم الممثل *" style={{ flex: 1 }}><input className="ml-input" style={input} placeholder="الاسم الكامل" /></Field>
            <Field label="الدور الوظيفي *" style={{ flex: 1 }}>
              {repRole === 'other' ? (
                <div style={{ position: 'relative' }}>
                  <input className="ml-input" style={{ ...input, paddingInlineStart: '62px' }} placeholder="اكتب مسماك الوظيفي..." value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
                  <button type="button" onClick={() => { setRepRole('owner'); setCustomRole(''); }} style={backRole}>↩ رجوع</button>
                </div>
              ) : (
                <select className="ml-input" style={input} value={repRole} onChange={(e) => setRepRole(e.target.value)}>
                  {REP_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              )}
            </Field>
          </div>

          <Field label="اسم الشركة *">
            <div style={{ position: 'relative' }}>
              <input
                className="ml-input" style={input} placeholder="ابدأ بكتابة اسم الشركة..." autoComplete="off"
                value={company}
                onChange={(e) => { setCompany(e.target.value); setCompanyTouched(true); }}
              />
              {suggestions.length > 0 && (
                <div style={suggestBox}>
                  {suggestions.map((s) => (
                    <div key={s} style={suggestItem} onClick={() => { setCompany(s); setCompanyTouched(false); }}>
                      <span style={{ fontSize: '16px' }}>🏢</span>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="رقم التواصل *"><input className="ml-input" style={input} placeholder="5XXXXXXXX" dir="ltr" /></Field>
          <Field label="البريد الإلكتروني *"><input className="ml-input" style={input} type="email" placeholder="email@company.com" dir="ltr" /></Field>
          <Field label="كلمة المرور *">
            <input className="ml-input" style={input} type="password" placeholder="8 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordStrength value={password} />
          </Field>
        </>
      )}

      <button type="button" style={btnPrimary} onClick={notAvailable}>إنشاء الحساب ←</button>

      <p style={{ fontSize: '12px', color: '#5A6478', textAlign: 'center', marginTop: '12px' }}>
        لديك حساب؟{' '}
        <button type="button" onClick={onSwitchToLogin} style={linkBtn}>سجّل الدخول</button>
      </p>
    </div>
  );
}

function RoleCard({ icon, name, sub, active, onClick }: { icon: string; name: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ ...roleCard, ...(active ? roleCardSel : null) }}>
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: 700 }}>{name}</div>
      <div style={{ fontSize: '10px', opacity: active ? 0.85 : 0.7 }}>{sub}</div>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ marginTop: '13px', ...style }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

const lbl: CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1F2E', marginBottom: '5px' };
const input: CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E4E8EF', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '13px', color: '#1A1F2E', outline: 'none', background: '#fff' };
const btnPrimary: CSSProperties = { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#1B6CA8', color: '#fff', marginTop: '16px' };
const roleCard: CSSProperties = { border: '2px solid #E4E8EF', borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', color: '#1A1F2E', transition: 'all .2s' };
const roleCardSel: CSSProperties = { borderColor: '#1B6CA8', background: '#1B6CA8', color: '#fff' };
const backRole: CSSProperties = { position: 'absolute', insetInlineStart: '10px', top: '50%', transform: 'translateY(-50%)', background: '#F0F2F5', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#5A6478', fontFamily: 'inherit', padding: '3px 7px', borderRadius: '4px' };
const suggestBox: CSSProperties = { position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, background: '#fff', border: '1.5px solid #1B6CA8', borderTop: 'none', borderRadius: '0 0 8px 8px', zIndex: 200, boxShadow: '0 6px 20px rgba(0,0,0,.12)', maxHeight: '210px', overflowY: 'auto' };
const suggestItem: CSSProperties = { padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #E4E8EF' };
const linkBtn: CSSProperties = { background: 'none', border: 'none', color: '#1B6CA8', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
