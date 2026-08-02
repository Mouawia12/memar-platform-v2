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
import { isStageCollapsed, setStageCollapsed, useCollapsedStages, useHiddenStages } from '../boardPrefs';
import type { Lead, PipelineStage, Stage } from '../types';

interface Props {
  leads: Lead[];
  stages: PipelineStage[];
  onMove: (l: Lead, stage: Stage) => void;
  onOpen: (l: Lead) => void;
}

const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

/** عمود مرحلة مطويّ إلى شريط رفيع — يبقى هدفًا صالحًا للإفلات (مثل بيتريكس). */
function CollapsedColumn({ stage, count, total }: { stage: PipelineStage; count: number; total: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div
      ref={setNodeRef}
      onClick={() => setStageCollapsed(stage.key, false)}
      title={`توسيع «${stage.label}» — ${count} فرصة${total > 0 ? ` · ${money(total)}` : ''}`}
      style={{ ...collapsedCol, borderTop: `3px solid ${stage.color}`, ...(isOver ? columnOver : null) }}
    >
      <span style={{ ...collapsedCount, color: stage.color }}>{count}</span>
      <span style={{ ...collapsedLabel, color: stage.color }}>{stage.label}</span>
      <span style={{ fontSize: '13px', color: stage.color }}>⟨</span>
    </div>
  );
}

/** عمود مرحلة قابل للإفلات فيه (الحالة الموسّعة). */
function DroppableColumn({ stage, count, total, children }: { stage: PipelineStage; count: number; total: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div ref={setNodeRef} style={{ ...column, ...(isOver ? columnOver : null) }}>
      <div style={{ ...colHeader, borderTop: `3px solid ${stage.color}` }}>
        <span style={{ ...colDot, background: stage.color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#1A1F2E' }}>
            {stage.label} <span style={{ color: stage.color, fontWeight: 700 }}>({count})</span>
          </div>
          {total > 0 && <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A93A3', marginTop: '1px' }}>{money(total)}</div>}
        </div>
        <button type="button" onClick={() => setStageCollapsed(stage.key, true)} title="طيّ العمود" style={collapseBtn}>⟩</button>
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

export function CrmBoard({ leads, stages, onMove, onOpen }: Props) {
  const [active, setActive] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const collapsedMap = useCollapsedStages();
  const hiddenMap = useHiddenStages();
  const visibleStages = stages.filter((s) => !hiddenMap[s.key]);

  const stageKeys = new Set(stages.map((s) => s.key));
  const colorOf = (key: string) => stages.find((s) => s.key === key)?.color;

  const handleDragStart = (e: DragStartEvent) => setActive(leads.find((l) => l.id === e.active.id) ?? null);

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l.id === a.id);
    const newStage = over.id as Stage;
    if (lead && stageKeys.has(newStage) && lead.stage !== newStage) {
      onMove(lead, newStage);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={board}>
        {visibleStages.map((stage) => {
          const colLeads = leads.filter((l) => l.stage === stage.key);
          const total = colLeads.reduce((sum, l) => sum + Number(l.deal_value_kwd), 0);
          if (isStageCollapsed(collapsedMap, stage.key, stage.is_lost)) {
            return <CollapsedColumn key={stage.key} stage={stage} count={colLeads.length} total={total} />;
          }
          return (
            <DroppableColumn key={stage.key} stage={stage} count={colLeads.length} total={total}>
              {colLeads.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>أفلت هنا</p>}
              {colLeads.map((lead) => (
                <DraggableCard key={lead.id} lead={lead}>
                  <LeadCard lead={lead} onOpen={onOpen} stageColor={stage.color} />
                </DraggableCard>
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {active ? (
          <div style={{ transform: 'rotate(2deg)', cursor: 'grabbing' }}>
            <LeadCard lead={active} onOpen={() => {}} stageColor={colorOf(active.stage)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const board: CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '8px', minHeight: '140px', flex: '1 1 232px', minWidth: '232px', transition: 'background 0.15s ease, outline 0.15s ease' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
// رأس المرحلة ككارت أبيض واضح: نقطة لون + العنوان + العدّاد + الإجمالي + زر الطيّ.
const colHeader: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const colDot: CSSProperties = { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 };
const collapseBtn: CSSProperties = { background: '#F2F5F9', border: '1px solid #E4E8EF', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', color: '#5A6478', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
// الشريط المطويّ: عمود رفيع عمودي يظهر العدد + اسم المرحلة رأسيًا + سهم توسيع.
const collapsedCol: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px 6px', minHeight: '140px', width: '46px', flex: '0 0 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.15s ease, outline 0.15s ease' };
const collapsedCount: CSSProperties = { fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' };
const collapsedLabel: CSSProperties = { writingMode: 'vertical-rl', fontWeight: 700, fontSize: '12.5px', whiteSpace: 'nowrap', flex: 1 };
