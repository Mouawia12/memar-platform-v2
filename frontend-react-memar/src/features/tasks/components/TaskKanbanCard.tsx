import { type CSSProperties } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import { PRIORITY_COLORS, dueDiffDays, isDone, type Task } from '../types';

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  /** صورة المكلّف (data URI) — إن غابت تُعرض أحرف اسمه بلونه. */
  avatarUrl?: string | null;
  /** أُطفئ تنبيه تأخّرها فتوقّف وميضها. */
  acked?: boolean;
  /** إطفاء تنبيه التأخّر (زرّ الجرس على البطاقة). */
  onAck?: (t: Task) => void;
}

/**
 * بطاقة مهمة بشكل كروت الفرص في CRM (طلب أيمن 2026-08-24): شريط لون جانبي
 * حسب الأولوية، صورة المكلّف أو أحرفه بلونه الثابت، وسطر موعد بلون قربه،
 * وشريط تقدّم. المحتوى محتوى المهمة — الشكل فقط هو المشترك.
 */
export function TaskKanbanCard({ task, onOpen, avatarUrl, acked, onAck }: Props) {
  const color = PRIORITY_COLORS[task.priority] ?? '#1B6CA8';
  const done = isDone(task);
  const diff = dueDiffDays(task.due_date);
  const assigneeColor = task.assignee ? personColor(task.assignee.id) : '#94A3B8';
  // المهمة المتأخّرة تومض كتنبيه حتى تُعالَج (طلب أيمن 2026-08-24).
  const overdue = !done && diff !== null && diff < 0 && !acked;
  // المهمة المكتملة تُعرض 100% مهما كانت النسبة المسجّلة.
  const pct = done ? 100 : Math.max(0, Math.min(100, task.progress ?? 0));

  const due = task.due_date
    ? {
      label: diff === null ? '' : diff < 0 ? `متأخرة ${Math.abs(diff)} يوم` : diff === 0 ? 'اليوم' : `بعد ${diff} يوم`,
      tone: diff === null ? '#64748B' : diff < 0 ? '#DC4A3D' : diff === 0 ? '#E8A838' : '#2D9B6F',
    }
    : null;

  return (
    <div
      className={`crm-lead-card${overdue ? ' task-card-late' : ''}`}
      onClick={() => onOpen(task)}
      style={{ ...card, borderRight: `5px solid ${done ? '#2D9B6F' : color}` }}
    >
      <div style={topRow}>
        {task.assignee && (
          avatarUrl
            ? <img src={avatarUrl} alt={task.assignee.name} title={`المكلّف: ${task.assignee.name}`}
                style={{ ...avatar, objectFit: 'cover', border: `1.5px solid ${assigneeColor}` }} />
            : <span title={`المكلّف: ${task.assignee.name}`} style={{ ...avatar, background: assigneeColor }}>
                {personInitials(task.assignee.name)}
              </span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={code}>#TSK-{String(task.id).padStart(3, '0')}</div>
          <div style={{ ...title, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.62 : 1 }}>{task.title}</div>
        </div>
      </div>

      <div style={metaRow}>
        {task.assignee && <span style={{ ...meta, color: assigneeColor, fontWeight: 800 }}>{shortName(task.assignee.name)}</span>}
        {due && <span style={{ ...meta, color: due.tone, fontWeight: 800 }}>📅 {task.due_date?.slice(0, 10)} · {due.label}</span>}
      </div>

      {task.project && <div style={projectLine} title={task.project.name}>🏗️ {task.project.name}</div>}

      {/* شريط نسبة الإنجاز (طلب أيمن 2026-08-24) — النسبة على يمينه. */}
      <div style={progressRow}>
        <span style={progressPct}>{pct}%</span>
        <span style={progressTrack}>
          <span style={{ ...progressFill, width: `${pct}%`, background: done ? '#2D9B6F' : '#1B6CA8' }} />
        </span>
      </div>

      <div style={foot}>
        {/* إطفاء وميض التأخّر بزرّ مستقلّ — لا بفتح المهمة (طلب أيمن 2026-08-25). */}
        {overdue && onAck && (
          <button
            type="button"
            title="إخفاء تنبيه التأخّر — تبقى المهمة متأخّرة"
            aria-label="إخفاء تنبيه التأخّر"
            onClick={(e) => { e.stopPropagation(); onAck(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={ackBtn}
          >🔕</button>
        )}
        <span style={{ ...chip, background: `${color}1a`, color }}>{PRIORITY_LABELS[task.priority]}</span>
        {(task.comments_count ?? 0) > 0 && <span style={{ ...chip, background: '#F1F5F9', color: '#5A6478' }}>💬 {task.comments_count}</span>}
        {task.has_unread && <span style={{ ...chip, background: '#FEF2F2', color: '#DC4A3D' }}>● جديد</span>}
      </div>
    </div>
  );
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: 'عاجلة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
};

const card: CSSProperties = { position: 'relative', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px 8px 10px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all .2s ease' };
const topRow: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'flex-start' };
const avatar: CSSProperties = { width: '26px', height: '26px', borderRadius: '50%', color: '#fff', fontSize: '9.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const code: CSSProperties = { fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '.4px' };
const title: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', lineHeight: 1.5, marginTop: '1px' };
const metaRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' };
const meta: CSSProperties = { fontSize: '9.5px', whiteSpace: 'nowrap' };
const projectLine: CSSProperties = { fontSize: '9.5px', color: '#64748B', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const progressRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', marginTop: '7px' };
const progressPct: CSSProperties = { fontSize: '10px', fontWeight: 900, color: '#475569', minWidth: '28px' };
const progressTrack: CSSProperties = { flex: 1, height: '7px', background: '#EEF2F7', borderRadius: '5px', overflow: 'hidden' };
const progressFill: CSSProperties = { display: 'block', height: '100%', borderRadius: '5px', transition: 'width .3s ease' };
const foot: CSSProperties = { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' };
const ackBtn: CSSProperties = { fontSize: '11px', lineHeight: 1, padding: '3px 7px', borderRadius: '20px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', fontFamily: 'inherit' };
const chip: CSSProperties = { fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' };
