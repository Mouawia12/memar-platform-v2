import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useUsers } from '../../users/hooks/useUsers';
import { useSaveVisit } from '../hooks/useFieldVisits';
import { STATUS_LABELS, TYPE_LABELS, type FieldVisit, type FieldVisitFormData, type VisitStatus, type VisitType } from '../types';

interface Props {
  visit: FieldVisit | null;
  onClose: () => void;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const empty = (): FieldVisitFormData => ({
  title: '', project_id: '', engineer_id: '', type: 'inspection', status: 'scheduled',
  visit_date: toLocalInput(new Date().toISOString()), location: '', progress_pct: '', findings: '', recommendations: '',
});

export function FieldVisitFormModal({ visit, onClose }: Props) {
  const save = useSaveVisit();
  const { data: projects } = useProjects({ per_page: 100 });
  const { data: users } = useUsers({ per_page: 100 });
  const [form, setForm] = useState<FieldVisitFormData>(empty);

  useEffect(() => {
    if (visit) {
      setForm({
        title: visit.title,
        project_id: visit.project?.id ?? '',
        engineer_id: visit.engineer?.id ?? '',
        type: visit.type,
        status: visit.status,
        visit_date: toLocalInput(visit.visit_date),
        location: visit.location ?? '',
        progress_pct: visit.progress_pct === null ? '' : String(visit.progress_pct),
        findings: visit.findings ?? '',
        recommendations: visit.recommendations ?? '',
      });
    } else {
      setForm(empty());
    }
  }, [visit]);

  const set = <K extends keyof FieldVisitFormData>(key: K, value: FieldVisitFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: visit?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>{visit ? 'تعديل زيارة ميدانية' : 'جدولة زيارة ميدانية'}</h2>

        <label style={label}>عنوان الزيارة
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: متابعة صبّة الأساس" required />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">بدون مشروع</option>
              {projects?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>المهندس المكلّف
            <select className="input" style={input} value={form.engineer_id} onChange={(e) => set('engineer_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">غير محدّد</option>
              {users?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>نوع الزيارة
            <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as VisitType)}>
              {(Object.keys(TYPE_LABELS) as VisitType[]).map((k) => <option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as VisitStatus)}>
              {(Object.keys(STATUS_LABELS) as VisitStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>موعد الزيارة
            <input className="input" style={input} type="datetime-local" value={form.visit_date} onChange={(e) => set('visit_date', e.target.value)} required />
          </label>
          <label style={label}>نسبة الإنجاز المرصودة (%)
            <input className="input" style={input} type="number" min="0" max="100" value={form.progress_pct} onChange={(e) => set('progress_pct', e.target.value)} />
          </label>
        </div>

        <label style={label}>الموقع
          <input className="input" style={input} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="حولي – قطعة 4، شارع 12" />
        </label>
        <label style={label}>الملاحظات الميدانية
          <textarea className="input" style={{ ...input, minHeight: '70px' }} value={form.findings} onChange={(e) => set('findings', e.target.value)} placeholder="ما شوهد في الموقع…" />
        </label>
        <label style={label}>التوصيات
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.recommendations} onChange={(e) => set('recommendations', e.target.value)} />
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
