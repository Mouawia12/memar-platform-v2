import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { type CSSProperties, type ReactNode, useState } from 'react';

import { FollowupCard } from './FollowupCard';
import { FU_BOARD, type Followup, type FollowupStage } from '../types';
import '../../crm/crm.css';

interface Props {
  followups: Followup[];
  onOpen?: (f: Followup) => void;
  onMove: (f: Followup, stage: FollowupStage) => void;
  /** يُستدعى بمرحلة العمود الذي ضُغط زرّه — تُضاف البطاقة في نفس العمود. */
  onAdd?: (stage: FollowupStage) => void;
}

function Column({ color, label, icon, count, stage, children }: { color: string; label: string; icon: string; count: number; stage: FollowupStage; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} style={{ ...column, ...(isOver ? columnOver : null) }}>
      <div style={{ ...colHeader, borderTop: `3px solid ${color}` }}>
        <span style={colTitle}>{icon} {label}</span>
        <span style={{ ...colCount, background: `${color}1a`, color }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function DragCard({ followup, children }: { followup: Followup; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: followup.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? 'crm-dragging' : ''} style={{ cursor: 'grab', touchAction: 'pan-x pan-y' }}>
      {children}
    </div>
  );
}

/** لوحة المتابعة (كانبان) — أعمدة مجدولة/اليوم/متأخرة/منجزة، طبق أصل المرجع. */
export function FollowupBoard({ followups, onOpen, onMove, onAdd }: Props) {
  const [active, setActive] = useState<Followup | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));
  const stageKeys = new Set(FU_BOARD.map((s) => s.key));

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const f = followups.find((x) => x.id === a.id);
    const target = over.id as FollowupStage;
    if (f && stageKeys.has(target) && f.stage !== target) onMove(f, target);
  };

  return (
    <div className="crm-scope">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActive(followups.find((f) => f.id === e.active.id) ?? null)} onDragEnd={handleDragEnd}>
        <div className="crm-hscroll" style={board}>
          {FU_BOARD.map((s) => {
            const colItems = followups.filter((f) => f.stage === s.key);
            return (
              <Column key={s.key} stage={s.key} color={s.color} label={s.label} icon={s.icon} count={colItems.length}>
                {colItems.length === 0 && <p style={empty}>أفلت هنا</p>}
                {colItems.map((f) => <DragCard key={f.id} followup={f}><FollowupCard followup={f} onOpen={onOpen} /></DragCard>)}
                {onAdd && <button type="button" className="crm-add-btn" style={addBtn} onClick={() => onAdd(s.key)}>+ متابعة جديدة</button>}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{active ? <div style={{ transform: 'rotate(2deg)', width: '250px' }}><FollowupCard followup={active} /></div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '14px', scrollbarWidth: 'thin', scrollbarColor: '#274A78 #E4EAF1' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '9px', minHeight: '140px', flex: '1 1 268px', minWidth: '268px', transition: 'background 0.15s ease, outline 0.15s ease' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const colHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '9px 12px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const colTitle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 800, color: '#1A1F2E' };
const colCount: CSSProperties = { borderRadius: '14px', padding: '2px 9px', fontSize: '11px', fontWeight: 800, flexShrink: 0 };
const empty: CSSProperties = { opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' };
const addBtn: CSSProperties = { width: '100%', padding: '9px 12px', background: 'transparent', border: '1.5px dashed #CBD5E1', borderRadius: '8px', color: '#94A3B8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginTop: '2px' };
