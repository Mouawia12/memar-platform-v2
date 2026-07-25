import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useForgotPassword } from '../hooks/useAuth';

/** طلب رابط استعادة كلمة المرور بالبريد. */
export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const forgot = useForgotPassword();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    forgot.mutate(email.trim());
  };

  if (forgot.isSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: '34px', marginBottom: '10px' }}>📮</div>
        <p style={{ fontSize: '14px', color: '#1A1F2E', fontWeight: 700, margin: 0 }}>تحقّق من بريدك</p>
        <p style={{ fontSize: '12.5px', color: '#5A6478', marginTop: '8px', lineHeight: 1.8 }}>
          إن كان البريد مسجّلًا لدينا، أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور. الرابط صالح لمدة محدودة.
        </p>
        <button type="button" onClick={onBack} style={link}>← العودة لتسجيل الدخول</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p style={{ fontSize: '13px', color: '#5A6478', marginTop: 0, marginBottom: '14px', lineHeight: 1.8 }}>
        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
      </p>
      <label style={lbl}>البريد الإلكتروني</label>
      <input
        className="ml-input" style={input} type="email" dir="ltr" placeholder="email@example.com"
        value={email} onChange={(e) => setEmail(e.target.value)} required
      />

      {forgot.isError && <p style={{ color: '#DC4A3D', fontSize: '12px', marginTop: '10px', marginBottom: 0 }}>{apiErrorMessage(forgot.error, 'تعذّر إرسال الرابط.')}</p>}

      <button type="submit" style={btnPrimary} disabled={forgot.isPending}>
        {forgot.isPending ? 'جارٍ الإرسال…' : 'إرسال رابط الاستعادة'}
      </button>
      <button type="button" onClick={onBack} style={link}>← العودة لتسجيل الدخول</button>
    </form>
  );
}

const lbl: CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1F2E', marginBottom: '5px' };
const input: CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #E4E8EF', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '13px', color: '#1A1F2E', outline: 'none', background: '#fff' };
const btnPrimary: CSSProperties = { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#1B6CA8', color: '#fff', marginTop: '16px' };
const link: CSSProperties = { display: 'block', width: '100%', background: 'none', border: 'none', color: '#5A6478', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '12px', textAlign: 'center' };
