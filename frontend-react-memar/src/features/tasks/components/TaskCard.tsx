import type { CSSProperties } from 'react';

import { PRIORITY_COLORS, PRIORITY_LABELS, dueLabel, isDone, type Task } from '../types';

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  onToggle: (t: Task) => void;
  onDelete?: (t: Task) => void; // يُمرَّر فقط لمن يملك صلاحية الحذف (سوبر أدمن)
}

/** لون تسمية الاستحقاق حسب حالته. */
function dueColor(t: Task): { fg: string; bg: string } {
  if (isDone(t)) return { fg: '#059669', bg: '#05966915' };
  const label = dueLabel(t);
  if (label.startsWith('تأخّر') || label === 'أمس') return { fg: '#DC2626', bg: '#DC262615' };
  if (label === 'اليوم') return { fg: '#D97706', bg: '#D9770615' };

  return { fg: '#2563EB', bg: '#2563EB15' };
}

/** بطاقة مهمة — بتصميم لوحة المتابعة القديمة (حدّ أولوية، مربع إكمال، وسم استحقاق). */
export function TaskCard({ task, onOpen, onToggle, onDelete }: Props) {
  const pr = PRIORITY_COLORS[task.priority];
  const done = isDone(task);
  const due = dueColor(task);
  const commentsCount = task.comments_count ?? 0;
  // «تم تحديث الموضوع» (طلب أيمن 2026-08-05): جرس إذا عُدّلت المهمة خلال آخر 24 ساعة.
  const recentlyUpdated = !done && !!task.updated_at && Date.now() - new Date(task.updated_at).getTime() < 86_400_000;

  return (
    <div
      onClick={() => onOpen(task)}
      style={{
        ...card,
        borderInlineStart: `4px solid ${pr}`,
        border: `1px solid ${pr}22`,
        background: done ? 'rgba(5,150,105,0.03)' : dueLabel(task).startsWith('تأخّر') || dueLabel(task) === 'أمس' ? 'rgba(220,38,38,0.04)' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          title={done ? 'إعادة فتح' : 'تحديد كمكتملة'}
          style={{ ...chk, background: done ? '#059669' : '#fff', borderColor: done ? '#059669' : '#CBD5E1', color: '#fff' }}
        >
          {done ? '✓' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '3px' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>
              {task.title}
            </div>
            {/* جرس «تم تحديث الموضوع» — إشعار بصري عند وجود نشاط حديث على المهمة */}
            {recentlyUpdated && <span title="تم تحديث الموضوع مؤخرًا" style={bell}><i className="fas fa-bell" /></span>}
          </div>
          {task.description && (
            <div style={{ fontSize: '11px', color: '#5A6478', marginBottom: '5px', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            <span style={{ ...pill, background: `${pr}18`, color: pr, border: `1px solid ${pr}33` }}>{PRIORITY_LABELS[task.priority]}</span>
            {task.project && <span style={{ ...pill, background: '#274A7810', color: '#274A78', border: '1px solid #274A7822' }}>🏗️ {task.project.name}</span>}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '10.5px' }}>
            <span style={{ color: '#8A93A3' }}>📝 {task.assignee?.name ?? 'غير مُسند'}</span>
            {task.due_date && <span style={{ color: '#8A93A3' }}>📅 {task.due_date.slice(0, 10)}</span>}
            {commentsCount > 0 && <span style={{ ...pill, background: '#EAF2FB', color: '#1B6CA8', border: '1px solid #CFE2F5' }}><i className="fas fa-comment-dots" /> {commentsCount}</span>}
            <span style={{ ...pill, background: due.bg, color: due.fg, fontWeight: 700 }}>{dueLabel(task)}</span>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            title="حذف (مدير النظام)"
            style={delBtn}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

const card: CSSProperties = { cursor: 'pointer', borderRadius: '10px', padding: '11px 12px', marginBottom: '9px', transition: 'box-shadow .15s' };
const chk: CSSProperties = { flexShrink: 0, width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid', cursor: 'pointer', fontSize: '11px', lineHeight: 1, display: 'grid', placeItems: 'center', marginTop: '1px', padding: 0 };
const pill: CSSProperties = { fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' };
const delBtn: CSSProperties = { flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.4, padding: '2px' };
const bell: CSSProperties = { flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'grid', placeItems: 'center', fontSize: '10px' };
