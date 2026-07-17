import { type CSSProperties, useState } from 'react';

import { CrmBoard } from '../components/CrmBoard';
import { LeadFormModal } from '../components/LeadFormModal';
import { useDeleteLead, useLeads, useMoveLead } from '../hooks/useCrm';
import type { Lead, Stage } from '../types';

export function CrmPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const { data, isLoading, isError } = useLeads({ search: search || undefined, per_page: 200 });
  const move = useMoveLead();
  const del = useDeleteLead();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setEditing(l); setModalOpen(true); };
  const handleDelete = (l: Lead) => { if (confirm(`حذف "${l.full_name}"؟`)) del.mutate(l.id); };
  const handleMove = (l: Lead, stage: Stage) => move.mutate({ id: l.id, stage });

  const leads = data?.data ?? [];
  const pipelineValue = leads.filter((l) => l.stage !== 'lost').reduce((s, l) => s + Number(l.deal_value_kwd), 0);
  const wonValue = leads.filter((l) => l.stage === 'won').reduce((s, l) => s + Number(l.deal_value_kwd), 0);
  const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>إدارة علاقات العملاء (CRM)</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ عميل محتمل</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={kpiVal}>{leads.length}</div><div style={kpiLbl}>إجمالي العملاء</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#D97706' }}>{money(pipelineValue)}</div><div style={kpiLbl}>قيمة خط الأنابيب</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#059669' }}>{money(wonValue)}</div><div style={kpiLbl}>صفقات رابحة</div></div>
      </div>

      <input className="input" placeholder="بحث بالاسم أو الشركة أو الهاتف…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }} />

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
      {data && <CrmBoard leads={leads} onEdit={openEdit} onDelete={handleDelete} onMove={handleMove} />}

      {modalOpen && <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '24px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
