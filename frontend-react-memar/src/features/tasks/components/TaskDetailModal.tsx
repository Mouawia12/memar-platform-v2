import type { CSSProperties } from 'react';

import { PRIORITY_COLORS, PRIORITY_LABELS, dueLabel, isDone, type Task } from '../types';

interface Props {
  task: Task;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
}

/** تفاصيل المهمة — طبق مودال الأصل، مع أزرار الإكمال/التعديل/الحذف. */
export function TaskDetailModal({ task, canDelete, onClose, onEdit, onToggle, onDelete }: Props) {
  const done = isDone(task);
  const pr = PRIORITY_COLORS[task.priority];

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{task.title}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={grid}>
          <Field label="📅 الموعد"><b>{task.due_date ? task.due_date.slice(0, 10) : '—'}</b> <span style={{ fontSize: '12px', color: '#8A93A3' }}>({dueLabel(task)})</span></Field>
          <Field label="⚡ الأولوية"><span style={{ ...tag, background: `${pr}1a`, color: pr }}>{PRIORITY_LABELS[task.priority]}</span></Field>
          <Field label="📝 المسؤول"><b>{task.assignee?.name ?? 'غير مُسند'}</b></Field>
          <Field label="✅ الحالة">
            <span style={{ ...tag, background: done ? '#05966915' : '#D9770615', color: done ? '#059669' : '#D97706' }}>
              {done ? 'مكتملة ✓' : 'قيد التنفيذ'}
            </span>
          </Field>
          {task.project && <Field label="🏗️ المشروع" span2><b style={{ color: '#274A78' }}>{task.project.name}</b></Field>}
          {task.description && <Field label="🗒️ ملاحظات" span2><span style={{ color: '#5A6478' }}>{task.description}</span></Field>}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="button" onClick={() => { onToggle(task); onClose(); }}>
            {done ? '↩ إعادة فتح' : '✅ تحديد كمكتملة'}
          </button>
          <button className="btn" type="button" onClick={() => { onEdit(task); onClose(); }}>✏️ تعديل</button>
          <span style={{ flex: 1 }} />
          {canDelete && <button className="btn" type="button" style={{ color: '#DC2626' }} onClick={() => { onDelete(task); onClose(); }}>🗑 حذف</button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ gridColumn: span2 ? 'span 2' : undefined }}>
      <div style={{ fontSize: '12px', color: '#8A93A3', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{children}</div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '20px' };
const modal: CSSProperties = { padding: '22px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px', background: '#F7F9FC', borderRadius: '10px', padding: '16px' };
const tag: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
