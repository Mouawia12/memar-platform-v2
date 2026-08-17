import type { CSSProperties } from 'react';

import type { Followup } from '../types';

interface Props { followup: Followup; onOpen?: (f: Followup) => void }

/** لون شريط الأولوية (يمين الكرت) — طبق أصل .kanban-card-priority. */
const PRIO_BAR: Record<string, string> = { urgent: '#DC4A3D', high: '#E8A838', medium: '#1B6CA8', low: '#2D9B6F' };

/** بطاقة متابعة — طبق أصل opsFollowUpCardHTML ({العميل} — {القناة} + مسؤول + موعد + شريط أولوية + ملاحظة). */
export function FollowupCard({ followup: f, onOpen }: Props) {
  const bar = PRIO_BAR[f.priority] ?? '#1B6CA8';
  const due = f.due_date ? f.due_date.slice(0, 10) : '—';

  return (
    <div className="crm-lead-card" style={card} onClick={() => onOpen?.(f)}>
      <span style={{ ...prio, background: bar }} />
      <div style={cardId}>#{f.code}</div>
      <div style={cardTitle}>{f.client_name} — {f.channel}</div>
      <div style={cardMeta}>
        <span>👤 {f.assignee?.name ?? '—'}</span>
        <span>📅 {due}</span>
      </div>
      {f.notes && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
          <span style={ktag}>{f.notes.slice(0, 28)}{f.notes.length > 28 ? '…' : ''}</span>
        </div>
      )}
    </div>
  );
}

// ── أنماط طبق أصل CSS المرجع (.kanban-card…) ──
const card: CSSProperties = { position: 'relative', background: '#fff', borderRadius: '10px', padding: '12px', paddingInlineStart: '14px', border: '1px solid #E2E8F0', marginBottom: '9px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(27,108,168,.05)' };
const prio: CSSProperties = { position: 'absolute', top: 0, insetInlineStart: 0, width: '4px', height: '100%', borderStartStartRadius: '10px', borderEndStartRadius: '10px' };
const cardId: CSSProperties = { fontSize: '10px', color: '#64748B', fontWeight: 600 };
const cardTitle: CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#1E293B', margin: '4px 0 8px', lineHeight: 1.4 };
const cardMeta: CSSProperties = { display: 'flex', gap: '8px', fontSize: '10px', color: '#64748B', flexWrap: 'wrap' };
const ktag: CSSProperties = { fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, background: '#EDE9FE', color: '#7C3AED' };
