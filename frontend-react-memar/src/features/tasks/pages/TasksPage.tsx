import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { useProjects } from '../../projects/hooks/useProjects';
import { ClientFollowUpsBoard } from '../components/ClientFollowUpsBoard';
import { DateRangeFilter, EMPTY_RANGE, inRange, type DateRange } from '../components/DateRangeFilter';
import { FollowUpFormModal } from '../components/FollowUpFormModal';
import { TaskStatusBoard } from '../components/TaskStatusBoard';
import { useFollowUps } from '../hooks/useFollowUps';
import { useTaskAlertAcks } from '../taskAlerts';
import { TaskDetailModal } from '../components/TaskDetailModal';
import type { CardRef } from '../hooks/useCardActivity';
import type { FollowUp } from '../api/followUpsApi';
import { DirectiveModal } from '../components/DirectiveModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { useDeleteTask, useMoveTask, useTasks, useToggleTask, useUpdateProgress, useWorkload } from '../hooks/useTasks';
import { isDone, taskColumn, type Task, type TaskStatus } from '../types';

/**
 * المهام والمتابعة — لوحة استحقاق بأربعة أعمدة (متأخرة/اليوم/قادمة/مكتملة)،
 * طبق الأصل: سحب لتغيير الحالة، فلاتر فترة لكل عمود، ومؤشرات KPI.
 */
export function TasksPage() {
  const canManage = usePermission('tasks.manage'); // إضافة/تعديل المهام (بوّابة الصلاحيات — طلب أيمن 2026-08-12)
  const canDelete = usePermission('tasks.delete'); // الحذف للإدارة فقط (طلب العميل — اجتماع 3)
  // المتابعة تذكيرٌ على عميل، فإضافتها تتبع صلاحية CRM لا صلاحية المهام.
  const canAddFollowUp = usePermission('crm.manage');
  // إرسال توجيه على متابعة للإدارة وحدها — نظير tasks.delete في المهام.
  const canSendFupDirective = usePermission('crm.delete');

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [confirming, setConfirming] = useState<Task | null>(null); // تأكيد الإكمال قبل النقل لـ«مكتملة»
  const [directiveOf, setDirectiveOf] = useState<Task | null>(null); // نافذة توجيهات الإدارة (طلب أيمن 2026-08-29)
  const [fupFormOpen, setFupFormOpen] = useState(false); // نافذة «متابعة جديدة» (طلب أيمن 2026-08-29)
  /*
   * ثلاثة أوضاع بثلاثة أزرار دائمة الظهور (طلب أيمن 2026-08-31): ما يخصّني
   * وحده · الكلّ واضحًا · الكلّ مع تخفيت بطاقات غيري ليبرز ما يخصّني.
   */
  const [taskHighlight, setTaskHighlight] = useState(false);
  const [fupHighlight, setFupHighlight] = useState(false);
  const [fupDirectiveOf, setFupDirectiveOf] = useState<FollowUp | null>(null); // توجيهات متابعة
  // نطاق كل لوحة على حدة: الكل أو ما يخصّني (طلب أيمن 2026-08-24).
  // null = لم يختر المستخدم بعد، فيسري افتراض دوره أدناه. حفظُه كـ null لا كقيمة
  // محسوبة عند أول رسم يجعله يصحّ حتى لو وصلت الصلاحيات بعد الرسم الأول.
  const [taskScope, setTaskScope] = useState<'all' | 'mine' | null>(null);
  const [fupScope, setFupScope] = useState<'all' | 'mine' | null>(null);
  // فلتر التاريخ لكل لوحة على حدة (طلب أيمن 2026-08-26): المهام بتاريخ الاستحقاق، المتابعات بموعد التذكير.
  const [taskRange, setTaskRange] = useState<DateRange>(EMPTY_RANGE);
  const [fupRange, setFupRange] = useState<DateRange>(EMPTY_RANGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const meId = useAuthStore((st) => st.user?.id);
  // الجميع يفتحون الصفحة على «مهامي فقط» — الإدارة كذلك (طلب أيمن 2026-08-29،
  // يلغي التمييز حسب الدور الذي كان يفتح للإدارة على «الكل»). فمَن يفتح الصفحة
  // يبدأ بشغله هو، و«جميع المهام» بضغطة واحدة ومهامه فيها مميّزة. وترتيب الزرّين
  // يتبع ذلك: الافتراضي أوّلًا (يمينًا في RTL) والأشمل بعده.
  const defaultScope: 'all' | 'mine' = 'mine';
  const effTaskScope = taskScope ?? defaultScope;
  const effFupScope = fupScope ?? defaultScope;
  // إطفاء وميض التأخّر بطريقتين (طلب أيمن 2026-08-25): زرّ 🔕 على البطاقة،
  // أو فتح المهمة نفسها — فكلاهما يعني أن الموظف اطّلع على تأخّرها.
  const { isAcked, ack } = useTaskAlertAcks();
  const openTask = (t: Task) => { ack(t); setDetail(t); };

  const { data: tasks, isLoading, isError } = useTasks({ search: search || undefined, project_id: projectId === '' ? undefined : projectId });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: followUps } = useFollowUps(effFupScope === 'mine');
  // «توزيع المهام على الفريق» بيانات إدارية — للإدارة وحدها (طلب أيمن 2026-08-25).
  const { data: workload } = useWorkload(canDelete);
  const move = useMoveTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const progress = useUpdateProgress();

  const kpis = useMemo(() => {
    const list = tasks ?? [];
    const overdue = list.filter((t) => taskColumn(t) === 'overdue').length;
    const done = list.filter((t) => isDone(t)).length;

    return {
      total: list.length,
      inProgress: list.filter((t) => t.status === 'in_progress').length,
      overdue,
      done,
      donePct: list.length ? Math.round((done / list.length) * 100) : 0,
    };
  }, [tasks]);

  // اللوحة العليا تعرض المهام حسب النطاق المختار.
  const scopedTasks = useMemo(
    () => (effTaskScope === 'mine' ? (tasks ?? []).filter((t) => t.assignee?.id === meId) : (tasks ?? [])),
    [tasks, effTaskScope, meId],
  );
  const boardTasks = useMemo(() => scopedTasks.filter((t) => inRange(t.due_date, taskRange)), [scopedTasks, taskRange]);

  const scopedFollowUps = followUps ?? [];
  const boardFollowUps = useMemo(() => scopedFollowUps.filter((f) => inRange(f.remind_at, fupRange)), [scopedFollowUps, fupRange]);

  // إشارة البطاقة التي تفتحها النوافذ المشتركة (مهمة أو متابعة).
  const taskCard = (t: Task): CardRef => ({
    kind: 'task', id: t.id, code: `#TSK-${String(t.id).padStart(3, '0')}`, title: t.title,
    owner: t.assignee?.name ?? null, ownerLabel: 'المكلَّف',
  });
  const fupCard = (f: FollowUp): CardRef => ({
    kind: 'follow-up', id: f.id, code: `#FUP-${String(f.id).padStart(3, '0')}`, title: f.contact ?? 'عميل',
    owner: f.creator?.name ?? null, ownerLabel: 'صاحب المتابعة',
  });

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  // نغلق التفاصيل قبل فتح التعديل: نافذة التفاصيل أعلى منه طبقةً، فكانت تحجبه
  // ولا يظهر إلا بإغلاقها يدويًّا (طلب أيمن 2026-08-29).
  const openEdit = (t: Task) => { setDetail(null); setEditing(t); setFormOpen(true); };
  const handleDelete = (t: Task) => { if (confirm(`حذف مهمة "${t.title}"؟`)) del.mutate(t.id); };
  const handleMove = (t: Task, payload: { due_date?: string; status?: TaskStatus }) => move.mutate({ id: t.id, payload });
  // إكمال المهمة يتطلّب تأكيدًا (طلب العميل) — لا يُنقل مباشرة لـ«مكتملة». إعادة الفتح فورية.
  const handleToggle = (t: Task) => {
    if (!isDone(t)) { setConfirming(t); return; }
    toggle.mutate({ id: t.id, done: false });
  };
  const confirmComplete = () => {
    if (confirming) toggle.mutate({ id: confirming.id, done: true });
    setConfirming(null);
  };

  return (
    <div>
      {/* ══ القسم الأعلى: المهام ══ */}
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0, fontSize: '17px' }}>📋 إدارة المهام والمتابعة</h1>
          <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '3px' }}>لوحة كانبان لتتبع المهام وإدارة سير العمل</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ مهمة جديدة</button>}
          <button className="btn" type="button" onClick={() => setFiltersOpen((v) => !v)}>🔍 تصفية</button>
        </div>
      </div>

      {/* مؤشّرات المهام الأربعة */}
      <div style={kpiGrid}>
        <Kpi icon="📋" bg="#EBF5FF" label="إجمالي المهام" value={kpis.total} sub="هذا الشهر" />
        <Kpi icon="⏳" bg="#FFFBEB" label="قيد التنفيذ" value={kpis.inProgress} sub="نشطة حاليًا" />
        <Kpi icon="⚠️" bg="#FEF2F2" label="متأخرة" value={kpis.overdue} sub="تحتاج متابعة" />
        <Kpi icon="✅" bg="#ECFDF5" label="مكتملة" value={kpis.done} sub={<span style={{ color: '#2D9B6F', fontWeight: 800 }}>↑ {kpis.donePct}%</span>} />
      </div>

      {filtersOpen && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="بحث بعنوان المهمة…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px' }} />
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')} style={{ minWidth: '180px' }}>
            <option value="">كل المشاريع</option>
            {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <div style={hintLine}>💡 اسحب أي بطاقة وأفلتها في عمود آخر لتغيير مرحلتها، أو اضغط عليها لعرض التفاصيل الكاملة.</div>

      <div style={scopeRow}>
        <button type="button" onClick={() => setTaskScope('mine')} style={{ ...scopeBtn, ...(effTaskScope === 'mine' ? scopeOn : null) }}>مهامي فقط</button>
        <button type="button" onClick={() => { setTaskScope('all'); setTaskHighlight(false); }} style={{ ...scopeBtn, ...(effTaskScope === 'all' && !taskHighlight ? scopeOn : null) }}>جميع المهام</button>
        <button
          type="button"
          onClick={() => { setTaskScope('all'); setTaskHighlight(true); }}
          style={{ ...scopeBtn, ...(effTaskScope === 'all' && taskHighlight ? scopeOn : null) }}
          title="تظهر كل المهام، ومهام غيري تخفت ليبرز ما يخصّني"
        >🔷 مهامي مميّزة</button>
      </div>

      <DateRangeFilter value={taskRange} onChange={setTaskRange} shown={boardTasks.length} total={scopedTasks.length} />

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المهام.</p>}
      {tasks && (
        <TaskStatusBoard
          tasks={boardTasks}
          onOpen={openTask}
          isAcked={isAcked}
          onAck={ack}
          onMove={(t, status) => handleMove(t, { status })}
          meId={meId}
          highlightMine={effTaskScope === 'all' && taskHighlight}
          onProgress={canManage ? (t, pct) => progress.mutate({ id: t.id, progress: pct }) : undefined}
          onDirective={setDirectiveOf}
          canSendDirective={canDelete}
        />
      )}

      {/* ══ القسم الأسفل: المتابعة ══ */}
      <div style={sectionDivider} />

      <div style={pageHeader}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px' }}>🔄 لوحة المتابعة (كانبان)</h2>
          <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '3px' }}>متابعات العملاء — تُضاف من هنا أو من نافذة الفرصة، وتظهر حسب موعدها</div>
        </div>
        {canAddFollowUp && (
          <button className="btn btn-primary" type="button" onClick={() => setFupFormOpen(true)}>+ متابعة جديدة</button>
        )}
      </div>

      <div style={scopeRow}>
        <button type="button" onClick={() => setFupScope('mine')} style={{ ...scopeBtn, ...(effFupScope === 'mine' ? scopeOn : null) }}>متابعاتي فقط</button>
        <button type="button" onClick={() => { setFupScope('all'); setFupHighlight(false); }} style={{ ...scopeBtn, ...(effFupScope === 'all' && !fupHighlight ? scopeOn : null) }}>جميع المتابعات</button>
        <button
          type="button"
          onClick={() => { setFupScope('all'); setFupHighlight(true); }}
          style={{ ...scopeBtn, ...(effFupScope === 'all' && fupHighlight ? scopeOn : null) }}
          title="تظهر كل المتابعات، ومتابعات غيري تخفت ليبرز ما يخصّني"
        >🔷 متابعاتي مميّزة</button>
      </div>

      <DateRangeFilter value={fupRange} onChange={setFupRange} shown={boardFollowUps.length} total={scopedFollowUps.length} />

      <ClientFollowUpsBoard
        items={boardFollowUps}
        meId={meId}
        highlightMine={effFupScope === 'all' && fupHighlight}
        onDirective={setFupDirectiveOf}
        canSendDirective={canSendFupDirective}
      />

      {/* ══ توزيع المهام على الفريق ══ */}
      {canDelete && (workload?.length ?? 0) > 0 && (
        <div style={workCard}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>📊 توزيع المهام على الفريق</h3>
          <div style={{ fontSize: '12px', color: '#8A93A3', margin: '3px 0 12px' }}>حمل العمل الحالي لكل مهندس</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>المهندس</th>
                  <th style={th}>مهام نشطة</th>
                  <th style={th}>مكتملة</th>
                  <th style={th}>متأخرة</th>
                  <th style={th}>حمل العمل</th>
                </tr>
              </thead>
              <tbody>
                {(workload ?? []).map((w) => {
                  const max = Math.max(...(workload ?? []).map((x) => x.open), 1);
                  const pct = Math.round((w.open / max) * 100);
                  const tone = w.overdue > 1 ? '#DC4A3D' : w.open > max * 0.6 ? '#E8A838' : '#2D9B6F';
                  return (
                    <tr key={w.user.id}>
                      <td style={{ ...td, fontWeight: 800 }}>{w.user.name}</td>
                      <td style={td}>{w.open}</td>
                      <td style={td}>{w.done}</td>
                      <td style={{ ...td, color: w.overdue > 0 ? '#DC4A3D' : '#64748B', fontWeight: w.overdue > 0 ? 800 : 400 }}>{w.overdue}</td>
                      <td style={td}>
                        <span style={barTrack}><span style={{ ...barFill, width: `${pct}%`, background: tone }} /></span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && <TaskFormModal task={editing} onClose={() => setFormOpen(false)} />}
      {fupFormOpen && <FollowUpFormModal onClose={() => setFupFormOpen(false)} />}
      {detail && (
        <TaskDetailModal
          task={detail}
          canManage={canManage}
          canDelete={canDelete}
          onClose={() => setDetail(null)}
          onEdit={openEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onSetNotExecuted={(t) => { move.mutate({ id: t.id, payload: { status: 'cancelled' } }); setDetail(null); }}
          onMove={(t, status) => handleMove(t, { status })}
        />
      )}

      {fupDirectiveOf && (
        <DirectiveModal
          card={fupCard(fupDirectiveOf)}
          canSend={canSendFupDirective}
          canReply={fupDirectiveOf.creator?.id === meId || fupDirectiveOf.directive?.sender?.id === meId || canSendFupDirective}
          onClose={() => setFupDirectiveOf(null)}
        />
      )}

      {/* توجيهات الإدارة على المهمة: الإدارة تُرسل، والمكلَّف يردّ (طلب أيمن 2026-08-29) */}
      {directiveOf && (
        <DirectiveModal
          card={taskCard(directiveOf)}
          canSend={canDelete}
          canReply={directiveOf.assignee?.id === meId || directiveOf.directive?.sender?.id === meId || canDelete}
          onClose={() => setDirectiveOf(null)}
        />
      )}

      {/* تأكيد إكمال المهمة — يمنع النقل المباشر لـ«مكتملة» (طلب العميل) */}
      {confirming && (
        <div style={confirmOverlay} onClick={() => setConfirming(null)}>
          <div style={confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div style={confirmIcon}>✅</div>
            <h3 style={{ margin: '4px 0 6px', fontSize: '17px', color: '#0F2A4A' }}>تأكيد إكمال المهمة</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B', lineHeight: 1.7 }}>
              هل أنت متأكد من تحديد المهمة «<b style={{ color: '#334155' }}>{confirming.title}</b>» كمكتملة؟
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="button" className="btn" onClick={() => setConfirming(null)} style={{ minWidth: '96px' }}>إلغاء</button>
              <button type="button" className="btn btn-primary" onClick={confirmComplete} style={{ minWidth: '120px', background: '#059669', borderColor: '#059669' }} disabled={toggle.isPending}>
                {toggle.isPending ? 'جارٍ…' : 'نعم، إكمال ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** بطاقة مؤشّر بشكل مؤشّرات لوحة CRM (أيقونة ملوّنة + رقم + سطر فرعي). */
function Kpi({ icon, bg, label, value, sub }: { icon: string; bg: string; label: string; value: number; sub: ReactNode }) {
  return (
    <div style={kpiCard}>
      <div style={{ ...kpiIcon, background: bg }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={kpiLabel}>{label}</div>
        <div style={kpiValue}>{value.toLocaleString('ar')}</div>
        <div style={kpiSub}>{sub}</div>
      </div>
    </div>
  );
}

const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' };
const kpiCard: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '13px 15px', boxShadow: '0 2px 8px rgba(27,108,168,.06)', display: 'flex', alignItems: 'center', gap: '12px' };
const kpiIcon: CSSProperties = { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 };
const kpiLabel: CSSProperties = { fontSize: '11.5px', color: '#64748B', fontWeight: 600, marginBottom: '2px' };
const kpiValue: CSSProperties = { fontSize: '23px', fontWeight: 800, color: '#1E293B', lineHeight: 1.1 };
const kpiSub: CSSProperties = { fontSize: '11px', color: '#64748B', marginTop: '2px' };
const hintLine: CSSProperties = { fontSize: '12px', color: '#5A6478', background: '#F1F5F9', borderRadius: '9px', padding: '8px 12px', marginBottom: '12px' };
const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '8px 18px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
// فاصل بين قسم المهام وقسم المتابعة — كل قسم قائم بذاته (طلب أيمن 2026-08-24).
const sectionDivider: CSSProperties = { height: '3px', background: '#E2E8F0', borderRadius: '3px', margin: '26px 0 20px' };
const workCard: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 18px', marginTop: '20px', boxShadow: '0 2px 8px rgba(27,108,168,.06)' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' };
const th: CSSProperties = { textAlign: 'right', padding: '9px 10px', background: '#F8FAFC', color: '#475569', fontWeight: 800, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '9px 10px', borderBottom: '1px solid #F1F5F9', color: '#334155' };
const barTrack: CSSProperties = { display: 'block', width: '100%', minWidth: '110px', height: '7px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' };
const barFill: CSSProperties = { display: 'block', height: '100%', borderRadius: '4px' };
const pageHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
const confirmOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const confirmDialog: CSSProperties = { background: '#fff', borderRadius: '16px', padding: '26px 24px 22px', width: '380px', maxWidth: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' };
const confirmIcon: CSSProperties = { width: '56px', height: '56px', margin: '0 auto 12px', borderRadius: '50%', background: '#E6F6EE', display: 'grid', placeItems: 'center', fontSize: '26px' };
