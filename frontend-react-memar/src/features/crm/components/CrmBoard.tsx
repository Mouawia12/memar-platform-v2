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

import { LeadCard } from './LeadCard';
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER, type Lead, type Stage } from '../types';

interface Props {
  leads: Lead[];
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
}

const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

/** عمود مرحلة قابل للإفلات فيه. */
function DroppableColumn({ stage, count, total, children }: { stage: Stage; count: number; total: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} style={{ ...column, borderTop: `3px solid ${STAGE_COLORS[stage]}`, ...(isOver ? columnOver : null) }}>
      <div style={{ ...colHeader, color: STAGE_COLORS[stage] }}>
        {STAGE_LABELS[stage]} <span style={{ opacity: 0.5 }}>({count})</span>
        {total > 0 && <div style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7, marginTop: '2px' }}>{money(total)}</div>}
      </div>
      {children}
    </div>
  );
}

function DraggableCard({ lead, children }: { lead: Lead; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}>
      {children}
    </div>
  );
}

export function CrmBoard({ leads, onEdit, onDelete, onMove }: Props) {
  const [active, setActive] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = (e: DragStartEvent) => setActive(leads.find((l) => l.id === e.active.id) ?? null);

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l.id === a.id);
    const newStage = over.id as Stage;
    if (lead && STAGE_ORDER.includes(newStage) && lead.stage !== newStage) {
      onMove(lead, newStage);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={board}>
        {STAGE_ORDER.map((stage) => {
          const colLeads = leads.filter((l) => l.stage === stage);
          const total = colLeads.reduce((sum, l) => sum + Number(l.deal_value_kwd), 0);
          return (
            <DroppableColumn key={stage} stage={stage} count={colLeads.length} total={total}>
              {colLeads.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>أفلت هنا</p>}
              {colLeads.map((lead) => (
                <DraggableCard key={lead.id} lead={lead}>
                  <LeadCard lead={lead} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
                </DraggableCard>
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {active ? (
          <div style={{ transform: 'rotate(2deg)', cursor: 'grabbing' }}>
            <LeadCard lead={active} onEdit={() => {}} onDelete={() => {}} onMove={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px', minHeight: '160px', flex: '1 1 220px', minWidth: '220px', transition: 'background 0.15s ease, outline 0.15s ease' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const colHeader: CSSProperties = { fontWeight: 700, fontSize: '14px', padding: '4px 8px 10px' };
