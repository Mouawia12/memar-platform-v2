import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useSaveFollowup } from '../hooks/useFollowups';
import { FU_BOARD, FU_CHANNELS, type FollowupFormData, type FollowupPriority, type FollowupStage } from '../types';

interface Props {
  /** مرحلة العمود الذي انطلق منه الزر — تحدّد تاريخ الاستحقاق (وحالة الإنجاز لعمود «منجزة»). */
  initialStage?: FollowupStage;
  onClose: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/** تاريخ الاستحقاق الابتدائي بحسب العمود المنطلق منه. */
const dueForStage = (s: FollowupStage) => (s === 'today' || s === 'done' ? todayStr() : s === 'late' ? plusDays(-1) : plusDays(3));

const PRIORITIES: { value: FollowupPriority; label: string }[] = [
  { value: 'urgent', label: 'عاجلة' },
  { value: 'high', label: 'عالية' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'low', label: 'منخفضة' },
];

/** نموذج «إضافة متابعة جديدة» — طبق أصل opsNewFollowUp. */
export function FollowupFormModal({ initialStage = 'scheduled', onClose }: Props) {
  const save = useSaveFollowup();
  const { data: usersData } = useAssignableUsers();
  const [form, setForm] = useState<FollowupFormData>({
    contact_id: '',
    client_name: '',
    channel: 'اتصال هاتفي',
    assigned_to: '',
    due_date: dueForStage(initialStage),
    priority: 'high',
    notes: '',
    done: initialStage === 'done',
  });
  const [err, setErr] = useState('');
  const col = FU_BOARD.find((s) => s.key === initialStage);

  const set = <K extends keyof FollowupFormData>(key: K, value: FollowupFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) { setErr('اسم العميل مطلوب.'); return; }
    save.mutate({ data: { ...form, client_name: form.client_name.trim() } }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0, marginBottom: '4px', fontSize: '17px' }}>🔁 إضافة متابعة جديدة</h2>
        {col && <div style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '6px' }}>ستُضاف في عمود: <b style={{ color: col.color }}>{col.icon} {col.label}</b></div>}

        <label style={label}>اسم العميل *
          <input className="input" style={input} value={form.client_name} onChange={(e) => set('client_name', e.target.value)} placeholder="مثال: شركة الخليج للمقاولات" />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>قناة المتابعة
            <select className="input" style={input} value={form.channel} onChange={(e) => set('channel', e.target.value)}>
              {FU_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={label}>تاريخ المتابعة *
            <input className="input" style={input} type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </label>
          <label style={label}>المسؤول
            <select className="input" style={input} value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— اختر —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>الأولوية
            <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as FollowupPriority)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
        </div>

        <label style={label}>ملاحظة المتابعة
          <textarea className="input" style={{ ...input, minHeight: '56px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="مثال: إرسال العرض الفني ومتابعة الموافقة" />
        </label>

        {(err || save.isError) && <p style={{ color: '#DC4A3D', marginTop: '8px', fontSize: '13px' }}>{err || apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="crm-btn crm-btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ المتابعة'}</button>
          <button className="crm-btn crm-btn-outline" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '13.5px', fontWeight: 600, color: '#334155' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
