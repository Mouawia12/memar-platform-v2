import { type CSSProperties, type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { apiErrorMessage } from '../../../lib/api';
import { PasswordStrength } from '../components/PasswordStrength';
import { useResetPassword } from '../hooks/useAuth';

/** صفحة إعادة تعيين كلمة المرور — تُفتح من الرابط المرسل بالبريد (token + email). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reset = useResetPassword();

  const invalidLink = !token || !email;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف وتضمّ حرفًا ورقمًا.');

      return;
    }
    if (password !== confirm) {
      setError('تأكيد كلمة المرور غير مطابق.');

      return;
    }

    reset.mutate(
      { token, email, password, password_confirmation: confirm },
      { onError: (err) => setError(apiErrorMessage(err, 'تعذّر تحديث كلمة المرور.')) },
    );
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ fontSize: '34px' }}>🔐</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1F2E', margin: '8px 0 4px' }}>تعيين كلمة مرور جديدة</h1>
          {email && <p style={{ fontSize: '12.5px', color: '#5A6478', margin: 0, direction: 'ltr' }}>{email}</p>}
        </div>

        {invalidLink ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#DC4A3D', fontSize: '13px' }}>الرابط غير مكتمل أو غير صالح. اطلب رابط استعادة جديدًا من صفحة الدخول.</p>
            <Link to="/login" style={linkBtn}>← العودة لتسجيل الدخول</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={lbl}>كلمة المرور الجديدة</label>
            <input className="input" style={input} type="password" placeholder="8 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordStrength value={password} />

            <label style={{ ...lbl, marginTop: '13px' }}>تأكيد كلمة المرور</label>
            <input className="input" style={input} type="password" placeholder="أعد كتابة كلمة المرور" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

            {error && <p style={{ color: '#DC4A3D', fontSize: '12px', marginTop: '10px', marginBottom: 0 }}>{error}</p>}

            <button type="submit" style={btnPrimary} disabled={reset.isPending}>
              {reset.isPending ? 'جارٍ التحديث…' : 'تحديث كلمة المرور'}
            </button>
            <Link to="/login" style={linkBtn}>← العودة لتسجيل الدخول</Link>
          </form>
        )}
      </div>
    </div>
  );
}

const wrap: CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F0F4F9', padding: '20px', fontFamily: "'Cairo',sans-serif", direction: 'rtl' };
const card: CSSProperties = { width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 12px 40px rgba(0,0,0,.1)' };
const lbl: CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1F2E', marginBottom: '5px' };
const input: CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #E4E8EF', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '13px', color: '#1A1F2E', outline: 'none', background: '#fff' };
const btnPrimary: CSSProperties = { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontFamily: "'Cairo',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: '#1B6CA8', color: '#fff', marginTop: '16px' };
const linkBtn: CSSProperties = { display: 'block', textAlign: 'center', color: '#5A6478', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', marginTop: '14px' };
