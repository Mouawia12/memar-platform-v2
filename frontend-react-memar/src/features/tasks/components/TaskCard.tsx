import type { CSSProperties } from 'react';

import { useMarkTaskRead } from '../hooks/useTasks';
import { type Task } from '../types';

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  onToggle?: (t: Task) => void;
  onDelete?: (t: Task) => void;
}

/** لون شريط الأولوية (يمين الكرت) — طبق أصل .kanban-card-priority. */
const PRIO_BAR: Record<string, string> = { urgent: '#DC4A3D', high: '#E8A838', medium: '#1B6CA8', low: '#2D9B6F' };
/** وسم القسم بلون حسب اسمه — طبق أصل .ktag. */
const DEPT_TAGS: { test: RegExp; bg: string; fg: string }[] = [
  { test: /معمار/, bg: '#EDE9FE', fg: '#7C3AED' },
  { test: /إنشائ|انشائ/, bg: '#FEF3C7', fg: '#D97706' },
  { test: /كهرب|ميكانيك|MEP/i, bg: '#DBEAFE', fg: '#2563EB' },
  { test: /كميات/, bg: '#D1FAE5', fg: '#059669' },
  { test: /اعتماد|حكوم|ترخيص/, bg: '#FEE2E2', fg: '#DC2626' },
];
const deptStyle = (d: string) => DEPT_TAGS.find((x) => x.test.test(d)) ?? { bg: '#E0E7FF', fg: '#4338CA' };

/** بطاقة مهمة — طبق أصل .kanban-card من معمار customer portal (رمز/عنوان/مسؤول/موعد/تقدّم/قسم). */
export function TaskCard({ task, onOpen }: Props) {
  const markRead = useMarkTaskRead();
  const progress = Math.max(0, Math.min(100, task.progress ?? 0));
  const bar = PRIO_BAR[task.priority] ?? '#1B6CA8';
  const dep = task.department ? deptStyle(task.department) : null;
  const showBell = task.status !== 'done' && !!task.has_unread;
  const due = task.due_date ? task.due_date.slice(0, 10) : '—';
  const code = task.code ?? `TSK-${String(task.id).padStart(4, '0')}`;

  return (
    <div className="crm-lead-card" style={card} onClick={() => onOpen(task)}>
      <span style={{ ...prio, background: bar }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
        <div style={cardId}>#{code}</div>
        {showBell && (
          <button type="button" className="task-bell-ring" title="نشاط جديد — اضغط لتعليمه كمقروء" onClick={(e) => { e.stopPropagation(); markRead.mutate(task.id); }} disabled={markRead.isPending} style={bell}>
            <i className="fas fa-bell" />
          </button>
        )}
      </div>
      <div style={cardTitle}>{task.title}</div>
      <div style={cardMeta}>
        <span>👤 {task.assignee?.name ?? '—'}</span>
        <span>📅 {due}</span>
      </div>
      <div style={cardProgress}>
        <div style={track}><div style={{ ...fill, width: `${progress}%`, background: progress >= 100 ? '#2D9B6F' : '#1B6CA8' }} /></div>
        <span style={progText}>{progress}%</span>
      </div>
      {task.department && dep && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
          <span style={{ ...ktag, background: dep.bg, color: dep.fg }}>{task.department}</span>
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
const cardMeta: CSSProperties = { display: 'flex', gap: '8px', fontSize: '10px', color: '#64748B', flexWrap: 'wrap', marginBottom: '6px' };
const cardProgress: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' };
const track: CSSProperties = { flex: 1, height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' };
const fill: CSSProperties = { height: '100%', borderRadius: '3px', transition: 'width .3s ease' };
const progText: CSSProperties = { fontSize: '10px', fontWeight: 700, color: '#64748B', minWidth: '30px', textAlign: 'end' };
const ktag: CSSProperties = { fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 };
const bell: CSSProperties = { background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', fontSize: '12px', padding: 0, flexShrink: 0 };
