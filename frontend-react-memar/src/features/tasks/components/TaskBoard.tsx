import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { type CSSProperties, type ReactNode, useState } from 'react';

import { TaskCard } from './TaskCard';
import { STATUS_LABELS, STATUS_ORDER, type Task, type TaskStatus } from '../types';

interface Props {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, status: TaskStatus) => void;
}

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: '#6B7280',
  in_progress: '#274A78',
  review: '#D97706',
  done: '#059669',
};

/** عمود قابل للإفلات فيه. */
function DroppableColumn({ status, count, children }: { status: TaskStatus; count: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} style={{ ...column, borderTop: `3px solid ${COLUMN_COLORS[status]}`, ...(isOver ? columnOver : null) }}>
      <div style={{ ...colHeader, color: COLUMN_COLORS[status] }}>
        {STATUS_LABELS[status]} <span style={{ opacity: 0.5 }}>({count})</span>
      </div>
      {children}
    </div>
  );
}

/** بطاقة قابلة للسحب. */
function DraggableCard({ task, children }: { task: Task; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
    >
      {children}
    </div>
  );
}

export function TaskBoard({ tasks, onEdit, onDelete, onMove }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && STATUS_ORDER.includes(newStatus) && task.status !== newStatus) {
      onMove(task, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={board}>
        {STATUS_ORDER.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <DroppableColumn key={status} status={status} count={columnTasks.length}>
              {columnTasks.length === 0 && (
                <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>أفلت هنا</p>
              )}
              {columnTasks.map((task) => (
                <DraggableCard key={task.id} task={task}>
                  <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
                </DraggableCard>
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: 'rotate(2deg)', cursor: 'grabbing' }}>
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} onMove={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px', minHeight: '140px', flex: '1 1 240px', minWidth: '240px', transition: 'background 0.15s ease, outline 0.15s ease' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const colHeader: CSSProperties = { fontWeight: 700, fontSize: '14px', padding: '4px 8px 10px', color: '#274A78' };
