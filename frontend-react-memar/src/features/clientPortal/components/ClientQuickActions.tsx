import { useState, type CSSProperties } from 'react';

import type { ClientRequestType } from '../api/clientPortalApi';
import { useSubmitClientRequest } from '../hooks/useClientPortal';

/**
 * أزرار طلب سريعة للعميل (CLIENT-2): طلب مشروع / حجز اجتماع.
 * variant='primary' لحالة فارغة بارزة، 'inline' لصفٍّ خفيف في الترويسة.
 */
export function ClientQuickActions({ variant = 'inline' }: { variant?: 'inline' | 'primary' }) {
  const submit = useSubmitClientRequest();
  const [done, setDone] = useState<string | null>(null);

  const send = (type: ClientRequestType, label: string) => {
    submit.mutate({ type }, { onSuccess: () => { setDone(`✓ تم إرسال ${label} — سنتواصل معك قريبًا.`); setTimeout(() => setDone(null), 4000); } });
  };

  const primary = variant === 'primary';

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" disabled={submit.isPending} onClick={() => send('project', 'طلب المشروع')} style={{ ...btn, ...(primary ? btnPrimary : btnGhost) }}>
          ➕ اطلب مشروعاً جديداً
        </button>
        <button type="button" disabled={submit.isPending} onClick={() => send('meeting', 'طلب الاجتماع')} style={{ ...btn, ...btnGhost }}>
          📅 اطلب اجتماعاً
        </button>
      </div>
      {done && <div style={{ marginTop: '10px', color: '#059669', fontSize: '13px', fontWeight: 700 }}>{done}</div>}
      {submit.isError && <div style={{ marginTop: '10px', color: '#DC2626', fontSize: '12.5px' }}>تعذّر إرسال الطلب، حاول مرة أخرى.</div>}
    </div>
  );
}

const btn: CSSProperties = { border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700 };
const btnPrimary: CSSProperties = { background: 'linear-gradient(135deg,#274A78,#1B6CA8)', color: '#fff', boxShadow: '0 3px 10px rgba(39,74,120,.28)' };
const btnGhost: CSSProperties = { background: '#EEF2F7', color: '#274A78' };
