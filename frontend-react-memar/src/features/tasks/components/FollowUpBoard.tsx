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
import { FOLLOWUP_COLUMNS, dueDiffDays, taskColumn, type FollowUpColumn, type Task, type TaskStatus } from '../types';

interface Props {
  tasks: Task[];
  canDelete: boolean;
  onOpen: (t: Task) => void;
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, payload: { due_date?: string; status?: TaskStatus }) => void;
}

/** فلاتر الفترة لكل عمود (طبق الأصل، موسّعة حسب طلب العميل). */
const COLUMN_FILTERS: Partial<Record<FollowUpColumn, { key: string; label: string; days: number }[]>> = {
  overdue: [
    { key: 'all', label: 'الكل', days: Infinity },
    { key: 'y', label: 'أمس', days: 1 },
    { key: 'w', label: 'الأسبوع', days: 7 },
    { key: 'm', label: 'الشهر', days: 30 },
    { key: 'yr', label: 'السنة', days: 365 },
  ],
  upcoming: [
    { key: 'all', label: 'الكل', days: Infinity },
    { key: 't', label: 'غدًا', days: 1 },
    { key: 'w', label: 'الأسبوع', days: 7 },
    { key: 'm', label: 'الشهر', days: 30 },
    { key: 'yr', label: 'السنة', days: 365 },
  ],
  done: [
    { key: 'all', label: 'الكل', days: Infinity },
    { key: 'w', label: 'الأسبوع', days: 7 },
    { key: 'm', label: 'الشهر', days: 30 },
  ],
};

const iso = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);

  return d.toISOString().slice(0, 10);
};

/** ما تُرسله كل عمود عند الإفلات فيه (طبق دالة dropTask القديمة). */
function movePayload(col: FollowUpColumn): { due_date?: string; status?: TaskStatus } {
  switch (col) {
    case 'today': return { due_date: iso(0), status: 'todo' };
    case 'upcoming': return { due_date: iso(1), status: 'todo' };
    case 'overdue': return { due_date: iso(-1), status: 'todo' };
    case 'done': return { status: 'done' };
  }
}

function DroppableColumn({ col, children }: { col: FollowUpColumn; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col });

  return <div ref={setNodeRef} style={{ ...colBody, ...(isOver ? colOver : null) }}>{children}</div>;
}

function DraggableCard({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}>
      {children}
    </div>
  );
}

export function FollowUpBoard({ tasks, canDelete, onOpen, onToggle, onDelete, onMove }: Props) {
  const [active, setActive] = useState<Task | null>(null);
  // فلتر الفترة المختار لكل عمود
  const [filters, setFilters] = useState<Record<string, string>>({ overdue: 'all', upcoming: 'all', done: 'all' });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped: Record<FollowUpColumn, Task[]> = { overdue: [], today: [], upcoming: [], done: [] };
  for (const t of tasks) grouped[taskColumn(t)].push(t);
  // القادمة تصاعديًا، المتأخرة الأحدث تأخّرًا أولًا، المنتهية الأحدث أولًا
  grouped.overdue.sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));
  grouped.upcoming.sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9'));
  grouped.done.reverse();

  /** يطبّق فلتر الفترة على عمود. */
  const applyFilter = (col: FollowUpColumn, list: Task[]): Task[] => {
    const sel = filters[col];
    const opt = COLUMN_FILTERS[col]?.find((f) => f.key === sel);
    if (!opt || opt.days === Infinity) return list;

    return list.filter((t) => {
      const diff = dueDiffDays(t.due_date);
      if (diff === null) return false;

      return Math.abs(diff) <= opt.days;
    });
  };

  const onDragStart = (e: DragStartEvent) => setActive(tasks.find((t) => t.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const task = tasks.find((t) => t.id === a.id);
    const col = over.id as FollowUpColumn;
    if (task && taskColumn(task) !== col) onMove(task, movePayload(col));
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div style={boardScroll}>
        <div style={boardGrid}>
          {FOLLOWUP_COLUMNS.map((c) => {
            const list = applyFilter(c.key, grouped[c.key]);
            const opts = COLUMN_FILTERS[c.key];

            return (
              <div key={c.key} style={{ ...colWrap, borderColor: c.border }}>
                <div style={{ ...colHead, background: `${c.color}18`, borderBottom: `1.5px solid ${c.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: opts ? '6px' : 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ fontSize: '16px' }}>{c.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: c.color }}>{c.label}</span>
                    </span>
                    <span style={{ background: c.color, color: '#fff', borderRadius: '99px', padding: '2px 10px', fontSize: '11px', fontWeight: 800 }}>{list.length}</span>
                  </div>
                  {opts && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {opts.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setFilters((s) => ({ ...s, [c.key]: f.key }))}
                          style={{ ...filterBtn, ...(filters[c.key] === f.key ? { background: c.color, color: '#fff', borderColor: c.color } : null) }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <DroppableColumn col={c.key}>
                  {list.length === 0
                    ? <div style={empty}>{c.key === 'overdue' ? '🎉 لا مهام متأخرة' : c.key === 'done' ? 'لا مهام مكتملة' : c.key === 'today' ? 'لا مهام اليوم' : 'لا مهام قادمة'}</div>
                    : list.map((t) => (
                      <DraggableCard key={t.id} id={t.id}>
                        <TaskCard task={t} onOpen={onOpen} onToggle={onToggle} onDelete={canDelete ? onDelete : undefined} />
                      </DraggableCard>
                    ))}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {active ? <div style={{ transform: 'rotate(2deg)', width: '215px' }}><TaskCard task={active} onOpen={() => {}} onToggle={() => {}} /></div> : null}
      </DragOverlay>
    </DndContext>
  );
}

const boardScroll: CSSProperties = { overflowX: 'auto', width: '100%', paddingBottom: '4px' };
const boardGrid: CSSProperties = { display: 'flex', flexWrap: 'nowrap', gap: '12px', minWidth: 'max-content' };
const colWrap: CSSProperties = { background: '#F0F4F8', border: '1.5px solid', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '350px', width: '245px', flexShrink: 0 };
const colHead: CSSProperties = { padding: '10px 13px' };
const colBody: CSSProperties = { flex: 1, padding: '10px', overflowY: 'auto', maxHeight: '62vh', transition: 'background .15s' };
const colOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78', outlineOffset: '-4px' };
const empty: CSSProperties = { textAlign: 'center', padding: '28px 10px', color: '#8A93A3', fontSize: '12px' };
const filterBtn: CSSProperties = { fontSize: '10px', padding: '2px 8px', borderRadius: '8px', cursor: 'pointer', background: '#fff', border: '1px solid #e2e8f0', fontFamily: 'inherit', color: '#5A6478' };
