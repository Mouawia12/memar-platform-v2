import type { CSSProperties } from 'react';

import { TaskCard } from './TaskCard';
import { STATUS_LABELS, STATUS_ORDER, type Task, type TaskStatus } from '../types';

interface Props {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, status: TaskStatus) => void;
}

export function TaskBoard({ tasks, onEdit, onDelete, onMove }: Props) {
  return (
    <div style={board}>
      {STATUS_ORDER.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} style={column}>
            <div style={colHeader}>
              {STATUS_LABELS[status]} <span style={{ opacity: 0.5 }}>({columnTasks.length})</span>
            </div>
            {columnTasks.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>—</p>}
            {columnTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

const board: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'start' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px', minHeight: '120px' };
const colHeader: CSSProperties = { fontWeight: 700, fontSize: '14px', padding: '4px 8px 10px', color: '#274A78' };
