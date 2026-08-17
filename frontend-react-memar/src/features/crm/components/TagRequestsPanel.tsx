import { type CSSProperties } from 'react';

import { useApproveCrmTag, useCrmTags, useDeleteCrmTag, useRejectCrmTag } from '../hooks/useCrm';

/** نافذة إدارة طلبات الاختصارات (الإدارة) — طبق أصل opsTagRequestsPanel في V42. */
export function TagRequestsPanel({ onClose }: { onClose: () => void }) {
  const { data: tags } = useCrmTags();
  const approve = useApproveCrmTag();
  const reject = useRejectCrmTag();
  const del = useDeleteCrmTag();
  const list = tags ?? [];

  const badge: Record<string, CSSProperties> = {
    pending: { background: '#FFFBEB', color: '#B45309' },
    approved: { background: '#ECFDF5', color: '#059669' },
    rejected: { background: '#FEF2F2', color: '#DC2626' },
  };
  const label: Record<string, string> = { pending: 'بانتظار الاعتماد', approved: 'معتمد', rejected: 'مرفوض' };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={head}>
          <b style={{ fontSize: '16px' }}>📨 طلبات الاختصارات من الموظفين</b>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>
        <div style={note}>الاختصار المضاف من الموظف يُسجَّل باسمه ويُرسل كطلب — ولا يظهر على السيستم إلا بعد اعتماد الإدارة.</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                {['الاختصار', 'مقدّم الطلب', 'التاريخ', 'الحالة', 'الإجراء'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#94A3B8' }}>لا توجد طلبات اختصارات.</td></tr>}
              {list.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...td, fontWeight: 800 }}>{r.name}</td>
                  <td style={td}>{r.requested_by ?? '—'}</td>
                  <td style={{ ...td, color: '#64748B' }}>{r.created_at ?? '—'}</td>
                  <td style={td}><span style={{ ...pill, ...badge[r.status] }}>{label[r.status]}</span></td>
                  <td style={td}>
                    {r.status === 'pending' ? (
                      <span style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => approve.mutate(r.id)}>اعتماد</button>
                        <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={() => reject.mutate(r.id)}>رفض</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{r.decided_by ?? '—'} · {r.decided_at ?? '—'}</span>
                        <button type="button" className="crm-btn crm-btn-danger crm-btn-sm" onClick={() => del.mutate(r.id)}>حذف</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" className="crm-btn crm-btn-primary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'grid', placeItems: 'center', zIndex: 90, padding: '24px' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '86vh', overflow: 'auto', padding: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: 0 };
const note: CSSProperties = { fontSize: '12px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '9px 12px', lineHeight: 1.6, marginBottom: '14px' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' };
const th: CSSProperties = { textAlign: 'start', padding: '10px', fontSize: '12px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '11px 10px', color: '#1E293B', whiteSpace: 'nowrap' };
const pill: CSSProperties = { padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 };
