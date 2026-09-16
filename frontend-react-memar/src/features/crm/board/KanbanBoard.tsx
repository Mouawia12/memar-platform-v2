import {
  DndContext, DragOverlay, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { type ReactNode, useState } from 'react';

import type { Lead, PipelineStage } from '../types';
import { OpportunityCard, type CardHandlers } from './OpportunityCard';
import { contactCountdown, formatKwd, isActionRequired, boardStatus, nextStageOf, valueOf } from './model';

interface Props extends CardHandlers {
  leads: Lead[];
  stages: PipelineStage[];
  isManager: boolean;
  meId?: number;
  showTotals: boolean;
  flashing: Set<number>;
  tagColors: Map<string, string>;
  onMove: (lead: Lead, stageKey: string) => void;
  onReorder: (orderedIds: number[]) => void;
}

/** البطاقة قابلة للسحب، والإفلات عليها يعيد الترتيب داخل العمود أو ينقل المرحلة. */
function Draggable({ lead, children }: { lead: Lead; children: ReactNode }) {
  const { attributes, listeners, setNodeRef: setDrag, isDragging } = useDraggable({ id: lead.id });
  const { setNodeRef: setDrop } = useDroppable({ id: lead.id });
  return (
    <div
      ref={(node) => { setDrag(node); setDrop(node); }}
      {...attributes}
      {...listeners}
      role={undefined}
      tabIndex={-1}
      style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'pan-x pan-y' }}
    >
      {children}
    </div>
  );
}

function Column({ stage, count, total, urgent, showTotals, children }: { stage: PipelineStage; count: number; total: number; urgent: number; showTotals: boolean; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.key}` });
  return (
    <section ref={setNodeRef} className={`crmx-col${isOver ? ' over' : ''}`} aria-label={`مرحلة ${stage.label}`}>
      <header className="crmx-col-head" style={{ backgroundColor: stage.color }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 title={stage.label}>{stage.label}</h2>
          <span className="crmx-col-count num">{count}</span>
        </div>
        <div className="crmx-col-sub">
          <span className="num">{showTotals ? `${formatKwd(total)} د.ك` : ' '}</span>
          {urgent > 0 && <span className="crmx-col-urgent num"><i className="fa-solid fa-bell x-bell" style={{ fontSize: 9 }} /> {urgent} عاجل</span>}
        </div>
      </header>
      <div className="crmx-col-body">{children}</div>
    </section>
  );
}

export function KanbanBoard({ leads, stages, isManager, meId, showTotals, flashing, tagColors, onMove, onReorder, ...handlers }: Props) {
  const [active, setActive] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragStart = (e: DragStartEvent) => setActive(leads.find((l) => l.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const lead = leads.find((l) => l.id === e.active.id);
    const over = e.over?.id;
    if (!lead || over === undefined) return;
    if (typeof over === 'string' && over.startsWith('stage:')) {
      const key = over.slice(6);
      if (key !== lead.stage) onMove(lead, key);
      return;
    }
    const target = leads.find((l) => l.id === over);
    if (!target || target.id === lead.id) return;
    if (target.stage !== lead.stage) { onMove(lead, target.stage); return; }
    const ids = leads.filter((l) => l.stage === lead.stage).map((l) => l.id);
    ids.splice(ids.indexOf(lead.id), 1);
    ids.splice(ids.indexOf(target.id), 0, lead.id);
    onReorder(ids);
  };

  const card = (lead: Lead) => (
    <OpportunityCard
      lead={lead}
      isManager={isManager}
      canWrite={isManager || lead.owner?.id === meId}
      nextStage={nextStageOf(lead.stage, stages)}
      flashing={flashing.has(lead.id)}
      tagColors={tagColors}
      {...handlers}
    />
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <div className="crmx-board">
        {stages.map((stage) => {
          const col = leads.filter((l) => l.stage === stage.key);
          const urgent = col.filter((l) => isActionRequired(boardStatus(l)) || (l.directive_unread ?? 0) > 0 || contactCountdown(l.reminder?.remind_at)?.late).length;
          return (
            <Column key={stage.key} stage={stage} count={col.length} total={col.reduce((s, l) => s + valueOf(l), 0)} urgent={urgent} showTotals={showTotals}>
              {col.length === 0 ? (
                <p className="crmx-col-empty"><i className="fa-solid fa-layer-group" /> لا توجد فرص في هذه المرحلة</p>
              ) : col.map((lead) => <Draggable key={lead.id} lead={lead}>{card(lead)}</Draggable>)}
            </Column>
          );
        })}
      </div>
      {active && <p className="crmx-drop-hint">أفلت الكارت داخل العمود المطلوب لنقل الفرصة إلى مرحلته.</p>}
      <DragOverlay>{active ? <div style={{ transform: 'rotate(2deg)', width: 264 }}>{card(active)}</div> : null}</DragOverlay>
    </DndContext>
  );
}
