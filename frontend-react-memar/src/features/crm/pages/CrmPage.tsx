import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import type { TaskFormData } from '../../tasks/types';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { CrmBoard } from '../components/CrmBoard';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { StagesManagerModal } from '../components/StagesManagerModal';
import { useDeleteLead, useLeads, useMoveLead, useReorderLeads } from '../hooks/useCrm';
import { usePipelineStages } from '../hooks/usePipelineStages';
import type { Lead, Stage } from '../types';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [taskInitial, setTaskInitial] = useState<Partial<TaskFormData> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [stagesOpen, setStagesOpen] = useState(false);

  const { data, isLoading, isError } = useLeads({ search: search || undefined, type: 'lead', per_page: 200 });
  const { data: stages } = usePipelineStages();
  const move = useMoveLead();
  const reorder = useReorderLeads();
  const del = useDeleteLead();
  const canManage = usePermission('crm.manage');
  const canDelete = usePermission('crm.delete');
  const canLoyalty = usePermission('loyalty.view');

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
    move.mutate({ id: l.id, stage });
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

  const visibleLeads = useMemo(() => {
    if (period === 'all') return leads;
    const cutoff = Date.now() - Number(period) * 86_400_000;
    return leads.filter((l) => l.created_at && new Date(l.created_at).getTime() >= cutoff);
  }, [leads, period]);
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

  const KPIS: { icon: string; color: keyof typeof ICON_BG; label: string; value: number; sub: ReactNode }[] = [
    { icon: '👥', color: 'blue', label: 'إجمالي العملاء المحتملين', value: kpi.total, sub: <><span style={up}>↑ {kpi.monthPct}%</span> هذا الشهر</> },
    { icon: '🆕', color: 'green', label: 'جدد هذا الأسبوع', value: kpi.newWeek, sub: 'فرص جديدة' },
    { icon: '🤝', color: 'orange', label: 'قيد التفاوض', value: kpi.negCount, sub: `بقيمة ${money(kpi.negValue)}` },
    { icon: '📋', color: 'purple', label: 'عروض مرسلة', value: kpi.proposals, sub: 'بانتظار الرد' },
    { icon: '✅', color: 'green', label: 'عقود موقعة', value: kpi.won, sub: <><span style={up}>↑ {kpi.conversion}%</span> معدل التحويل</> },
    { icon: '📊', color: 'red', label: 'متوسط إغلاق الصفقة', value: kpi.avgClose, sub: 'يوم عمل' },
  ];

  return (
    <div>
      {/* ── رأس CRM ── */}
      <div style={headerRow}>
        <div>
          <div style={sectionTitle}>إدارة علاقات العملاء (CRM)</div>
          <div style={sectionSubtitle}>مركز العمليات التجارية — من أول تواصل حتى إغلاق المشروع</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">🎯 فرصة / عميل محتمل</button>}
          {canLoyalty && <button className="btn" onClick={() => navigate('/loyalty')} type="button">🏆 نقاط الموظفين</button>}
          {canManage && <button className="btn" onClick={() => setStagesOpen(true)} type="button">⚙️ تخصيص المراحل</button>}
        </div>
      </div>

      {/* ── المؤشّرات الستة ── */}
      <div style={kpiGrid}>
        {KPIS.map((k) => (
          <div key={k.label} style={kpiCard}>
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
          <div style={alertHd}><span style={{ fontSize: '17px' }}>🚨</span><span style={alertTitle}>{dueLeads.length} فرصة تحتاج تواصل الآن</span></div>
          <div style={alertBody}>
            {dueLeads.slice(0, 4).map((l) => <button key={l.id} type="button" style={alertChip} onClick={() => setDetailId(l.id)}>{l.full_name}</button>)}
            {dueLeads.length > 4 && <span style={{ fontSize: '10.5px', color: '#64748B' }}>+{dueLeads.length - 4} أخرى</span>}
          </div>
          {urgentCount > 0 && <div style={alertSub}>{urgentCount} فرصة عاجلة بانتظار تحديث الموظف</div>}
        </div>
      )}

      {/* ── الفلاتر ── */}
      <div style={filtersRow}>
        <input className="input" placeholder="بحث بالاسم، الهاتف، البريد…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px', maxWidth: '320px' }} />
        <select style={filterSelect} value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} title="عرض حسب الفترة">
          <option value="all">كل الفترات</option>
          <option value="7">آخر أسبوع</option>
          <option value="30">آخر شهر</option>
          <option value="90">آخر 3 أشهر</option>
          <option value="365">آخر سنة</option>
        </select>
        {period !== 'all' && hiddenByPeriod > 0 && <span style={{ fontSize: '12px', color: '#94A3B8' }}>عرض {visibleLeads.length} — أُخفي {hiddenByPeriod}</span>}
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
      {data && <CrmBoard leads={visibleLeads} stages={stageList} onMove={handleMove} onOpen={(l) => setDetailId(l.id)} onReorder={(ids) => reorder.mutate(ids)} onAdd={canManage ? openCreate : undefined} />}

      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          stages={stageList}
          onClose={() => setDetailId(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddTask={handleAddTask}
          canManage={canManage}
          canDelete={canDelete}
        />
      )}
      {modalOpen && <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} />}
      {stagesOpen && <StagesManagerModal stages={stageList} onClose={() => setStagesOpen(false)} />}
      {taskInitial && <TaskFormModal task={null} initial={taskInitial} onClose={() => setTaskInitial(null)} />}
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
const alertStrong: CSSProperties = { border: '2px solid #DC4A3D', borderRadius: '12px', padding: '11px 13px', background: 'linear-gradient(180deg,rgba(220,74,61,.12),#fff)', boxShadow: '0 6px 18px rgba(220,74,61,.16)', marginBottom: '16px' };
const alertHd: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
const alertTitle: CSSProperties = { fontSize: '13.5px', fontWeight: 900, color: '#B23B30' };
const alertBody: CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '7px' };
const alertChip: CSSProperties = { background: '#DC4A3D', color: '#fff', border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const alertSub: CSSProperties = { fontSize: '10.5px', color: '#8A5A08', marginTop: '6px', fontWeight: 700 };
const filtersRow: CSSProperties = { display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' };
const filterSelect: CSSProperties = { padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#1E293B', background: '#fff', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', minWidth: '150px' };
