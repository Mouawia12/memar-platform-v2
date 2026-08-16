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
  /** إعادة ترتيب عمود: قائمة المعرّفات بالترتيب الجديد (طلب أيمن 2026-08-15). */
  onReorder: (orderedIds: number[]) => void;
  /** زر «+ إضافة فرصة» أسفل كل عمود — يظهر لمن يملك crm.manage (طبق أصل المرجع). */
  onAdd?: () => void;
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
function DroppableColumn({ stage, count, total, onExpand, children }: { stage: PipelineStage; count: number; total: number; onExpand: () => void; children: ReactNode }) {
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
        {/* تكبير: يفتح صفحة كاملة بكروت مرتّبة شبكيًّا لسهولة المراجعة (طلب أيمن 2026-08-05) */}
        <button type="button" onClick={onExpand} title="تكبير — عرض كل الكروت في صفحة كاملة" style={collapseBtn}>⤢</button>
        <button type="button" onClick={() => setStageCollapsed(stage.key, true)} title="طيّ العمود" style={collapseBtn}>⟩</button>
      </div>
      {children}
    </div>
  );
}

/** تكبير مرحلة إلى صفحة كاملة: شبكة كروت (عدّة بالصف) مع تمرير — أسهل من العمود الطولي. */
function StageExpand({ stage, leads, onOpen, onClose }: { stage: PipelineStage; leads: Lead[]; onOpen: (l: Lead) => void; onClose: () => void }) {
  const total = leads.reduce((s, l) => s + Number(l.deal_value_kwd), 0);
  return (
    <div style={expandOverlay} onClick={onClose}>
      <div style={expandPanel} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...expandHeader, borderTop: `4px solid ${stage.color}` }}>
          <div>
            <b style={{ fontSize: '18px' }}>{stage.label}</b> <span style={{ color: stage.color, fontWeight: 800 }}>({leads.length})</span>
            {total > 0 && <span style={{ color: '#8A93A3', fontSize: '13px', marginInlineStart: '10px' }}>{money(total)}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={expandClose}>×</button>
        </div>
        <div style={expandGrid}>
          {leads.length === 0 && <p style={{ opacity: 0.5, gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>لا فرص في هذه المرحلة.</p>}
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpen={onOpen} stageColor={stage.color} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraggableCard({ lead, children }: { lead: Lead; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, touchAction: 'pan-x pan-y' }}>
      {children}
    </div>
  );
}

export function CrmBoard({ leads, stages, onMove, onOpen, onReorder, onAdd }: Props) {
  /** تبديل موضع كرت مع جاره داخل العمود ثم إرسال الترتيب الجديد. */
  const moveInColumn = (colLeads: Lead[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= colLeads.length) return;
    const ids = colLeads.map((l) => l.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  };
  const [active, setActive] = useState<Lead | null>(null);
  const [expanded, setExpanded] = useState<PipelineStage | null>(null);
  // سحب بالضغط المطوّل (طلب أيمن): يبدأ السحب بعد ثبات ~250ms فقط. النقرة السريعة تفتح
  // الكرت، والتمرير باللمس (تحرّك الإصبع قبل ربع الثانية) يُلغي السحب — فلا يتحرّك الكرت
  // بالخطأ أثناء التمرير على التابلت. مع touch-action: pan-x pan-y يظلّ التمرير أفقيًا وعموديًا طبيعيًا.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));
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
      <div className="crm-hscroll" style={board}>
        {visibleStages.map((stage) => {
          const colLeads = leads.filter((l) => l.stage === stage.key);
          const total = colLeads.reduce((sum, l) => sum + Number(l.deal_value_kwd), 0);
          if (isStageCollapsed(collapsedMap, stage.key, stage.is_lost)) {
            return <CollapsedColumn key={stage.key} stage={stage} count={colLeads.length} total={total} />;
          }
          return (
            <DroppableColumn key={stage.key} stage={stage} count={colLeads.length} total={total} onExpand={() => setExpanded(stage)}>
              {colLeads.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>أفلت هنا</p>}
              {colLeads.map((lead, i) => (
                <DraggableCard key={lead.id} lead={lead}>
                  <LeadCard
                    lead={lead}
                    onOpen={onOpen}
                    stageColor={stage.color}
                    onMoveUp={() => moveInColumn(colLeads, i, -1)}
                    onMoveDown={() => moveInColumn(colLeads, i, 1)}
                    canMoveUp={i > 0}
                    canMoveDown={i < colLeads.length - 1}
                  />
                </DraggableCard>
              ))}
              {onAdd && <button type="button" style={addBtn} onClick={onAdd} title="إضافة فرصة في هذه المرحلة">+ إضافة فرصة</button>}
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

      {expanded && (
        <StageExpand
          stage={expanded}
          leads={leads.filter((l) => l.stage === expanded.key)}
          onOpen={(l) => { setExpanded(null); onOpen(l); }}
          onClose={() => setExpanded(null)}
        />
      )}
    </DndContext>
  );
}

// زر «+ إضافة فرصة» أسفل العمود — طبق أصل .pipe-add-btn في المرجع.
const addBtn: CSSProperties = { width: '100%', padding: '9px 12px', background: 'transparent', border: '1.5px dashed #CBD5E1', borderRadius: '8px', color: '#94A3B8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginTop: '2px' };
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '14px', scrollbarWidth: 'thin', scrollbarColor: '#274A78 #E4EAF1' };
const column: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '9px', minHeight: '140px', flex: '1 1 268px', minWidth: '268px', transition: 'background 0.15s ease, outline 0.15s ease' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
// رأس المرحلة ككارت أبيض واضح: نقطة لون + العنوان + العدّاد + الإجمالي + زر الطيّ.
const colHeader: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const colDot: CSSProperties = { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 };
const collapseBtn: CSSProperties = { background: '#F2F5F9', border: '1px solid #E4E8EF', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', color: '#5A6478', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
// الشريط المطويّ: عمود رفيع عمودي يظهر العدد + اسم المرحلة رأسيًا + سهم توسيع.
const collapsedCol: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px 6px', minHeight: '140px', width: '46px', flex: '0 0 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.15s ease, outline 0.15s ease' };
const collapsedCount: CSSProperties = { fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' };
const collapsedLabel: CSSProperties = { writingMode: 'vertical-rl', fontWeight: 700, fontSize: '12.5px', whiteSpace: 'nowrap', flex: 1 };
// وضع التكبير: نافذة كبيرة بشبكة كروت (auto-fill) لسهولة مراجعة عدد كبير.
const expandOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'grid', placeItems: 'center', zIndex: 80, padding: '24px' };
const expandPanel: CSSProperties = { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '1200px', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const expandHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 22px', borderBottom: '1px solid #EEF2F7' };
const expandClose: CSSProperties = { background: 'none', border: 'none', fontSize: '28px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
const expandGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', padding: '20px 22px', overflowY: 'auto', alignContent: 'start' };
