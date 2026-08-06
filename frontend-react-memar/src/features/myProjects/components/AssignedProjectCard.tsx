import { type CSSProperties } from 'react';

import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from '../../projects/types';
import type { MyProjectCard } from '../api/myProjectsApi';

/** وقت نسبي بالعربية (الآن/قبل N دقيقة/ساعة/يوم/شهر). */
export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'الآن';
  const m = Math.round(s / 60);
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.round(h / 24);
  if (d < 30) return `قبل ${d} يوم`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `قبل ${mo} شهر`;
  return `قبل ${Math.round(mo / 12)} سنة`;
}

/**
 * بطاقة مشروع مُسنَد — تُميّز «الجديد» بلمسة ذهبية وشارة، وتعرض التقدّم والمرحلة
 * الحالية وآخر نشاط وآخر دخول. تُستخدم في «مشاريعي» وفي توسّع الأدمن.
 */
export function AssignedProjectCard({ card, onOpen, seenLabel }: {
  card: MyProjectCard;
  onOpen: (id: number) => void;
  /** تسمية آخر الدخول (نظرة الأدمن: «آخر دخول الموظف»؛ الموظف: «آخر زيارة لك»). */
  seenLabel?: string;
}) {
  const statusColor = PROJECT_STATUS_COLORS[card.status as ProjectStatus] ?? '#5A6478';

  return (
    <button
      type="button"
      onClick={() => onOpen(card.id)}
      style={{ ...root, borderInlineStartColor: card.has_new ? '#E8A838' : '#E7ECF3', boxShadow: card.has_new ? '0 4px 16px rgba(232,168,56,.16)' : '0 2px 10px rgba(39,74,120,.06)' }}
    >
      <div style={topRow}>
        <span style={{ ...statusBadge, color: statusColor, background: `${statusColor}14` }}>
          <i style={{ width: 6, height: 6, borderRadius: 999, background: statusColor, display: 'inline-block' }} /> {PROJECT_STATUS_LABELS[card.status as ProjectStatus] ?? card.status}
        </span>
        {card.has_new && <span style={newPill}><i className="fas fa-bolt" /> جديد</span>}
      </div>

      <h3 style={name}>{card.name}</h3>
      <div style={metaRow}>
        {card.code && <span style={metaChip}>#{card.code}</span>}
        {card.client && <span style={metaChip}><i className="fas fa-building-columns" /> {card.client}</span>}
        {card.role_on_project && <span style={{ ...metaChip, color: '#7C3AED', background: '#F3EEFF', borderColor: 'rgba(124,58,237,.15)' }}><i className="fas fa-user-tag" /> {card.role_on_project}</span>}
      </div>

      {/* التقدّم */}
      <div style={{ marginTop: '12px' }}>
        <div style={progressHead}>
          <span>{card.current_stage ? <><i className="fas fa-compass" style={{ color: '#1B6CA8' }} /> {card.current_stage}</> : 'لا مرحلة جارية'}</span>
          <b style={{ color: '#1B6CA8' }}>{card.progress}%</b>
        </div>
        <div style={track}><div style={{ ...fill, width: `${card.progress}%` }} /></div>
        {card.stages_total != null && <div style={{ fontSize: '10.5px', color: '#8A93A3', marginTop: '4px' }}>{card.stages_done}/{card.stages_total} مرحلة مكتملة</div>}
      </div>

      {/* التذييل: آخر نشاط + آخر دخول */}
      <div style={footer}>
        <span style={{ color: card.has_new ? '#B87514' : '#8A93A3', fontWeight: card.has_new ? 700 : 500 }}>
          <i className="fas fa-clock-rotate-left" /> آخر نشاط: {card.last_activity_at ? timeAgo(card.last_activity_at) : '—'}
        </span>
        <span style={{ color: '#8A93A3' }}>
          <i className="fas fa-eye" /> {seenLabel ?? 'آخر زيارة لك'}: {card.last_seen_at ? timeAgo(card.last_seen_at) : 'لم تُفتح بعد'}
        </span>
      </div>
    </button>
  );
}

const root: CSSProperties = { display: 'block', textAlign: 'right', width: '100%', cursor: 'pointer', background: '#fff', border: '1px solid #E7ECF3', borderInlineStartWidth: '4px', borderRadius: '14px', padding: '16px 18px', fontFamily: 'inherit', transition: 'transform .15s ease, box-shadow .15s ease' };
const topRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' };
const statusBadge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' };
const newPill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#E8A838,#D4881F)', padding: '3px 10px', borderRadius: '999px', boxShadow: '0 2px 6px rgba(232,168,56,.35)' };
const name: CSSProperties = { margin: '12px 0 0', fontSize: '15.5px', fontWeight: 800, color: '#0F2E4D', lineHeight: 1.4 };
const metaRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' };
const metaChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '3px 10px' };
const progressHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '6px' };
const track: CSSProperties = { height: '7px', background: '#EEF2F7', borderRadius: '999px', overflow: 'hidden' };
const fill: CSSProperties = { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#34D399,#059669)', transition: 'width .4s ease' };
const footer: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', fontSize: '11px' };
