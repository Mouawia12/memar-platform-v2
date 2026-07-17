import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useContacts } from '../../clients/hooks/useContacts';
import { useProjects } from '../../projects/hooks/useProjects';
import { useQuotations } from '../../quotations/hooks/useQuotations';
import { useSaveContract } from '../hooks/useContracts';
import { STATUS_LABELS, type Contract, type ContractFormData, type ContractStatus } from '../types';

interface Props {
  contract: Contract | null;
  onClose: () => void;
}

const empty: ContractFormData = {
  project_id: '', client_id: '', quotation_id: '', value_kwd: '', status: 'draft', start_date: '', end_date: '', notes: '',
};

export function ContractFormModal({ contract, onClose }: Props) {
  const save = useSaveContract();
  const { data: projects } = useProjects({ per_page: 100 });
  const { data: clients } = useContacts({ type: 'client', per_page: 100 });
  const { data: quotations } = useQuotations({ per_page: 100 });
  const [form, setForm] = useState<ContractFormData>(empty);

  useEffect(() => {
    if (contract) {
      setForm({
        project_id: contract.project?.id ?? '',
        client_id: contract.client?.id ?? '',
        quotation_id: contract.quotation?.id ?? '',
        value_kwd: contract.value_kwd,
        status: contract.status,
        start_date: contract.start_date ?? '',
        end_date: contract.end_date ?? '',
        notes: contract.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [contract]);

  const set = <K extends keyof ContractFormData>(key: K, value: ContractFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onQuotationChange = (id: string) => {
    const q = quotations?.data.find((x) => x.id === Number(id));
    setForm((f) => ({ ...f, quotation_id: id ? Number(id) : '', value_kwd: q ? q.total_kwd : f.value_kwd }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: contract?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{contract ? `تعديل عقد ${contract.number ?? ''}` : 'عقد جديد'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projects?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>العميل
            <select className="input" style={input} value={form.client_id} onChange={(e) => set('client_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {clients?.data.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label style={label}>عرض السعر (يجلب القيمة)
            <select className="input" style={input} value={form.quotation_id} onChange={(e) => onQuotationChange(e.target.value)}>
              <option value="">— بدون —</option>
              {quotations?.data.map((q) => <option key={q.id} value={q.id}>{q.number}</option>)}
            </select>
          </label>
          <label style={label}>قيمة العقد (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.value_kwd} onChange={(e) => set('value_kwd', e.target.value)} required />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as ContractStatus)}>
              {(Object.keys(STATUS_LABELS) as ContractStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label style={label}>تاريخ البدء
            <input className="input" style={input} type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </label>
          <label style={label}>تاريخ الانتهاء
            <input className="input" style={input} type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </label>
        </div>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '45px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
