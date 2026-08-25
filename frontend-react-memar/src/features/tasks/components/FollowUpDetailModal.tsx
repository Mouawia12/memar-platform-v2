import { type CSSProperties, type ReactNode, useState } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import type { FollowUp } from '../api/followUpsApi';
import { useDeleteFollowUp, useUpdateFollowUp } from '../hooks/useFollowUps';

interface Props {
  item: FollowUp;
  onClose: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/** عمود المتابعة الحالي من موعدها وحالتها. */
function currentStage(f: FollowUp): string {
  if (f.done) return 'منجزة';
  const day = f.remind_at?.slice(0, 10);
  if (!day) return 'مجدولة';
  if (day < todayStr()) return 'متأخرة';
  if (day === todayStr()) return 'اليوم';

  return 'مجدولة';
}

/** خيارات النقل — الأعمدة مشتقّة من الموعد والحالة، فالنقل يضبطهما. */
const MOVES: { key: string; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'مجدولة — بعد أسبوع' },
  { key: 'done', label: 'منجزة' },
  { key: 'reopen', label: 'إعادة فتح' },
];

/**
 * تفاصيل المتابعة (طلب أيمن 2026-08-25) — تُفتح بالنقر على بطاقة المتابعة:
 * بياناتها للقراءة، ونقلها بين أعمدة اللوحة، وحذفها.
 */
export function FollowUpDetailModal({ item, onClose }: Props) {
  const update = useUpdateFollowUp();
  const del = useDeleteFollowUp();
  const [move, setMove] = useState('');
  const color = item.owner ? personColor(item.owner.id) : '#94A3B8';

  const applyMove = (key: string) => {
    setMove(key);
    if (key === 'done') update.mutate({ id: item.id, done: true }, { onSuccess: onClose });
    else if (key === 'reopen') update.mutate({ id: item.id, done: false }, { onSuccess: onClose });
    else if (key === 'today') update.mutate({ id: item.id, done: false, remind_at: `${todayStr()} 10:00:00` }, { onSuccess: onClose });
    else if (key === 'week') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      update.mutate({ id: item.id, done: false, remind_at: `${d.toISOString().slice(0, 10)} 10:00:00` }, { onSuccess: onClose });
    }
  };

  const remove = () => {
    if (!confirm(`حذف متابعة «${item.contact ?? 'العميل'}»؟`)) return;
    del.mutate(item.id, { onSuccess: onClose });
  };

  return (
    <div className="crm-scope" style={overlay} onClick={onClose}>
      <div className="crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span style={title}>🔄 تفاصيل المتابعة — #FUP-{String(item.id).padStart(3, '0')}</span>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={body}>
          <div style={grid}>
            <Row label="العميل" value={item.contact ?? '—'} />
            <Row label="تاريخ المتابعة" value={item.remind_at?.slice(0, 10) ?? '—'} />
            <Row label="المسؤول" value={item.owner ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ ...avatar, background: color }}>{personInitials(item.owner.name)}</span>
                {shortName(item.owner.name)}
              </span>
            ) : '—'} />
            <Row label="المرحلة الحالية" value={currentStage(item)} />
            {item.creator && <Row label="سجّلها" value={shortName(item.creator)} />}
          </div>

          <Row label="ملاحظات" value={item.note?.trim() || 'لا ملاحظات'} wide />

          <div style={{ marginTop: '12px' }}>
            <div style={moveLabel}>نقل إلى مرحلة أخرى</div>
            <select className="input" value={move} onChange={(e) => applyMove(e.target.value)} disabled={update.isPending}>
              <option value="">{currentStage(item)}</option>
              {MOVES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div style={footer}>
          <button type="button" className="btn" onClick={remove} disabled={del.isPending} style={{ color: '#DC2626' }}>🗑️ حذف</button>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-primary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div style={{ ...cell, ...(wide ? { gridColumn: '1 / -1', marginTop: '10px' } : null) }}>
      <div style={cellLabel}>{label}</div>
      <div style={cellValue}>{value}</div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,20,40,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '46px', zIndex: 1000000, overflowY: 'auto' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(10,20,40,.3)', width: '540px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', marginBottom: '40px' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #EEF2F7', background: 'linear-gradient(135deg,#fff 0%,#EBF5FF 100%)', borderRadius: '16px 16px 0 0' };
const title: CSSProperties = { fontSize: '15px', fontWeight: 800, color: '#1E293B' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: 0 };
const body: CSSProperties = { padding: '16px 20px', overflowY: 'auto' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' };
const cell: CSSProperties = { background: '#F8FAFC', borderRadius: '10px', padding: '10px 13px', minWidth: 0 };
const cellLabel: CSSProperties = { fontSize: '10.5px', color: '#94A3B8', marginBottom: '4px' };
const cellValue: CSSProperties = { fontSize: '13px', fontWeight: 800, color: '#1E293B', lineHeight: 1.6 };
const avatar: CSSProperties = { width: '22px', height: '22px', borderRadius: '50%', color: '#fff', fontSize: '8.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const moveLabel: CSSProperties = { fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '6px' };
const footer: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 20px', borderTop: '1px solid #EEF2F7', background: '#F8FAFC', borderRadius: '0 0 16px 16px' };
