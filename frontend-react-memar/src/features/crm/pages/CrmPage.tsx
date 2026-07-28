import { type CSSProperties, useState } from 'react';

import type { TaskFormData } from '../../tasks/types';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { CrmBoard } from '../components/CrmBoard';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { useDeleteLead, useLeads, useMoveLead } from '../hooks/useCrm';
import type { Lead, Stage } from '../types';

export function CrmPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [taskInitial, setTaskInitial] = useState<Partial<TaskFormData> | null>(null);
  const [detail, setDetail] = useState<Lead | null>(null);

  const { data, isLoading, isError } = useLeads({ search: search || undefined, per_page: 200 });
  const move = useMoveLead();
  const del = useDeleteLead();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setDetail(null); setEditing(l); setModalOpen(true); };
  const handleDelete = (l: Lead) => { if (confirm(`حذف "${l.full_name}"؟`)) del.mutate(l.id); };
  const handleMove = (l: Lead, stage: Stage) => move.mutate({ id: l.id, stage });

  /** إسناد مهمة من صفقة — يُغلق مودال التفاصيل ثم يفتح نموذج المهمة موجّهًا لمالك الفرصة (TASK-5). */
  const handleAddTask = (l: Lead) => {
    setDetail(null); // منعًا لتراكب المودالين فوق بعض
    setTaskInitial({
      title: `متابعة: ${l.full_name}`,
      description: `مهمة متعلّقة بالفرصة «${l.full_name}»${l.company ? ` — ${l.company}` : ''}.`,
      assignee_id: l.owner?.id ?? '',
    });
  };

  const leads = data?.data ?? [];
  const wonCount = leads.filter((l) => l.stage === 'won').length;
  const expectedValue = leads.filter((l) => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + Number(l.deal_value_kwd), 0);
  const hotCount = leads.filter((l) => l.temperature === 'hot').length;
  const activeCount = leads.filter((l) => !['won', 'lost'].includes(l.stage)).length;
  const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>إدارة الفرص والمبيعات</h1>
          <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>Pipeline &amp; Deals CRM</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ فرصة جديدة</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#059669' }}>🏆 {wonCount}</div><div style={kpiLbl}>الصفقات الرابحة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#D97706' }}>{money(expectedValue)}</div><div style={kpiLbl}>إجمالي المتوقّع</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#DC2626' }}>🔥 {hotCount}</div><div style={kpiLbl}>فرص ساخنة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#274A78' }}>🎯 {activeCount}</div><div style={kpiLbl}>الفرص النشطة</div></div>
      </div>

      <input className="input" placeholder="بحث بالاسم أو الشركة أو الهاتف…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }} />

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
      {data && <CrmBoard leads={leads} onMove={handleMove} onOpen={setDetail} />}

      {detail && (
        <LeadDetailModal
          lead={detail}
          onClose={() => setDetail(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddTask={handleAddTask}
        />
      )}
      {modalOpen && <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} />}
      {taskInitial && <TaskFormModal task={null} initial={taskInitial} onClose={() => setTaskInitial(null)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '24px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
