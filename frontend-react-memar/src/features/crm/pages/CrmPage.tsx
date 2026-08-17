import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { useExportDisabled } from '../../../components/ExportGuard';
import { downloadCsv } from '../../../lib/csv';
import { TEMPERATURE_META } from '../types';
import type { TaskFormData } from '../../tasks/types';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { CrmBoard } from '../components/CrmBoard';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { StagesManagerModal } from '../components/StagesManagerModal';
import { TagRequestsPanel } from '../components/TagRequestsPanel';
import { SoundToggle } from '../components/SoundToggle';
import { celebrate, playSound } from '../opsNotify';
import { useCrmTags, useDeleteLead, useLeads, useMoveLead, useReorderLeads } from '../hooks/useCrm';
import { usePipelineStages } from '../hooks/usePipelineStages';
import type { Lead, Stage } from '../types';
import '../crm.css';

/**
 * صفحة CRM — طبق أصل «إدارة علاقات العملاء» من مرجع معمار customer portal:
 * رأس بعنوان وأزرار، ستة مؤشّرات محسوبة من البيانات الحيّة، تنبيه الفرص المتأخرة،
 * فلاتر، ثم لوحة الأعمدة (طلب أيمن 2026-08-17). ميزاتنا محفوظة: فتح/غلق الفرص،
 * السحب، الترتيب ▲▼، تخصيص المراحل، تحويل الفرصة الرابحة لمشروع.
 */
export function CrmPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | '7' | '30' | '90' | '365'>('all');
  // فلاتر طبق الأصل: نوع العميل + المسؤول (المصدر عرضي لعدم تتبّعه).
  const [clientFilter, setClientFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  // مبدّل نطاق طبق الأصل: كل الفرص / الفرص التي أنا مسؤول عنها (المالك = المستخدم الحالي).
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const userId = useAuthStore((s) => s.user?.id);
  const exportDisabled = useExportDisabled();
  // توستر يظهر عند نقل/إعادة ترتيب كرت الفرصة (طبق أصل opsToast).
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'danger' | 'info' }[]>([]);
  const showToast = (msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [taskInitial, setTaskInitial] = useState<Partial<TaskFormData> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);

  const { data, isLoading, isError } = useLeads({ search: search || undefined, type: 'lead', per_page: 200 });
  const { data: stages } = usePipelineStages();
  const move = useMoveLead();
  const reorder = useReorderLeads();
  const del = useDeleteLead();
  const canManage = usePermission('crm.manage');
  // إنشاء/تعديل/نقل الفرص متاح للموظف (crm.view) — طلب العميل؛ أما تخصيص المراحل واعتماد الاختصارات فللمدير.
  const canCreate = usePermission('crm.view');
  const canDelete = usePermission('crm.delete');
  const canLoyalty = usePermission('loyalty.view');
  const { data: crmTags } = useCrmTags();
  const pendingTagCount = (crmTags ?? []).filter((t) => t.status === 'pending').length;

  const stageList = useMemo(() => [...(stages ?? [])].sort((a, b) => a.position - b.position), [stages]);
  const wonKeys = useMemo(() => new Set(stageList.filter((s) => s.is_won).map((s) => s.key)), [stageList]);
  const terminalKeys = useMemo(() => new Set(stageList.filter((s) => s.is_won || s.is_lost).map((s) => s.key)), [stageList]);
  const proposalKeys = useMemo(() => new Set(stageList.filter((s) => /عرض|proposal/i.test(`${s.key} ${s.label}`)).map((s) => s.key)), [stageList]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setDetailId(null); setEditing(l); setModalOpen(true); };
  const handleDelete = (l: Lead) => { if (confirm(`حذف "${l.full_name}"؟`)) del.mutate(l.id); };

  const handleMove = (l: Lead, stage: Stage) => {
    if (wonKeys.has(stage) && !l.converted_project_id) {
      const name = l.project_name || l.company || l.full_name;
      if (!confirm(`تحويل الفرصة «${l.full_name}» لصفقة رابحة؟\nسيُنشأ مشروع «${name}» تلقائيًا في سجل المشاريع.`)) return;
    }
    const stageName = stageList.find((s) => s.key === stage)?.label ?? stage;
    move.mutate({ id: l.id, stage }, { onSuccess: () => {
      showToast(`↔️ تم نقل الفرصة إلى: ${stageName}`);
      // احتفال (Confetti + صوت) عند نقل الفرصة إلى «صفقة رابحة» — طبق أصل V42 celebrate.
      if (wonKeys.has(stage)) celebrate('فرصة رابحة! 🎉', `مبروك — ${l.full_name}`);
    } });
  };

  const handleAddTask = (l: Lead) => {
    setDetailId(null);
    setTaskInitial({
      title: `متابعة: ${l.full_name}`,
      description: `مهمة متعلّقة بالفرصة «${l.full_name}»${l.company ? ` — ${l.company}` : ''}.`,
      assignee_id: l.owner?.id ?? '',
    });
  };

  const leads = data?.data ?? [];
  const money = (v: number) => `${v.toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;

  const owners = useMemo(() => {
    const map = new Map<number, string>();
    leads.forEach((l) => { if (l.owner) map.set(l.owner.id, l.owner.name); });
    return [...map.entries()];
  }, [leads]);

  const visibleLeads = useMemo(() => {
    const cutoff = period === 'all' ? 0 : Date.now() - Number(period) * 86_400_000;
    return leads.filter((l) => {
      if (period !== 'all' && !(l.created_at && new Date(l.created_at).getTime() >= cutoff)) return false;
      if (scope === 'mine' && l.owner?.id !== userId) return false;
      if (ownerFilter !== 'all' && String(l.owner?.id ?? '') !== ownerFilter) return false;
      if (clientFilter === 'vip' && !l.is_vip) return false;
      if (clientFilter === 'new' && l.stage !== 'new') return false;
      if ((clientFilter === 'hot' || clientFilter === 'warm' || clientFilter === 'cold') && l.temperature !== clientFilter) return false;
      return true;
    });
  }, [leads, period, scope, userId, ownerFilter, clientFilter]);

  const stageLabel = (key: string) => stageList.find((s) => s.key === key)?.label ?? key;
  /** تصدير الفرص المعروضة إلى CSV — مُخفى في بوابة الموظف (ExportGuard). */
  const handleExport = () => {
    if (visibleLeads.length === 0) { alert('لا توجد فرص للتصدير.'); return; }
    downloadCsv('crm-opportunities', visibleLeads, [
      { header: 'الاسم', value: (l) => l.full_name },
      { header: 'الهاتف', value: (l) => l.phone ?? '' },
      { header: 'الشركة', value: (l) => l.company ?? '' },
      { header: 'المرحلة', value: (l) => stageLabel(l.stage) },
      { header: 'الحرارة', value: (l) => TEMPERATURE_META[l.temperature]?.label ?? '' },
      { header: 'الأهمية', value: (l) => l.priority },
      { header: 'القيمة (د.ك)', value: (l) => l.deal_value_kwd },
      { header: 'المسؤول', value: (l) => l.owner?.name ?? '' },
    ]);
  };
  const hiddenByPeriod = leads.length - visibleLeads.length;
  const detailLead = detailId != null ? leads.find((l) => l.id === detailId) ?? null : null;

  // ── المؤشّرات الستة (محسوبة من الفرص الحيّة) ──
  const kpi = useMemo(() => {
    const now = Date.now();
    const total = leads.length;
    const newWeek = leads.filter((l) => l.created_at && now - new Date(l.created_at).getTime() <= 7 * 864e5).length;
    const newMonth = leads.filter((l) => l.created_at && now - new Date(l.created_at).getTime() <= 30 * 864e5).length;
    const won = leads.filter((l) => wonKeys.has(l.stage));
    const negotiating = leads.filter((l) => !terminalKeys.has(l.stage) && l.stage !== 'new');
    const proposals = leads.filter((l) => proposalKeys.has(l.stage));
    const avgClose = won.length
      ? Math.round(won.reduce((s, l) => s + (l.created_at ? (now - new Date(l.created_at).getTime()) / 864e5 : 0), 0) / won.length)
      : 0;
    return {
      total, newWeek,
      monthPct: total ? Math.round((newMonth / total) * 100) : 0,
      negCount: negotiating.length,
      negValue: negotiating.reduce((s, l) => s + Number(l.deal_value_kwd || 0), 0),
      proposals: proposals.length,
      won: won.length,
      conversion: total ? Math.round((won.length / total) * 100) : 0,
      avgClose,
    };
  }, [leads, wonKeys, terminalKeys, proposalKeys]);

  const dueLeads = leads.filter((l) => l.reminder?.due);
  const urgentCount = leads.filter((l) => l.is_urgent).length;

  // صوت تنبيه عند وجود فرص عاجلة/مستحقّة (throttle دقيقة) — طبق أصل V42 playSound.
  useEffect(() => {
    if (dueLeads.length > 0 || urgentCount > 0) {
      playSound(urgentCount > 0 ? 'urgent' : 'reminder', { throttleMs: 60_000 });
    }
  }, [dueLeads.length, urgentCount]);

  const KPIS: { icon: string; color: keyof typeof ICON_BG; label: string; value: number; sub: ReactNode }[] = [
    { icon: '👥', color: 'blue', label: 'إجمالي العملاء المحتملين', value: kpi.total, sub: <><span style={up}>↑ {kpi.monthPct}%</span> هذا الشهر</> },
    { icon: '🆕', color: 'green', label: 'جدد هذا الأسبوع', value: kpi.newWeek, sub: 'فرص جديدة' },
    { icon: '🤝', color: 'orange', label: 'قيد التفاوض', value: kpi.negCount, sub: `بقيمة ${money(kpi.negValue)}` },
    { icon: '📋', color: 'purple', label: 'عروض مرسلة', value: kpi.proposals, sub: 'بانتظار الرد' },
    { icon: '✅', color: 'green', label: 'عقود موقعة', value: kpi.won, sub: <><span style={up}>↑ {kpi.conversion}%</span> معدل التحويل</> },
    { icon: '📊', color: 'red', label: 'متوسط إغلاق الصفقة', value: kpi.avgClose, sub: 'يوم عمل' },
  ];

  return (
    <div className="crm-scope">
      {/* ── رأس CRM ── */}
      <div style={headerRow}>
        <div>
          <div style={sectionTitle}>إدارة علاقات العملاء (CRM)</div>
          <div style={sectionSubtitle}>مركز العمليات التجارية — من أول تواصل حتى إغلاق المشروع</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canCreate && <button className="crm-btn crm-btn-primary" onClick={openCreate} type="button">🎯 فرصة / عميل محتمل</button>}
          {canLoyalty && <button className="crm-btn crm-btn-outline" onClick={() => navigate('/loyalty')} type="button">🏆 نقاط الموظفين</button>}
          {canManage && <button className="crm-btn crm-btn-outline" onClick={() => setStagesOpen(true)} type="button">⚙️ تخصيص المراحل</button>}
          {canManage && (
            <button className="crm-btn crm-btn-outline" onClick={() => setTagsPanelOpen(true)} type="button">
              📨 طلبات الاختصارات{pendingTagCount > 0 ? ` (${pendingTagCount})` : ''}
            </button>
          )}
          {!exportDisabled && <button className="crm-btn crm-btn-outline" onClick={handleExport} type="button">📤 تصدير</button>}
          <SoundToggle />
        </div>
      </div>

      {/* ── المؤشّرات الستة ── */}
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

      {/* ── تنبيه الفرص المتأخرة ── */}
      {dueLeads.length > 0 && (
        <div style={alertStrong}>
          <div style={alertHd}><span className="crm-bell" style={{ fontSize: '17px' }}>🔔</span><span style={alertTitle}>{dueLeads.length} فرصة تحتاج تواصل</span></div>
          <div style={alertBody}>
            {dueLeads.slice(0, 4).map((l) => <button key={l.id} type="button" style={alertChip} onClick={() => setDetailId(l.id)}>{l.full_name}</button>)}
            {dueLeads.length > 4 && <span style={{ fontSize: '10.5px', color: '#64748B' }}>+{dueLeads.length - 4} أخرى</span>}
          </div>
          {urgentCount > 0 && <div style={alertSub}>{urgentCount} فرصة عاجلة بانتظار تحديث الموظف</div>}
        </div>
      )}

      {/* ── الفلاتر طبق الأصل: نوع العميل · المصدر · المسؤول · الفترة · بحث ── */}
      <div style={filtersRow}>
        <select className="crm-filter-select" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
          <option value="all">جميع العملاء</option>
          <option value="new">جدد</option>
          <option value="vip">VIP</option>
          <option value="hot">ساخن</option>
          <option value="warm">دافئ</option>
          <option value="cold">بارد</option>
        </select>
        <select className="crm-filter-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value="all">جميع الموظفين</option>
          {owners.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
        </select>
        <select className="crm-filter-select" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
          <option value="all">كل الفترات</option>
          <option value="7">آخر أسبوع</option>
          <option value="30">آخر شهر</option>
          <option value="90">آخر 3 أشهر</option>
          <option value="365">آخر سنة</option>
        </select>
        <input className="crm-search" placeholder="🔍 بحث بالاسم، الهاتف، البريد…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }} />
        {period !== 'all' && hiddenByPeriod > 0 && <span style={{ fontSize: '12px', color: '#94A3B8' }}>عرض {visibleLeads.length} — أُخفي {hiddenByPeriod}</span>}
      </div>

      {/* ── مبدّل النطاق طبق الأصل ── */}
      <div style={scopeRow}>
        <button type="button" onClick={() => setScope('all')} style={{ ...scopeBtn, ...(scope === 'all' ? scopeOn : null) }}>جميع الفرص</button>
        <button type="button" onClick={() => setScope('mine')} style={{ ...scopeBtn, ...(scope === 'mine' ? scopeOn : null) }}>الفرص المسؤول عنها</button>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
      {data && <CrmBoard leads={visibleLeads} stages={stageList} onMove={handleMove} onOpen={(l) => setDetailId(l.id)} onReorder={(ids) => reorder.mutate(ids, { onSuccess: () => showToast('✅ تم تحديث ترتيب الفرص') })} onAdd={canCreate ? openCreate : undefined} />}

      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          stages={stageList}
          onClose={() => setDetailId(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddTask={handleAddTask}
          canManage={canCreate}
          canDelete={canDelete}
        />
      )}
      {modalOpen && <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} />}
      {stagesOpen && <StagesManagerModal stages={stageList} onClose={() => setStagesOpen(false)} />}
      {tagsPanelOpen && <TagRequestsPanel onClose={() => setTagsPanelOpen(false)} />}
      {taskInitial && <TaskFormModal task={null} initial={taskInitial} onClose={() => setTaskInitial(null)} />}

      {/* التوستر — يظهر عند نقل/ترتيب الفرص */}
      {toasts.length > 0 && (
        <div className="crm-toast-wrap">
          {toasts.map((t) => <div key={t.id} className={`crm-toast ${t.type}`}>{t.msg}</div>)}
        </div>
      )}
    </div>
  );
}

// ── أنماط طبق أصل CSS المرجع ──
const headerRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' };
const sectionTitle: CSSProperties = { fontSize: '16px', fontWeight: 800, color: '#1E293B' };
const sectionSubtitle: CSSProperties = { fontSize: '12px', color: '#64748B', marginTop: '3px' };
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px', marginBottom: '16px' };
const kpiCard: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(27,108,168,.06)', display: 'flex', alignItems: 'flex-start', gap: '14px' };
const kpiIcon: CSSProperties = { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 };
const ICON_BG: Record<'blue' | 'green' | 'orange' | 'purple' | 'red', CSSProperties> = {
  blue: { background: '#EBF5FF', color: '#1B6CA8' },
  green: { background: '#ECFDF5', color: '#2D9B6F' },
  orange: { background: '#FFFBEB', color: '#E8A838' },
  purple: { background: '#F5F3FF', color: '#7C3AED' },
  red: { background: '#FEF2F2', color: '#DC4A3D' },
};
const kpiLabel: CSSProperties = { fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 600 };
const kpiValue: CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#1E293B', lineHeight: 1.1 };
const kpiSub: CSSProperties = { fontSize: '11.5px', color: '#64748B', marginTop: '5px' };
const up: CSSProperties = { color: '#2D9B6F', fontWeight: 700 };
// صندوق تنبيه مُختصر الارتفاع (طلب العميل: أقل ارتفاعًا، غير مبالغ) — صفّ واحد.
const alertStrong: CSSProperties = { border: '1.5px solid #DC4A3D', borderRadius: '10px', padding: '7px 12px', background: 'linear-gradient(180deg,rgba(220,74,61,.10),#fff)', boxShadow: '0 3px 10px rgba(220,74,61,.12)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' };
const alertHd: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px' };
const alertTitle: CSSProperties = { fontSize: '12.5px', fontWeight: 900, color: '#B23B30' };
const alertBody: CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' };
const alertChip: CSSProperties = { background: '#DC4A3D', color: '#fff', border: 'none', borderRadius: '20px', padding: '3px 10px', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const alertSub: CSSProperties = { fontSize: '10.5px', color: '#8A5A08', marginTop: '6px', fontWeight: 700 };
const filtersRow: CSSProperties = { display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' };
const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '8px 18px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
