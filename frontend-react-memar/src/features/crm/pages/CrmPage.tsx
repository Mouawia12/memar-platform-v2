import { type CSSProperties, useMemo, useState } from 'react';

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

export function CrmPage() {
  const [search, setSearch] = useState('');
  // فلتر زمني حسب تاريخ الإضافة/التواصل — لعرض القدامى ضمن فترة (طلب أيمن 2026-08-07).
  const [period, setPeriod] = useState<'all' | '7' | '30' | '90' | '365'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [taskInitial, setTaskInitial] = useState<Partial<TaskFormData> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [kpisOpen, setKpisOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);

  // لوحة CRM = الفرص فقط (type=lead). سجل العملاء منفصل — فحذف فرصة لا يمسّ سجل العملاء
  // (خلل أبلغ عنه أيمن 2026-08-14: حذف العملاء المحتملين كان يحذفهم من سجل العملاء).
  const { data, isLoading, isError } = useLeads({ search: search || undefined, type: 'lead', per_page: 200 });
  const { data: stages } = usePipelineStages();
  const move = useMoveLead();
  const reorder = useReorderLeads();
  const del = useDeleteLead();
  const canManage = usePermission('crm.manage');
  const canDelete = usePermission('crm.delete');

  const stageList = useMemo(() => [...(stages ?? [])].sort((a, b) => a.position - b.position), [stages]);
  const wonKeys = useMemo(() => new Set(stageList.filter((s) => s.is_won).map((s) => s.key)), [stageList]);
  const terminalKeys = useMemo(() => new Set(stageList.filter((s) => s.is_won || s.is_lost).map((s) => s.key)), [stageList]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setDetailId(null); setEditing(l); setModalOpen(true); };
  const handleDelete = (l: Lead) => { if (confirm(`حذف "${l.full_name}"؟`)) del.mutate(l.id); };

  /** نقل الفرصة — عند الوصول لمرحلة «رابحة» نؤكّد قبل توليد مشروع في سجل المشاريع. */
  const handleMove = (l: Lead, stage: Stage) => {
    if (wonKeys.has(stage) && !l.converted_project_id) {
      const name = l.project_name || l.company || l.full_name;
      if (!confirm(`تحويل الفرصة «${l.full_name}» لصفقة رابحة؟\nسيُنشأ مشروع «${name}» تلقائيًا في سجل المشاريع.`)) return;
    }
    move.mutate({ id: l.id, stage });
  };

  /** إسناد مهمة من صفقة — يُغلق مودال التفاصيل ثم يفتح نموذج المهمة موجّهًا لمالك الفرصة (TASK-5). */
  const handleAddTask = (l: Lead) => {
    setDetailId(null); // منعًا لتراكب المودالين فوق بعض
    setTaskInitial({
      title: `متابعة: ${l.full_name}`,
      description: `مهمة متعلّقة بالفرصة «${l.full_name}»${l.company ? ` — ${l.company}` : ''}.`,
      assignee_id: l.owner?.id ?? '',
    });
  };

  const leads = data?.data ?? [];
  // القائمة المعروضة بعد تطبيق الفلتر الزمني (حسب created_at). القدامى خارج الفترة يُخفَون.
  const visibleLeads = useMemo(() => {
    if (period === 'all') return leads;
    const cutoff = Date.now() - Number(period) * 86_400_000;
    return leads.filter((l) => l.created_at && new Date(l.created_at).getTime() >= cutoff);
  }, [leads, period]);
  const hiddenByPeriod = leads.length - visibleLeads.length;
  // الصفقة المعروضة تُشتقّ من القائمة الحيّة الكاملة — فتحديث المرحلة/الحرارة ينعكس فورًا
  const detailLead = detailId != null ? leads.find((l) => l.id === detailId) ?? null : null;
  const wonCount = visibleLeads.filter((l) => wonKeys.has(l.stage)).length;
  const expectedValue = visibleLeads.filter((l) => !terminalKeys.has(l.stage)).reduce((s, l) => s + Number(l.deal_value_kwd), 0);
  const hotCount = visibleLeads.filter((l) => l.temperature === 'hot').length;
  const activeCount = visibleLeads.filter((l) => !terminalKeys.has(l.stage)).length;
  const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>العملاء والفرص</h1>
          <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '2px' }}>مجموعة معمار للاستشارات الهندسية — إدارة العملاء المحتملين والفرص</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canManage && <button className="btn" onClick={() => setStagesOpen(true)} type="button">⚙️ تخصيص المراحل</button>}
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ فرصة جديدة</button>}
        </div>
      </div>

      {/* المؤشرات قابلة للطي (اجتماع 3: تقصير الصفحة، تقليل التمرير) — مطوية افتراضيًا */}
      <div style={{ marginBottom: '14px' }}>
        <button type="button" onClick={() => setKpisOpen((o) => !o)} style={kpiToggle}>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>📊 مؤشرات المبيعات</span>
          {!kpisOpen && (
            <span style={{ fontSize: '12.5px', color: '#5A6478' }}>
              🏆 {wonCount} · 🔥 {hotCount} · 🎯 {activeCount} · {money(expectedValue)}
            </span>
          )}
          <span style={{ marginInlineStart: 'auto', color: '#8A93A3' }}>{kpisOpen ? '▴' : '▾'}</span>
        </button>
        {kpisOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
            <div className="kpi-card"><div style={{ ...kpiVal, color: '#059669' }}>🏆 {wonCount}</div><div style={kpiLbl}>الصفقات الرابحة</div></div>
            <div className="kpi-card"><div style={{ ...kpiVal, color: '#D97706' }}>{money(expectedValue)}</div><div style={kpiLbl}>إجمالي المتوقّع</div></div>
            <div className="kpi-card"><div style={{ ...kpiVal, color: '#DC2626' }}>🔥 {hotCount}</div><div style={kpiLbl}>فرص ساخنة</div></div>
            <div className="kpi-card"><div style={{ ...kpiVal, color: '#274A78' }}>🎯 {activeCount}</div><div style={kpiLbl}>الفرص النشطة</div></div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input className="input" placeholder="بحث بالاسم أو الشركة أو الهاتف…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
        {/* فلتر زمني: عرض من تواصل خلال فترة (القدامى يُخفَون تلقائيًا) — طلب أيمن 2026-08-07 */}
        <select className="input" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} title="عرض حسب فترة التواصل" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="all">🕒 كل الفترات</option>
          <option value="7">آخر أسبوع</option>
          <option value="30">آخر شهر</option>
          <option value="90">آخر 3 أشهر</option>
          <option value="365">آخر سنة</option>
        </select>
        {period !== 'all' && hiddenByPeriod > 0 && (
          <span style={{ fontSize: '12.5px', color: '#8A93A3' }}>عرض {visibleLeads.length} — أُخفي {hiddenByPeriod} قديم</span>
        )}
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
      {data && <CrmBoard leads={visibleLeads} stages={stageList} onMove={handleMove} onOpen={(l) => setDetailId(l.id)} onReorder={(ids) => reorder.mutate(ids)} />}

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

const kpiToggle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: '#F8FAFC', border: '1px solid #E4E8EF', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit', flexWrap: 'wrap' };
const kpiVal: CSSProperties = { fontSize: '24px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
