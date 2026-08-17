import {
  closestCenter,
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
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

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

/** فلترة الفترة داخل العمود المكبّر — طبق أصل OPS_RANGES + opsInRange. */
const RANGES: { key: string; label: string }[] = [
  { key: 'all', label: 'الكل' }, { key: 'day', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' }, { key: 'month', label: 'هذا الشهر' }, { key: 'year', label: 'هذه السنة' },
];
const RANGE_LIMIT: Record<string, number> = { day: 0, week: 6, month: 29, year: 364 };
const inRange = (dateStr: string | null, range: string) => {
  if (range === 'all') return true;
  if (!dateStr) return false;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 864e5);
  return days >= 0 && days <= (RANGE_LIMIT[range] ?? 0);
};

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

/** بطاقة قابلة للسحب وللإفلات عليها معًا: الإفلات على بطاقة أخرى يعيد الترتيب داخل العمود
 *  (أو ينقل المرحلة عبر الأعمدة) — طلب أيمن 2026-08-17: نقل الكروت أعلى/أسفل بالسحب. */
function DragCard({ lead, children }: { lead: Lead; children: ReactNode }) {
  const { attributes, listeners, setNodeRef: setDrag, isDragging } = useDraggable({ id: lead.id });
  const { setNodeRef: setDrop, isOver } = useDroppable({ id: lead.id });
  const ref = (node: HTMLElement | null) => { setDrag(node); setDrop(node); };
  return (
    <div
      ref={ref}
      {...attributes}
      {...listeners}
      className={isDragging ? 'crm-dragging' : isOver ? 'crm-drop-active' : ''}
      style={{ cursor: 'grab', touchAction: 'pan-x pan-y', borderRadius: '10px', transition: 'outline .12s ease' }}
    >
      {children}
    </div>
  );
}

interface ColumnProps {
  stage: PipelineStage;
  count: number;
  total: number;
  colLeads: Lead[];
  isMax: boolean;
  hot: boolean;
  range: string;
  onRange: (v: string) => void;
  onZoom: () => void;
  onCollapse: () => void;
  onEnter: () => void;
  onLeave: () => void;
  registerBody: (key: string, el: HTMLDivElement | null) => void;
  onScroll: () => void;
  renderCards: (stage: PipelineStage, colLeads: Lead[]) => ReactNode;
}

/** عمود اللوحة (ثابت الهوية) — رأس + جسم قابل للإفلات وللتمرير الداخلي + زر تكبير ⛶ وطيّ. */
function BoardColumn({ stage, count, total, colLeads, isMax, hot, range, onRange, onZoom, onCollapse, onEnter, onLeave, registerBody, onScroll, renderCards }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const setBody = (el: HTMLDivElement | null) => { setNodeRef(el); registerBody(stage.key, el); };
  return (
    <div
      className={`crm-pipe-col${isMax ? ' crm-col-full' : ''}${hot ? ' crm-col-hot' : ''}`}
      style={{ ...column, ...(isMax ? colFull : null), ...(isOver ? columnOver : null) }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div style={{ ...colHeader, borderTop: `3px solid ${stage.color}` }}>
        <span style={{ ...colDot, background: stage.color }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#1A1F2E' }}>
            {stage.label} <span style={{ color: stage.color, fontWeight: 700 }}>({count})</span>
          </div>
          {total > 0 && <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A93A3', marginTop: '1px' }}>{money(total)}</div>}
        </div>
        <button type="button" className="crm-col-zoom" title="تكبير العمود بكامل الصفحة" onClick={onZoom}>{isMax ? '⤡' : '⛶'}</button>
        {!isMax && <button type="button" onClick={onCollapse} title="طيّ العمود" style={collapseBtn}>⟩</button>}
      </div>
      <div ref={setBody} className="crm-col-body" style={colBody} onScroll={onScroll}>
        {isMax && (
          <div className="crm-range-bar">
            <span>📅 الفترة:</span>
            <select className="crm-range-select" value={range} onChange={(e) => onRange(e.target.value)}>
              {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={onZoom}>↩ تصغير</button>
          </div>
        )}
        {renderCards(stage, colLeads)}
      </div>
    </div>
  );
}

export function CrmBoard({ leads, stages, onMove, onOpen, onReorder, onAdd }: Props) {
  const [active, setActive] = useState<Lead | null>(null);
  /** العمود المكبّر بكامل العرض (⛶) — طبق أصل ops-col-full. */
  const [maxStage, setMaxStage] = useState<string | null>(null);
  /** فلترة فترة العمود المكبّر. */
  const [range, setRange] = useState<string>('all');
  /** العمود «الساخن» (يتوسّع عند مرور الماوس) — طبق أصل ops-col-hot. */
  const [hotStage, setHotStage] = useState<string | null>(null);
  const [arrowOff, setArrowOff] = useState({ prev: true, next: true, up: true, down: true });

  const boardRef = useRef<HTMLDivElement>(null);
  const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));
  const collapsedMap = useCollapsedStages();
  const hiddenMap = useHiddenStages();
  const visibleStages = stages.filter((s) => !hiddenMap[s.key]);
  const stageKeys = new Set(stages.map((s) => s.key));
  const colorOf = (key: string) => stages.find((s) => s.key === key)?.color;

  /** جسم العمود النشط للتنقّل العمودي: المكبّر ثم الساخن ثم الأول. */
  const activeBody = useCallback((): HTMLDivElement | null => {
    if (maxStage && bodyRefs.current[maxStage]) return bodyRefs.current[maxStage];
    if (hotStage && bodyRefs.current[hotStage]) return bodyRefs.current[hotStage];
    const first = visibleStages.find((s) => !isStageCollapsed(collapsedMap, s.key, s.is_lost));
    return first ? bodyRefs.current[first.key] ?? null : null;
  }, [maxStage, hotStage, visibleStages, collapsedMap]);

  /** حساب حالة الأسهم الأربعة (طبق أصل opsSyncArrows). */
  const syncArrows = useCallback(() => {
    const b = boardRef.current;
    if (!b) return;
    const maxX = b.scrollWidth - b.clientWidth;
    const posX = Math.abs(b.scrollLeft);
    const body = activeBody();
    const maxY = body ? body.scrollHeight - body.clientHeight : 0;
    const posY = body ? body.scrollTop : 0;
    setArrowOff({
      next: maxX <= 6 || posX >= maxX - 6,
      prev: maxX <= 6 || posX <= 6,
      up: maxY <= 6 || posY <= 6,
      down: maxY <= 6 || posY >= maxY - 6,
    });
  }, [activeBody]);

  useEffect(() => {
    syncArrows();
    const onResize = () => syncArrows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncArrows, leads, maxStage, hotStage]);

  /** تنقّل بأربع اتجاهات بالنقر (طبق أصل opsScrollBoard). */
  const scrollBoard = (dir: 'prev' | 'next' | 'up' | 'down') => {
    if (dir === 'up' || dir === 'down') {
      activeBody()?.scrollBy({ top: 260 * (dir === 'down' ? 1 : -1), behavior: 'smooth' });
      setTimeout(syncArrows, 420);
      return;
    }
    const b = boardRef.current;
    if (!b) return;
    const rtl = getComputedStyle(b).direction === 'rtl';
    const step = 330 * (dir === 'next' ? 1 : -1) * (rtl ? -1 : 1);
    b.scrollBy({ left: step, behavior: 'smooth' });
    setTimeout(syncArrows, 420);
  };

  /** تمرير مستمرّ أثناء المرور على السهم (طلب العميل: التحويم يحرّك اللوحة). */
  const hoverRef = useRef<number | null>(null);
  const hoverStep = (dir: 'prev' | 'next' | 'up' | 'down') => {
    if (dir === 'up' || dir === 'down') { activeBody()?.scrollBy({ top: 60 * (dir === 'down' ? 1 : -1) }); return; }
    const b = boardRef.current;
    if (!b) return;
    const rtl = getComputedStyle(b).direction === 'rtl';
    b.scrollBy({ left: 70 * (dir === 'next' ? 1 : -1) * (rtl ? -1 : 1) });
  };
  const startHoverScroll = (dir: 'prev' | 'next' | 'up' | 'down') => {
    if (hoverRef.current) window.clearInterval(hoverRef.current);
    hoverStep(dir);
    hoverRef.current = window.setInterval(() => hoverStep(dir), 130);
  };
  const stopHoverScroll = () => {
    if (hoverRef.current) { window.clearInterval(hoverRef.current); hoverRef.current = null; }
  };
  useEffect(() => () => { if (hoverRef.current) window.clearInterval(hoverRef.current); }, []);

  const moveInColumn = (colLeads: Lead[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= colLeads.length) return;
    const ids = colLeads.map((l) => l.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  };

  const handleDragStart = (e: DragStartEvent) => setActive(leads.find((l) => l.id === e.active.id) ?? null);
  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { active: a, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l.id === a.id);
    if (!lead) return;
    const overId = over.id;
    if (typeof overId === 'string' && stageKeys.has(overId)) {
      if (lead.stage !== overId) onMove(lead, overId);
      return;
    }
    if (typeof overId === 'number' && overId !== lead.id) {
      const overLead = leads.find((l) => l.id === overId);
      if (!overLead) return;
      if (overLead.stage === lead.stage) {
        const colIds = leads.filter((l) => l.stage === lead.stage).map((l) => l.id);
        const from = colIds.indexOf(lead.id);
        const to = colIds.indexOf(overLead.id);
        if (from === -1 || to === -1 || from === to) return;
        colIds.splice(from, 1);
        colIds.splice(to, 0, lead.id);
        onReorder(colIds);
      } else {
        onMove(lead, overLead.stage);
      }
    }
  };

  /** بطاقات العمود (تُستخدم في الوضع العادي والمكبّر). */
  const renderCards = (stage: PipelineStage, colLeads: Lead[]) => (
    <>
      {colLeads.length === 0 && <p style={{ opacity: 0.4, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>أفلت هنا</p>}
      {colLeads.map((lead, i) => (
        <DragCard key={lead.id} lead={lead}>
          <LeadCard
            lead={lead}
            onOpen={onOpen}
            stageColor={stage.color}
            onMoveUp={() => moveInColumn(colLeads, i, -1)}
            onMoveDown={() => moveInColumn(colLeads, i, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < colLeads.length - 1}
          />
        </DragCard>
      ))}
      {onAdd && <button type="button" className="crm-add-btn" style={addBtn} onClick={onAdd} title="إضافة فرصة في هذه المرحلة">+ إضافة فرصة</button>}
    </>
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="crm-board-shell">
        <div className={`crm-hscroll${maxStage ? ' crm-board-full' : ''}`} ref={boardRef} style={{ ...board, ...(maxStage ? { overflowX: 'hidden' } : null) }} onScroll={syncArrows}>
          {(maxStage ? visibleStages.filter((s) => s.key === maxStage) : visibleStages).map((stage) => {
            const all = leads.filter((l) => l.stage === stage.key);
            const isMax = maxStage === stage.key;
            const colLeads = isMax ? all.filter((l) => inRange(l.created_at, range)) : all;
            const total = all.reduce((sum, l) => sum + Number(l.deal_value_kwd), 0);

            if (!isMax && isStageCollapsed(collapsedMap, stage.key, stage.is_lost)) {
              return <CollapsedColumn key={stage.key} stage={stage} count={all.length} total={total} />;
            }
            return (
              <BoardColumn
                key={stage.key}
                stage={stage}
                count={all.length}
                total={total}
                colLeads={colLeads}
                isMax={isMax}
                hot={!maxStage && !active && hotStage === stage.key}
                range={range}
                onRange={setRange}
                onZoom={() => { setMaxStage(isMax ? null : stage.key); setRange('all'); }}
                onCollapse={() => setStageCollapsed(stage.key, true)}
                onEnter={() => { if (!maxStage && !active) setHotStage(stage.key); }}
                onLeave={() => setHotStage((h) => (h === stage.key ? null : h))}
                registerBody={(k, el) => { bodyRefs.current[k] = el; }}
                onScroll={syncArrows}
                renderCards={renderCards}
              />
            );
          })}
        </div>

        {/* أسهم التنقّل الأربعة — تعمل بالنقر وبالمرور (hover) — طبق أصل ops-nav-arrow */}
        {!maxStage && (
          <>
            <button type="button" className={`crm-nav-arrow crm-nav-next${arrowOff.next ? ' crm-nav-off' : ''}`} title="الأعمدة المخفية يساراً" onClick={() => scrollBoard('next')} onMouseEnter={() => startHoverScroll('next')} onMouseLeave={stopHoverScroll}>‹</button>
            <button type="button" className={`crm-nav-arrow crm-nav-prev${arrowOff.prev ? ' crm-nav-off' : ''}`} title="الأعمدة المخفية يميناً" onClick={() => scrollBoard('prev')} onMouseEnter={() => startHoverScroll('prev')} onMouseLeave={stopHoverScroll}>›</button>
          </>
        )}
        <button type="button" className={`crm-nav-arrow crm-nav-up${arrowOff.up ? ' crm-nav-off' : ''}`} title="أعلى العمود النشط" onClick={() => scrollBoard('up')} onMouseEnter={() => startHoverScroll('up')} onMouseLeave={stopHoverScroll}>⌃</button>
        <button type="button" className={`crm-nav-arrow crm-nav-down${arrowOff.down ? ' crm-nav-off' : ''}`} title="أسفل العمود النشط" onClick={() => scrollBoard('down')} onMouseEnter={() => startHoverScroll('down')} onMouseLeave={stopHoverScroll}>⌄</button>
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

// زر «+ إضافة فرصة» أسفل العمود — طبق أصل .pipe-add-btn في المرجع.
const addBtn: CSSProperties = { width: '100%', padding: '9px 12px', background: 'transparent', border: '1.5px dashed #CBD5E1', borderRadius: '8px', color: '#94A3B8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginTop: '2px' };
// اللوحة: صفّ أعمدة بتمرير أفقي، ارتفاع ثابت وكل عمود يمرّر داخليًا (طبق أصل .crm-pipeline).
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '14px', scrollbarWidth: 'thin', scrollbarColor: '#274A78 #E4EAF1' };
// عمود بارتفاع ثابت (يمرّر داخليًا) — طبق أصل .pipe-col (max-height calc(100vh - 320px)).
const column: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#F0F4F8', borderRadius: '10px', padding: '9px', maxHeight: 'calc(100vh - 300px)', flex: '0 0 340px', width: '340px', minWidth: '340px', border: '1px solid transparent' };
const colFull: CSSProperties = { flex: '1 1 100%', width: '100%', minWidth: '100%', maxHeight: 'calc(100vh - 300px)' };
const colBody: CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0', paddingInlineEnd: '2px', minHeight: '60px' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const colHeader: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 };
const colDot: CSSProperties = { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 };
const collapseBtn: CSSProperties = { background: '#F2F5F9', border: '1px solid #E4E8EF', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', color: '#5A6478', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
const collapsedCol: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '10px 6px', minHeight: '140px', width: '46px', flex: '0 0 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.15s ease, outline 0.15s ease' };
const collapsedCount: CSSProperties = { fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' };
const collapsedLabel: CSSProperties = { writingMode: 'vertical-rl', fontWeight: 700, fontSize: '12.5px', whiteSpace: 'nowrap', flex: 1 };
