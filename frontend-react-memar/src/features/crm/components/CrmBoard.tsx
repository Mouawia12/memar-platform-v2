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
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useStaffAvatars } from '../../users/hooks/useUsers';
import { LeadCard } from './LeadCard';
import { isStageCollapsed, setStageCollapsed, useCollapsedStages, useHiddenStages } from '../boardPrefs';
import { cardStateOf } from '../types';
import type { Lead, PipelineStage, Stage } from '../types';

interface Props {
  leads: Lead[];
  /** فتح خيط توجيه الإدارة على الفرصة (طلب أيمن 2026-09-13). */
  onDirective?: (l: Lead) => void;
  stages: PipelineStage[];
  onMove: (l: Lead, stage: Stage) => void;
  onOpen: (l: Lead) => void;
  /** إعادة ترتيب عمود: قائمة المعرّفات بالترتيب الجديد (طلب أيمن 2026-08-15). */
  onReorder: (orderedIds: number[]) => void;
  /** زر «+ إضافة فرصة» أسفل كل عمود — يظهر لمن يملك crm.manage (طبق أصل المرجع). */
  onAdd?: () => void;
  /** معرّف المستخدم الحالي — لتمييز فرصه وسط فرص الفريق (طلب أيمن 2026-08-31). */
  meId?: number | null;
  /** تمييز فرصي (عند عرض «جميع الفرص») — في «فرصي فقط» كلّها لي فلا مقارنة. */
  highlightMine?: boolean;
  /** الفرصة التي أُغلقت نافذتها للتوّ — يُبرَز كرتها لحظات. */
  justSeenId?: number | null;
  /** إظهار إجمالي قيمة العمود — يُخفى عن الموظفين حسب «خصوصية الأرقام المالية». */
  showTotals?: boolean;
}

const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

// منطقة التمرير التلقائي عند حافّتي اللوحة (بكسل)، ومقدار الخطوة في كل إطار.
const EDGE_ZONE = 96;
const EDGE_SLACK = 40;   // يبقى التمرير عاملًا لو تجاوز المؤشّر الحافة قليلًا
const EDGE_MIN_STEP = 6;
const EDGE_MAX_STEP = 26;
// المحور الرأسي داخل العمود: منطقة أضيق وخطوة أهدأ لأن العمود أقصر من عرض اللوحة.
const EDGE_ZONE_Y = 64;
const EDGE_MIN_STEP_Y = 4;
const EDGE_MAX_STEP_Y = 18;

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
function CollapsedColumn({ stage, count, total, showTotals }: { stage: PipelineStage; count: number; total: number; showTotals: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div
      ref={setNodeRef}
      onClick={() => setStageCollapsed(stage.key, false)}
      title={`توسيع «${stage.label}» — ${count} فرصة${showTotals && total > 0 ? ` · ${money(total)}` : ''}`}
      style={{ ...collapsedCol, ...(isOver ? columnOver : null) }}
    >
      {/* رأس مطابق لرأس العمود المفتوح (بطاقة بيضاء بخطّ ملوّن) كي يبدأ الخطّ
          الملوّن عند المستوى نفسه في الحالتين (طلب أيمن 2026-08-24). */}
      <div style={{ ...collapsedHead, borderTop: `3px solid ${stage.color}` }}>
        <span style={{ ...collapsedCount, color: stage.color }}>{count}</span>
      </div>
      <span style={{ ...collapsedLabel, color: stage.color }}>{stage.label}</span>
      <span style={{ fontSize: '13px', color: stage.color, paddingBottom: '4px' }}>⟨</span>
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
  /** إجمالي فرص المرحلة قبل فلترة الفترة — لإظهار «عرض N من M» عند التكبير. */
  totalCount: number;
  /** إظهار القيمة المالية للعمود. */
  showTotals: boolean;
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
function BoardColumn({ stage, count, totalCount, total, showTotals, colLeads, isMax, hot, range, onRange, onZoom, onCollapse, onEnter, onLeave, registerBody, onScroll, renderCards }: ColumnProps) {
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
          {showTotals && total > 0 && <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A93A3', marginTop: '1px' }}>{money(total)}</div>}
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
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: count < totalCount ? '#B45309' : '#5A6478' }}>
              عرض {count} من {totalCount}{count < totalCount ? ` — أُخفي ${totalCount - count}` : ''}
            </span>
          </div>
        )}
        {renderCards(stage, colLeads)}
      </div>
    </div>
  );
}

export function CrmBoard({ leads, stages, onMove, onOpen, onReorder, onAdd, justSeenId, showTotals = true, meId, highlightMine, onDirective }: Props) {
  const [active, setActive] = useState<Lead | null>(null);
  /** العمود المكبّر بكامل العرض (⛶) — طبق أصل ops-col-full. */
  const [maxStage, setMaxStage] = useState<string | null>(null);
  /** فلترة فترة العمود المكبّر. */
  const [range, setRange] = useState<string>('all');
  /** العمود «الساخن» (يتوسّع عند مرور الماوس) — طبق أصل ops-col-hot. */
  const [hotStage, setHotStage] = useState<string | null>(null);
  const [arrowOff, setArrowOff] = useState({ prev: true, next: true, up: true, down: true });

  // صور أصحاب الفرص: طلب واحد لكل اللوحة (لا صورة داخل كل فرصة).
  // المكلّفون والناقلون معًا — طلب واحد يغطّي كل الصور المعروضة على اللوحة.
  const ownerIds = useMemo(
    () => [...new Set(leads.flatMap((l) => [l.owner?.id, l.mover?.id]).filter((v): v is number => !!v))],
    [leads],
  );
  const { data: avatars } = useStaffAvatars(ownerIds);

  const boardRef = useRef<HTMLDivElement>(null);
  const bodyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }));
  const collapsedMap = useCollapsedStages();
  const hiddenMap = useHiddenStages();
  // memo: مرجع ثابت ما لم تتغيّر المراحل/المخفية — يمنع إعادة إنشاء activeBody/syncArrows كل رندر.
  const visibleStages = useMemo(() => stages.filter((s) => !hiddenMap[s.key]), [stages, hiddenMap]);
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
    // تحديث مشروط: يعيد نفس المرجع عند عدم التغيّر فيتخطّى React الرندر — يمنع حلقة إعادة الرندر اللانهائية.
    setArrowOff((prev) => {
      const next = {
        next: maxX <= 6 || posX >= maxX - 6,
        prev: maxX <= 6 || posX <= 6,
        up: maxY <= 6 || posY <= 6,
        down: maxY <= 6 || posY >= maxY - 6,
      };

      return prev.next === next.next && prev.prev === next.prev && prev.up === next.up && prev.down === next.down ? prev : next;
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

  /**
   * تمرير تلقائي عند اقتراب المؤشّر من الحواف (طلب أيمن 2026-08-22):
   *  • أفقيًا — حافّتا اللوحة تحرّكان الأعمدة يمينًا/يسارًا.
   *  • رأسيًا — أعلى/أسفل العمود الذي يقف فوقه المؤشّر يحرّك قائمة فرصه.
   * كلما اقترب المؤشّر من الحافة زادت السرعة. الاستماع على window ليعمل أثناء
   * سحب الكرت أيضًا (طبقة السحب تلتقط أحداث المؤشّر فلا تصل للعناصر تحتها).
   */
  const edgeStep = useRef(0);
  const edgeTimer = useRef<number | null>(null);
  const vStep = useRef(0);
  const vTarget = useRef<HTMLDivElement | null>(null);
  const vTimer = useRef<number | null>(null);

  useEffect(() => {
    const stopH = () => {
      edgeStep.current = 0;
      if (edgeTimer.current) { window.clearInterval(edgeTimer.current); edgeTimer.current = null; }
    };
    const stopV = () => {
      vStep.current = 0;
      vTarget.current = null;
      if (vTimer.current) { window.clearInterval(vTimer.current); vTimer.current = null; }
    };
    const stopAll = () => { stopH(); stopV(); };

    /** الاتجاه والسرعة من بُعد المؤشّر عن حافّتين متقابلتين. */
    const edgeVelocity = (fromStart: number, fromEnd: number, zone: number, min: number, max: number) => {
      if (fromStart > -EDGE_SLACK && fromStart < zone) {
        return -(min + (1 - Math.max(0, fromStart) / zone) * (max - min));
      }
      if (fromEnd > -EDGE_SLACK && fromEnd < zone) {
        return min + (1 - Math.max(0, fromEnd) / zone) * (max - min);
      }
      return 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const b = boardRef.current;
      if (!b) { stopAll(); return; }
      const r = b.getBoundingClientRect();
      const insideBoard = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left - EDGE_SLACK && e.clientX <= r.right + EDGE_SLACK;
      if (!insideBoard) { stopAll(); return; }

      // ── أفقي: حافّتا اللوحة (معطَّل في وضع العمود المكبَّر لأنه يملأ العرض) ──
      const hv = maxStage ? 0 : edgeVelocity(e.clientX - r.left, r.right - e.clientX, EDGE_ZONE, EDGE_MIN_STEP, EDGE_MAX_STEP);
      if (hv === 0) stopH();
      else {
        // scrollBy أفقي فيزيائي — يعمل في RTL وLTR سواء (لا يحتاج قلب الاتجاه).
        edgeStep.current = hv;
        if (!edgeTimer.current) {
          // onScroll على اللوحة يحدّث الأسهم تلقائيًا، فلا نستدعي syncArrows هنا.
          edgeTimer.current = window.setInterval(() => {
            const el = boardRef.current;
            if (el && edgeStep.current !== 0) el.scrollBy({ left: edgeStep.current });
          }, 16);
        }
      }

      // ── رأسي: جسم العمود الذي يقف فوقه المؤشّر، وفقط إن كان قابلًا للتمرير ──
      const body = Object.values(bodyRefs.current).find((el) => {
        if (!el) return false;
        const q = el.getBoundingClientRect();
        return e.clientX >= q.left && e.clientX <= q.right && e.clientY >= q.top && e.clientY <= q.bottom;
      });
      if (!body || body.scrollHeight - body.clientHeight <= 8) { stopV(); return; }

      const q = body.getBoundingClientRect();
      const vv = edgeVelocity(e.clientY - q.top, q.bottom - e.clientY, EDGE_ZONE_Y, EDGE_MIN_STEP_Y, EDGE_MAX_STEP_Y);
      if (vv === 0) { stopV(); return; }
      vStep.current = vv;
      vTarget.current = body;
      if (!vTimer.current) {
        vTimer.current = window.setInterval(() => {
          const el = vTarget.current;
          if (el && vStep.current !== 0) el.scrollBy({ top: vStep.current });
        }, 16);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', stopAll);
    window.addEventListener('blur', stopAll);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', stopAll);
      window.removeEventListener('blur', stopAll);
      stopAll();
    };
  }, [maxStage]);

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
  /*
   * لا نميّز إن كان المعروض فرصي وحدها (كلّها لي فلا مقارنة)، ولا إن لم تكن لي
   * فرصة في المعروض أصلًا — وإلا بدت اللوحة كلّها باهتة بلا فائدة.
   */
  const markMine = !!highlightMine && !!meId && leads.some((l) => l.owner?.id === meId);

  const renderCards = (stage: PipelineStage, colLeads: Lead[]) => (
    <>
      {colLeads.length === 0 && (
        <p style={{ gridColumn: '1 / -1', opacity: 0.45, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
          {maxStage === stage.key && leads.some((l) => l.stage === stage.key) ? 'لا فرص ضمن الفترة المختارة' : 'أفلت هنا'}
        </p>
      )}
      {colLeads.map((lead, i) => (
        <DragCard key={lead.id} lead={lead}>
          <LeadCard
            lead={lead}
            onOpen={onOpen}
            stageColor={stage.color}
            mine={markMine && lead.owner?.id === meId}
            avatarUrl={lead.owner ? avatars?.[String(lead.owner.id)] ?? null : null}
            justSeen={justSeenId === lead.id}
            moverFromLabel={lead.mover?.from ? stages.find((s) => s.key === lead.mover!.from)?.label ?? lead.mover.from : null}
            moverAvatarUrl={lead.mover ? avatars?.[String(lead.mover.id)] ?? null : null}
            onMoveUp={() => moveInColumn(colLeads, i, -1)}
            onMoveDown={() => moveInColumn(colLeads, i, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < colLeads.length - 1}
            onDirective={onDirective}
          />
        </DragCard>
      ))}
      {onAdd && <button type="button" className="crm-add-btn" style={addBtn} onClick={onAdd} title="إضافة فرصة في هذه المرحلة">+ إضافة فرصة</button>}
    </>
  );

  /*
   * شريط حالة التوجيهات فوق اللوحة (طلب أيمن 2026-09-13): كم فرصة تنتظر ردًّا،
   * وكم رُدَّ عليها، وكم بلا توجيه — فتُقرأ حال اللوحة قبل قراءة بطاقاتها.
   */
  const tally = useMemo(() => {
    const counts = { awaiting: 0, needs_update: 0, replied: 0, none: 0 };
    // نفس أولوية ألوان البطاقة حرفًا بحرف — وإلا خالف الشريطُ ما تراه العين
    leads.forEach((l) => { counts[cardStateOf(l) ?? 'none']++; });

    return counts;
  }, [leads]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="crm-board-shell">
        {leads.length > 0 && (
          <div style={tallyRow}>
            {tally.awaiting > 0 && (
              <span style={{ ...tallyChip, color: '#C0392B', background: '#FDECEA', borderColor: '#F3B5AE' }} title="الإدارة كتبت توجيهًا ولم يُردّ عليه بعد">
                بانتظار الرد: {tally.awaiting}
              </span>
            )}
            {tally.needs_update > 0 && (
              <span style={{ ...tallyChip, color: '#A5710F', background: '#FDF3E0', borderColor: '#F0CE90' }} title="حان موعد التواصل معها — مطلوب تحديث">
                مطلوب تحديث: {tally.needs_update}
              </span>
            )}
            {tally.replied > 0 && (
              <span style={{ ...tallyChip, color: '#067A4B', background: '#E7F8EF', borderColor: '#A7E3C4' }} title="رُدَّ على آخر توجيه من الإدارة">
                تم الرد: {tally.replied}
              </span>
            )}
            <span style={{ ...tallyChip, color: '#7A8394', background: '#F4F6F9', borderColor: '#E2E7EF' }} title="لا توجيه عليها ولا تواصلٌ مستحقّ">
              بدون تحديث: {tally.none}
            </span>
          </div>
        )}
        <div className={`crm-hscroll${maxStage ? ' crm-board-full' : ''}`} ref={boardRef} style={{ ...board, ...(maxStage ? { overflowX: 'hidden' } : null) }} onScroll={syncArrows}>
          {(maxStage ? visibleStages.filter((s) => s.key === maxStage) : visibleStages).map((stage) => {
            const all = leads.filter((l) => l.stage === stage.key);
            const isMax = maxStage === stage.key;
            const colLeads = isMax ? all.filter((l) => inRange(l.created_at, range)) : all;
            const total = all.reduce((sum, l) => sum + Number(l.deal_value_kwd), 0);

            if (!isMax && isStageCollapsed(collapsedMap, stage.key, stage.is_lost)) {
              return <CollapsedColumn key={stage.key} stage={stage} count={all.length} total={total} showTotals={showTotals} />;
            }
            return (
              <BoardColumn
                key={stage.key}
                stage={stage}
                count={colLeads.length}
                totalCount={all.length}
                total={total}
                showTotals={showTotals}
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
            <LeadCard lead={active} onOpen={() => {}} stageColor={colorOf(active.stage)} avatarUrl={active.owner ? avatars?.[String(active.owner.id)] ?? null : null} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// زر «+ إضافة فرصة» أسفل العمود — طبق أصل .pipe-add-btn في المرجع.
const addBtn: CSSProperties = { width: '100%', padding: '9px 12px', background: 'transparent', border: '1.5px dashed #CBD5E1', borderRadius: '8px', color: '#94A3B8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', marginTop: '2px' };
// اللوحة: صفّ أعمدة بتمرير أفقي، ارتفاع ثابت وكل عمود يمرّر داخليًا (طبق أصل .crm-pipeline).
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
// عمود بارتفاع ثابت (يمرّر داخليًا) — طبق أصل .pipe-col (max-height calc(100vh - 320px)).
const column: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#F0F4F8', borderRadius: '10px', padding: '9px', maxHeight: 'calc(100vh - 300px)', flex: '0 0 340px', width: '340px', minWidth: '340px', border: '1px solid transparent' };
const colFull: CSSProperties = { flex: '1 1 100%', width: '100%', minWidth: '100%', maxHeight: 'calc(100vh - 300px)' };
const colBody: CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0', paddingInlineEnd: '2px', minHeight: '60px' };
const columnOver: CSSProperties = { background: '#DCE7F3', outline: '2px dashed #274A78' };
const colHeader: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 };
const colDot: CSSProperties = { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 };
const collapseBtn: CSSProperties = { background: '#F2F5F9', border: '1px solid #E4E8EF', borderRadius: '6px', width: '24px', height: '24px', cursor: 'pointer', color: '#5A6478', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
// الحشو 9px كالعمود المفتوح تمامًا، فيتطابق مستوى الرأس في الحالتين.
const collapsedCol: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '9px 6px', minHeight: '140px', width: '46px', flex: '0 0 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid transparent', transition: 'background 0.15s ease, outline 0.15s ease' };
const collapsedHead: CSSProperties = { background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '6px 2px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 };
const collapsedCount: CSSProperties = { fontSize: '13px', fontWeight: 800, minWidth: '20px', textAlign: 'center' };
const collapsedLabel: CSSProperties = { writingMode: 'vertical-rl', fontWeight: 700, fontSize: '12.5px', whiteSpace: 'nowrap', flex: 1 };

/** شريط حالة التوجيهات فوق اللوحة — أرقامٌ تُقرأ قبل البطاقات. */
const tallyRow: CSSProperties = { display: 'flex', gap: '7px', flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: '10px' };
const tallyChip: CSSProperties = { fontSize: '11.5px', fontWeight: 800, borderRadius: '20px', padding: '4px 12px', border: '1px solid', whiteSpace: 'nowrap' };
