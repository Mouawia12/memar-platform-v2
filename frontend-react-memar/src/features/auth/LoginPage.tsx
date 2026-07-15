import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiErrorMessage, apiPost } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import type { AuthUser } from '../../types/api';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

/**
 * صفحة تسجيل الدخول — تتصل بوحدة auth في Laravel (POST /auth/login).
 * زر "دخول تجريبي" مؤقت للتطوير حتى تُبنى وحدة المصادقة.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>('/auth/login', { email, password });
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'فشل تسجيل الدخول — وحدة المصادقة قيد البناء'));
    } finally {
      setLoading(false);
    }
  };

  const devLogin = () => {
    setAuth('dev-token', { id: 0, name: 'مستخدم تجريبي', email: 'dev@memar.local' });
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: '32px', width: '100%', maxWidth: '380px' }}>
        <h1 style={{ marginTop: 0, textAlign: 'center' }}>منصة معمار</h1>
        <p style={{ textAlign: 'center', opacity: 0.6, marginTop: 0 }}>تسجيل الدخول</p>

        <label style={{ display: 'block', marginTop: '16px' }}>
          البريد الإلكتروني
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', marginTop: '4px' }} />
        </label>

        <label style={{ display: 'block', marginTop: '12px' }}>
          كلمة المرور
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', marginTop: '4px' }} />
        </label>

        {error && <p style={{ color: 'var(--danger, #ef4444)', marginTop: '12px' }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
          {loading ? 'جارٍ الدخول…' : 'دخول'}
        </button>

        <button className="btn" type="button" onClick={devLogin} style={{ width: '100%', marginTop: '10px', opacity: 0.7 }}>
          دخول تجريبي (Dev)
        </button>
      </form>
    </div>
  );
}
