import type { CSSProperties } from 'react';

import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_ORDER, type Task, type TaskStatus } from '../types';

interface Props {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, status: TaskStatus) => void;
}

export function TaskCard({ task, onEdit, onDelete, onMove }: Props) {
  const idx = STATUS_ORDER.indexOf(task.status);
  const prev = idx > 0 ? STATUS_ORDER[idx - 1] : null;
  const next = idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;

  return (
    <div className="card" style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
        <b style={{ fontSize: '14px' }}>{task.title}</b>
        <span style={{ ...badge, background: `${PRIORITY_COLORS[task.priority]}1a`, color: PRIORITY_COLORS[task.priority] }}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px', lineHeight: 1.7 }}>
        {task.project && <div>🏗️ {task.project.name}</div>}
        {task.assignee && <div>👤 {task.assignee.name}</div>}
        {task.due_date && <div>📅 {task.due_date}</div>}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginTop: '10px', alignItems: 'center' }}>
        <button className="btn btn-sm" type="button" disabled={!prev} onClick={() => prev && onMove(task, prev)} title="للخلف">‹</button>
        <button className="btn btn-sm" type="button" disabled={!next} onClick={() => next && onMove(task, next)} title="للأمام">›</button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" type="button" onClick={() => onEdit(task)}>تعديل</button>
        <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => onDelete(task)}>حذف</button>
      </div>
    </div>
  );
}

const card: CSSProperties = { padding: '12px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const badge: CSSProperties = { display: 'inline-block', padding: '1px 8px', borderRadius: '6px', fontSize: '11px', whiteSpace: 'nowrap', height: 'fit-content' };
