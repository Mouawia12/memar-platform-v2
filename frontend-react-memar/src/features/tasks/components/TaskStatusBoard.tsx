import { closestCenter, DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { type CSSProperties, type ReactNode, useRef, useState } from 'react';

import { useEdgeAutoScroll } from '../../../hooks/useEdgeAutoScroll';
import { useStaffAvatars } from '../../users/hooks/useUsers';
import { CARD_ACTIVITY_STYLES } from './cardActivityStyles';
import { TaskKanbanCard } from './TaskKanbanCard';
import type { Task, TaskStatus } from '../types';

interface Props {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onMove: (t: Task, status: TaskStatus) => void;
  /** هل أُطفئ تنبيه تأخّر هذه المهمة؟ */
  isAcked?: (t: Task) => boolean;
  /** إطفاء تنبيه التأخّر لهذه المهمة. */
  onAck?: (t: Task) => void;
  /** معرّف المستخدم الحالي — لإبراز مهامه وسط مهام الفريق. */
  meId?: number | null;
  /** تمييز مهامي عن غيرها (عند عرض «جميع المهام») — طلب أيمن 2026-08-29. */
  highlightMine?: boolean;
  /** حفظ نسبة الإنجاز المعدَّلة من شريط البطاقة (طلب أيمن 2026-08-29). */
  onProgress?: (t: Task, pct: number) => void;
  /** فتح نافذة التوجيهات لمهمة — إن غابت لا يظهر زرّ التوجيه على البطاقات. */
  onDirective?: (t: Task) => void;
  /** يملك إرسال التوجيهات (الإدارة) — يرى الزرّ على كل البطاقات لا على مهامه فقط. */
  canSendDirective?: boolean;
}

/** أعمدة لوحة المهام حسب مرحلة العمل (طلب أيمن 2026-08-24). */
const COLUMNS: { key: TaskStatus; label: string; icon: string; color: string }[] = [
  { key: 'todo', label: 'جديدة', icon: '📩', color: '#1B6CA8' },
  { key: 'in_progress', label: 'قيد التنفيذ', icon: '🔄', color: '#E8A838' },
  { key: 'review', label: 'مراجعة', icon: '🔍', color: '#7C3AED' },
  { key: 'done', label: 'مكتملة', icon: '✅', color: '#2D9B6F' },
];

function DragCard({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ cursor: 'grab', touchAction: 'pan-x pan-y', opacity: isDragging ? 0.45 : 1, borderRadius: '10px' }}>
      {children}
    </div>
  );
}

interface ColumnProps {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onOpen: (t: Task) => void;
  avatars?: Record<string, string>;
  isAcked?: (t: Task) => boolean;
  onAck?: (t: Task) => void;
  isMine: (t: Task) => boolean;
  highlightMine: boolean;
  /** يُرجع مُعالج التوجيه لهذه البطاقة، أو undefined فلا يظهر الزرّ عليها. */
  directiveFor: (t: Task) => ((t: Task) => void) | undefined;
  onProgress?: (t: Task, pct: number) => void;
}

function Column({ col, tasks, onOpen, avatars, isAcked, onAck, isMine, highlightMine, directiveFor, onProgress }: ColumnProps) {
  const mineCount = highlightMine ? tasks.filter(isMine).length : 0;
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div style={{ ...column, ...(isOver ? columnOver : null) }}>
      <div style={{ ...header, borderTop: `3px solid ${col.color}` }}>
        <span style={{ fontWeight: 800, fontSize: '13px', color: '#1A1F2E' }}>{col.icon} {col.label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* «منها لي» يقول للموظف كم يخصّه في العمود دون أن يعدّ البطاقات بنفسه. */}
          {mineCount > 0 && <span style={mineChip} title="مهامي في هذا العمود">{mineCount} لي</span>}
          <span style={{ ...count, color: col.color, background: `${col.color}1a` }}>{tasks.length}</span>
        </span>
      </div>
      <div ref={setNodeRef} style={body}>
        {tasks.length === 0 && <p style={{ opacity: 0.4, fontSize: '12.5px', textAlign: 'center', padding: '18px 0' }}>أفلت هنا</p>}
        {tasks.map((t) => (
          <DragCard key={t.id} id={t.id}>
            <TaskKanbanCard
              task={t}
              onOpen={onOpen}
              acked={isAcked?.(t)}
              onAck={onAck}
              avatarUrl={t.assignee ? avatars?.[String(t.assignee.id)] ?? null : null}
              mine={highlightMine && isMine(t)}
              muted={highlightMine && !isMine(t)}
              onDirective={directiveFor(t)}
              onProgress={onProgress}
            />
          </DragCard>
        ))}
      </div>
    </div>
  );
}

/** لوحة المهام (كانبان) حسب مرحلة العمل — السحب بين الأعمدة يغيّر حالة المهمة. */
export function TaskStatusBoard({ tasks, onOpen, onMove, isAcked, onAck, meId, highlightMine, onDirective, canSendDirective, onProgress }: Props) {
  const [active, setActive] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));
  const boardRef = useRef<HTMLDivElement>(null);
  useEdgeAutoScroll(boardRef);
  const isMine = (t: Task) => !!meId && t.assignee?.id === meId;
  // لا نميّز إن كان المعروض مهامي وحدها — كلّها لي فلا شيء يُقارَن به.
  const markMine = !!highlightMine && !!meId;
  /*
   * فتح خيط التوجيه متاح للإدارة على كل بطاقة (لها أن تبدأ توجيهًا)، ولغيرها
   * على البطاقات التي عليها توجيه قائم فقط — فلا يظهر زرّ «توجيه» لمن لا يملك
   * إرساله، وتبقى شارة التوجيه القائم قابلة للضغط ليقرأها المعنيّ بها.
   */
  const directiveFor = (t: Task) =>
    onDirective && (canSendDirective || t.directive) ? onDirective : undefined;
  const ownerIds = [...new Set(tasks.map((t) => t.assignee?.id).filter((v): v is number => !!v))];
  const { data: avatars } = useStaffAvatars(ownerIds);

  const handleEnd = (e: DragEndEvent) => {
    setActive(null);
    const over = e.over?.id;
    if (typeof over !== 'string') return;
    const t = tasks.find((x) => x.id === e.active.id);
    if (t && t.status !== over) onMove(t, over as TaskStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActive(tasks.find((t) => t.id === e.active.id) ?? null)}
      onDragEnd={handleEnd}
    >
      <div ref={boardRef} className="crm-hscroll" style={board}>
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            col={col}
            tasks={tasks.filter((t) => t.status === col.key)}
            onOpen={onOpen}
            avatars={avatars}
            isAcked={isAcked}
            onAck={onAck}
            isMine={isMine}
            highlightMine={markMine}
            directiveFor={directiveFor}
            onProgress={onProgress}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? <div style={{ transform: 'rotate(2deg)', width: '300px' }}><TaskKanbanCard task={active} onOpen={() => {}} /></div> : null}
      </DragOverlay>
    </DndContext>
  );
}

// الأعمدة في صفّ أفقي واحد لا تلتفّ، والتمرير جانبي (طلب أيمن 2026-08-24).
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
const column: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#F0F4F8', borderRadius: '10px', padding: '9px', border: '1px solid transparent', minHeight: '140px', flex: '0 0 300px', width: '300px', minWidth: '300px' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const { mineChip } = CARD_ACTIVITY_STYLES; // مشترك مع لوحة المتابعة
const count: CSSProperties = { fontSize: '11px', fontWeight: 900, borderRadius: '999px', padding: '1px 9px' };
const body: CSSProperties = { display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', minHeight: '60px' };
