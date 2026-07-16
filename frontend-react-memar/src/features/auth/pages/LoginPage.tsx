import { type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useLogin } from '../hooks/useAuth';

/**
 * صفحة تسجيل الدخول — متصلة بوحدة auth في Laravel عبر useLogin.
 */
export function LoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: '32px', width: '100%', maxWidth: '380px' }}>
        <h1 style={{ marginTop: 0, textAlign: 'center' }}>منصة معمار</h1>
        <p style={{ textAlign: 'center', opacity: 0.6, marginTop: 0 }}>تسجيل الدخول</p>

        <label style={{ display: 'block', marginTop: '16px' }}>
          البريد الإلكتروني
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{ width: '100%', marginTop: '4px' }}
          />
        </label>

        <label style={{ display: 'block', marginTop: '12px' }}>
          كلمة المرور
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ width: '100%', marginTop: '4px' }}
          />
        </label>

        {login.isError && (
          <p style={{ color: 'var(--danger, #ef4444)', marginTop: '12px' }}>
            {apiErrorMessage(login.error, 'فشل تسجيل الدخول')}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={login.isPending} style={{ width: '100%', marginTop: '20px' }}>
          {login.isPending ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
