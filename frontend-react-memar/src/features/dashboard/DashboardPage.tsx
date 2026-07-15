import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api';

interface HealthData {
  service: string;
  version: string;
  time: string;
}

/**
 * لوحة التحكم — حاليًا تثبت اتصال الواجهة بالـLaravel API (نقطة /health).
 * تُستبدل لاحقًا بمؤشرات ERP الحقيقية.
 */
export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<HealthData>('/health'),
  });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>لوحة التحكم</h1>

      <div className="card" style={{ padding: '20px', maxWidth: '520px' }}>
        <h3 style={{ marginTop: 0 }}>حالة الاتصال بالخادم (API)</h3>
        {isLoading && <p>جارٍ الفحص…</p>}
        {isError && <p style={{ color: 'var(--danger, #ef4444)' }}>⛔ تعذّر الاتصال بالـAPI — تأكد أن الباك اند يعمل على المنفذ 8010.</p>}
        {data && (
          <ul style={{ lineHeight: 2, margin: 0 }}>
            <li>✅ الخدمة: <b>{data.service}</b></li>
            <li>الإصدار: <b>{data.version}</b></li>
            <li>وقت الخادم: <b>{new Date(data.time).toLocaleString('ar')}</b></li>
          </ul>
        )}
      </div>
    </div>
  );
}
