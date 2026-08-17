import { useMemo, useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { useProjects } from '../../projects/hooks/useProjects';
import { TaskStatusBoard } from '../components/TaskStatusBoard';
import { TeamWorkloadTable } from '../components/TeamWorkloadTable';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { useDeleteTask, useMoveTask, useTasks, useToggleTask } from '../hooks/useTasks';
import { isDone, isTerminal, type Task, type TaskStatus } from '../types';
import { FollowupBoard } from '../../followups/components/FollowupBoard';
import { FollowupFormModal } from '../../followups/components/FollowupFormModal';
import { useFollowups, useMoveFollowup } from '../../followups/hooks/useFollowups';
import type { Followup, FollowupStage } from '../../followups/types';
import '../../crm/crm.css';

/**
 * المهام والمتابعة — طبق أصل لوحة كانبان المرجع: رأس + أزرار + ستة… أربع بطاقات مؤشّرات
 * (بتأثير الرفع والشريط) + مبدّل «جميع المهام/مهامي» + أعمدة الحالة بكروت TSK.
 */
export function TasksPage() {
  const canManage = usePermission('tasks.manage');
  const canDelete = usePermission('tasks.delete');
  const userId = useAuthStore((s) => s.user?.id);

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);
  const [confirming, setConfirming] = useState<Task | null>(null);

  // ── لوحة المتابعة ──
  const [fuScope, setFuScope] = useState<'all' | 'mine'>('all');
  const [fuFormOpen, setFuFormOpen] = useState(false);
  const [fuInitialStage, setFuInitialStage] = useState<FollowupStage>('scheduled');

  const { data: tasks, isLoading, isError } = useTasks({ search: search || undefined, project_id: projectId === '' ? undefined : projectId });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: followups } = useFollowups({ assigned_to: fuScope === 'mine' && userId ? userId : undefined });
  const move = useMoveTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const moveFollowup = useMoveFollowup();

  const scopedTasks = useMemo(() => {
    const list = tasks ?? [];
    return scope === 'mine' ? list.filter((t) => t.assignee?.id === userId) : list;
  }, [tasks, scope, userId]);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = scopedTasks.filter((t) => !isTerminal(t) && t.due_date && t.due_date.slice(0, 10) < today).length;
    const done = scopedTasks.filter((t) => t.status === 'done').length;
    return {
      total: scopedTasks.length,
      inProgress: scopedTasks.filter((t) => t.status === 'in_progress').length,
      overdue,
      done,
      donePct: scopedTasks.length ? Math.round((done / scopedTasks.length) * 100) : 0,
    };
  }, [scopedTasks]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = (t: Task) => { if (confirm(`حذف مهمة "${t.title}"؟`)) del.mutate(t.id); };
  const handleStatusMove = (t: Task, status: TaskStatus) => {
    if (status === 'done') { setConfirming(t); return; }
    move.mutate({ id: t.id, payload: { status } });
  };
  const handleToggle = (t: Task) => {
    if (!isDone(t)) { setConfirming(t); return; }
    toggle.mutate({ id: t.id, done: false });
  };
  const confirmComplete = () => {
    if (confirming) toggle.mutate({ id: confirming.id, done: true });
    setConfirming(null);
  };

  const openFuCreate = (stage: FollowupStage = 'scheduled') => { setFuInitialStage(stage); setFuFormOpen(true); };
  /** نقل المتابعة بين الأعمدة — تُترجَم المرحلة إلى (done + due_date). */
  const handleFollowupMove = (f: Followup, stage: FollowupStage) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    const payload =
      stage === 'done' ? { done: true }
        : stage === 'today' ? { done: false, due_date: today }
          : stage === 'late' ? { done: false, due_date: yesterday }
            : { done: false, due_date: soon }; // scheduled
    moveFollowup.mutate({ id: f.id, payload });
  };

  const KPIS: { icon: string; color: keyof typeof ICON_BG; label: string; value: number; sub: string }[] = [
    { icon: '📋', color: 'blue', label: 'إجمالي المهام', value: kpis.total, sub: 'هذا الشهر' },
    { icon: '⏳', color: 'orange', label: 'قيد التنفيذ', value: kpis.inProgress, sub: 'نشطة حاليًا' },
    { icon: '⚠️', color: 'red', label: 'متأخرة', value: kpis.overdue, sub: 'تحتاج متابعة' },
    { icon: '✅', color: 'green', label: 'مكتملة', value: kpis.done, sub: `${kpis.donePct}% منجزة` },
  ];

  return (
    <div className="crm-scope">
      <div style={headerRow}>
        <div>
          <div style={sectionTitle}>✅ المهام والمتابعة</div>
          <div style={sectionSubtitle}>لوحة كانبان لتتبع المهام وإدارة سير العمل</div>
        </div>
        {canManage && <button className="crm-btn crm-btn-primary" onClick={openCreate} type="button">+ مهمة جديدة</button>}
      </div>

      {/* ── المؤشّرات الأربعة ── */}
      <div style={kpiGrid}>
        {KPIS.map((k) => (
          <div key={k.label} className="crm-kpi-card" style={kpiCard}>
            <div style={{ ...kpiIcon, ...ICON_BG[k.color] }}>{k.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={kpiLabel}>{k.label}</div>
              <div style={kpiValue}>{k.value.toLocaleString('ar')}</div>
              <div style={kpiSub}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── الفلاتر ── */}
      <div style={filtersRow}>
        <select className="crm-filter-select" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">كل المشاريع</option>
          {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="crm-search" placeholder="🔍 بحث بعنوان المهمة…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }} />
      </div>

      {/* ── مبدّل النطاق ── */}
      <div style={scopeRow}>
        <button type="button" onClick={() => setScope('all')} style={{ ...scopeBtn, ...(scope === 'all' ? scopeOn : null) }}>جميع المهام</button>
        <button type="button" onClick={() => setScope('mine')} style={{ ...scopeBtn, ...(scope === 'mine' ? scopeOn : null) }}>مهامي فقط</button>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المهام.</p>}
      {tasks && <TaskStatusBoard tasks={scopedTasks} onOpen={setDetail} onMove={handleStatusMove} onAdd={canManage ? openCreate : undefined} />}

      {/* ── 🔁 لوحة المتابعة (كانبان) — متابعات العملاء ── */}
      <div style={{ ...headerRow, marginTop: '26px' }}>
        <div>
          <div style={sectionTitle}>🔁 لوحة المتابعة (كانبان)</div>
          <div style={sectionSubtitle}>متابعات العملاء — اسحب البطاقة بين الأعمدة لتحديث حالتها</div>
        </div>
        {canManage && <button className="crm-btn crm-btn-primary" onClick={() => openFuCreate('scheduled')} type="button">+ متابعة جديدة</button>}
      </div>
      <div style={scopeRow}>
        <button type="button" onClick={() => setFuScope('all')} style={{ ...scopeBtn, ...(fuScope === 'all' ? scopeOn : null) }}>جميع المتابعات</button>
        <button type="button" onClick={() => setFuScope('mine')} style={{ ...scopeBtn, ...(fuScope === 'mine' ? scopeOn : null) }}>متابعاتي فقط</button>
      </div>
      <FollowupBoard followups={followups ?? []} onMove={handleFollowupMove} onAdd={canManage ? openFuCreate : undefined} />

      {/* ── 📊 توزيع المهام على الفريق (مجمّع في الباك اند عبر /tasks/workload) ── */}
      <TeamWorkloadTable />

      {formOpen && <TaskFormModal task={editing} onClose={() => setFormOpen(false)} />}
      {fuFormOpen && <FollowupFormModal initialStage={fuInitialStage} onClose={() => setFuFormOpen(false)} />}
      {detail && (
        <TaskDetailModal
          task={detail}
          canManage={canManage}
          canDelete={canDelete}
          onClose={() => setDetail(null)}
          onEdit={(t) => { setEditing(t); setFormOpen(true); }}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onSetNotExecuted={(t) => { move.mutate({ id: t.id, payload: { status: 'cancelled' } }); setDetail(null); }}
        />
      )}

      {confirming && (
        <div style={confirmOverlay} onClick={() => setConfirming(null)}>
          <div style={confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div style={confirmIcon}>✅</div>
            <h3 style={{ margin: '4px 0 6px', fontSize: '17px', color: '#0F2A4A' }}>تأكيد إكمال المهمة</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B', lineHeight: 1.7 }}>
              هل أنت متأكد من تحديد المهمة «<b style={{ color: '#334155' }}>{confirming.title}</b>» كمكتملة؟
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={() => setConfirming(null)} style={{ minWidth: '96px' }}>إلغاء</button>
              <button type="button" className="crm-btn crm-btn-primary crm-btn-sm" onClick={confirmComplete} style={{ minWidth: '120px', background: '#059669' }} disabled={toggle.isPending}>
                {toggle.isPending ? 'جارٍ…' : 'نعم، إكمال ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── أنماط طبق أصل CSS المرجع ──
const headerRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' };
const sectionTitle: CSSProperties = { fontSize: '16px', fontWeight: 800, color: '#1E293B' };
const sectionSubtitle: CSSProperties = { fontSize: '12px', color: '#64748B', marginTop: '3px' };
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' };
const kpiCard: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(27,108,168,.06)', display: 'flex', alignItems: 'flex-start', gap: '14px' };
const kpiIcon: CSSProperties = { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 };
const ICON_BG: Record<'blue' | 'green' | 'orange' | 'red', CSSProperties> = {
  blue: { background: '#EBF5FF', color: '#1B6CA8' },
  green: { background: '#ECFDF5', color: '#2D9B6F' },
  orange: { background: '#FFFBEB', color: '#E8A838' },
  red: { background: '#FEF2F2', color: '#DC4A3D' },
};
const kpiLabel: CSSProperties = { fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 600 };
const kpiValue: CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#1E293B', lineHeight: 1.1 };
const kpiSub: CSSProperties = { fontSize: '11.5px', color: '#64748B', marginTop: '5px' };
const filtersRow: CSSProperties = { display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' };
const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '8px 18px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
const confirmOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const confirmDialog: CSSProperties = { background: '#fff', borderRadius: '16px', padding: '26px 24px 22px', width: '380px', maxWidth: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' };
const confirmIcon: CSSProperties = { width: '56px', height: '56px', margin: '0 auto 12px', borderRadius: '50%', background: '#E6F6EE', display: 'grid', placeItems: 'center', fontSize: '26px' };
