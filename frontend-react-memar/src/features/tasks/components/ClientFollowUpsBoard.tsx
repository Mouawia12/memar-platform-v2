import { type CSSProperties, useRef, useState } from 'react';

import { useEdgeAutoScroll } from '../../../hooks/useEdgeAutoScroll';
import { personColor, personInitials, shortName } from '../../crm/types';
import type { FollowUp } from '../api/followUpsApi';
import { FollowUpDetailModal } from './FollowUpDetailModal';

type Col = 'scheduled' | 'today' | 'overdue' | 'done';

const COLUMNS: { key: Col; label: string; icon: string; color: string }[] = [
  { key: 'scheduled', label: 'مجدولة', icon: '🗓️', color: '#1B6CA8' },
  { key: 'today', label: 'اليوم', icon: '📌', color: '#E8A838' },
  { key: 'overdue', label: 'متأخرة', icon: '⚠️', color: '#DC4A3D' },
  { key: 'done', label: 'منجزة', icon: '✅', color: '#2D9B6F' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

/** عمود المتابعة حسب موعدها وحالتها. */
function columnOf(f: FollowUp): Col {
  if (f.done) return 'done';
  const day = f.remind_at?.slice(0, 10);
  if (!day) return 'scheduled';
  if (day < todayStr()) return 'overdue';
  if (day === todayStr()) return 'today';

  return 'scheduled';
}

/**
 * لوحة المتابعة (كانبان) — متابعات العملاء مستقلّة عن المهام، أسفل الصفحة
 * (طلب أيمن 2026-08-24). مصدرها تذكيرات الفرص، والضغط على بطاقة يفتح فرصتها.
 */
export function ClientFollowUpsBoard({ items }: { items: FollowUp[] }) {
  const boardRef = useRef<HTMLDivElement>(null);
  useEdgeAutoScroll(boardRef);
  // النقر على بطاقة المتابعة يفتح تفاصيلها (طلب أيمن 2026-08-25).
  const [detail, setDetail] = useState<FollowUp | null>(null);

  return (
    <div ref={boardRef} className="crm-hscroll" style={board}>
      {COLUMNS.map((col) => {
        const list = items.filter((f) => columnOf(f) === col.key);
        return (
          <div key={col.key} style={column}>
            <div style={{ ...header, borderTop: `3px solid ${col.color}` }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#1A1F2E' }}>{col.icon} {col.label}</span>
              <span style={{ ...count, color: col.color, background: `${col.color}1a` }}>{list.length}</span>
            </div>
            <div style={body}>
              {list.length === 0 && <p style={{ opacity: 0.4, fontSize: '12.5px', textAlign: 'center', padding: '18px 0' }}>لا متابعات</p>}
              {list.map((f) => {
                const c = f.owner ? personColor(f.owner.id) : '#94A3B8';
                return (
                  <div key={f.id} className="crm-lead-card" style={{ ...card, borderRight: `5px solid ${col.color}` }}
                    onClick={() => setDetail(f)} title="فتح تفاصيل المتابعة">
                    <div style={code}>#FUP-{String(f.id).padStart(3, '0')}</div>
                    <div style={title}>{f.contact ?? 'عميل'}</div>
                    <div style={metaRow}>
                      {f.owner && (
                        <span style={ownerRow} title={`المكلّف: ${f.owner.name}`}>
                          <span style={{ ...avatar, background: c }}>{personInitials(f.owner.name)}</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 800, color: c }}>{shortName(f.owner.name)}</span>
                        </span>
                      )}
                      {f.remind_at && <span style={date}>📅 {f.remind_at.slice(0, 10)}</span>}
                    </div>
                    {f.note && <div style={note}>{f.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {detail && <FollowUpDetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// صفّ أفقي واحد بتمرير جانبي — لا التفاف للأعمدة (طلب أيمن 2026-08-24).
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
const column: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#F0F4F8', borderRadius: '10px', padding: '9px', minHeight: '120px', flex: '0 0 300px', width: '300px', minWidth: '300px' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const count: CSSProperties = { fontSize: '11px', fontWeight: 900, borderRadius: '999px', padding: '1px 9px' };
const body: CSSProperties = { display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' };
const card: CSSProperties = { position: 'relative', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px 8px 10px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const code: CSSProperties = { fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '.4px' };
const title: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', marginTop: '1px' };
const metaRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '5px' };
const ownerRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px' };
const avatar: CSSProperties = { width: '18px', height: '18px', borderRadius: '50%', color: '#fff', fontSize: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const date: CSSProperties = { fontSize: '9.5px', color: '#64748B', fontWeight: 700 };
const note: CSSProperties = { fontSize: '10px', color: '#475569', background: '#F1F5F9', borderRadius: '7px', padding: '5px 9px', marginTop: '6px', lineHeight: 1.6 };
