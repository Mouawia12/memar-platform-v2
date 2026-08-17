import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { usePermission } from '../../auth/hooks/usePermission';
import { useApproveCrmTag, useCreateCrmTag, useCrmTags, useRejectCrmTag, useSaveLead } from '../hooks/useCrm';
import { usePipelineStages } from '../hooks/usePipelineStages';
import { PRIORITY_META, PRIORITY_ORDER, TEMPERATURE_ORDER, TEMPERATURE_META, type ContactType, type Lead, type LeadFormData, type Priority, type Stage, type Temperature } from '../types';

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

const empty: LeadFormData = {
  full_name: '', email: '', phone: '', company: '', position: '',
  type: 'lead', stage: 'new', temperature: 'normal', deal_value_kwd: '', notes: '',
  project_name: '', project_details: '',
  priority: 'medium', is_vip: false, is_urgent: false,
  price_1_kwd: '', price_2_kwd: '', price_3_kwd: '', expected_price_kwd: '',
  area_sqm: '', region: '', project_type: '', tags: [], address: '', parent_contact_id: '',
};

const num = (v: string | null) => (Number(v) ? String(v) : '');

export function LeadFormModal({ lead, onClose }: Props) {
  const save = useSaveLead();
  const { data: stages } = usePipelineStages();
  // القيمة الأصلية (فارغة للجديد أو من الفرصة عند التعديل) — مرجع للمقارنة وكشف التعديل.
  const initialForm = useMemo<LeadFormData>(() => (lead ? {
    full_name: lead.full_name,
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    company: lead.company ?? '',
    position: lead.position ?? '',
    type: lead.type,
    stage: lead.stage,
    temperature: lead.temperature,
    deal_value_kwd: Number(lead.deal_value_kwd) ? String(lead.deal_value_kwd) : '',
    notes: lead.notes ?? '',
    project_name: lead.project_name ?? '',
    project_details: lead.project_details ?? '',
    priority: lead.priority ?? 'medium',
    is_vip: !!lead.is_vip,
    is_urgent: !!lead.is_urgent,
    price_1_kwd: num(lead.price_1_kwd), price_2_kwd: num(lead.price_2_kwd), price_3_kwd: num(lead.price_3_kwd),
    expected_price_kwd: num(lead.expected_price_kwd),
    area_sqm: num(lead.area_sqm), region: lead.region ?? '', project_type: lead.project_type ?? '',
    tags: lead.tags ?? [],
    address: lead.address ?? '', parent_contact_id: lead.parent_contact_id ?? '',
  } : empty), [lead]);

  const [form, setForm] = useState<LeadFormData>(initialForm);
  useEffect(() => setForm(initialForm), [initialForm]);

  const set = <K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: lead?.id, data: form }, { onSuccess: onClose });
  };

  // النقر خارج النموذج مع وجود بيانات غير محفوظة يطلب تأكيدًا — حتى لا تُفقد الداتا
  // بنقرة عرضية (طلب أيمن 2026-08-07).
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const handleBackdrop = () => {
    if (isDirty && !window.confirm('لديك بيانات غير محفوظة في هذا النموذج — إغلاقه وتجاهلها؟')) return;
    onClose();
  };

  return (
    <div style={overlay} onClick={handleBackdrop}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{lead ? 'تعديل عميل محتمل' : 'عميل محتمل جديد'}</h2>

        <label style={label}>الاسم الكامل
          <input className="input" style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" />
          </label>
          <label style={label}>البريد
            <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} dir="ltr" />
          </label>
          <label style={label}>الشركة
            <input className="input" style={input} value={form.company} onChange={(e) => set('company', e.target.value)} />
          </label>
          <label style={label}>المنصب
            <input className="input" style={input} value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="مثال: مالك الشركة، مدير تنفيذي، مهندس" />
          </label>
          <label style={label}>المرحلة
            <select className="input" style={input} value={form.stage} onChange={(e) => set('stage', e.target.value as Stage)}>
              {(stages ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label style={label}>حرارة الفرصة
            <select className="input" style={input} value={form.temperature} onChange={(e) => set('temperature', e.target.value as Temperature)}>
              {TEMPERATURE_ORDER.map((t) => <option key={t} value={t}>{TEMPERATURE_META[t].icon} {TEMPERATURE_META[t].label}</option>)}
            </select>
          </label>
          <label style={label}>قيمة الصفقة (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.deal_value_kwd} onChange={(e) => set('deal_value_kwd', e.target.value)} />
          </label>
          <label style={label}>الأولوية
            <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{PRIORITY_META[p].icon} {PRIORITY_META[p].label}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '18px', marginTop: '10px', alignItems: 'center' }}>
          <label style={checkRow}>
            <input type="checkbox" checked={form.is_vip} onChange={(e) => set('is_vip', e.target.checked)} /> ⭐ عميل VIP
          </label>
          <label style={checkRow}>
            <input type="checkbox" checked={form.is_urgent} onChange={(e) => set('is_urgent', e.target.checked)} /> 🚨 فرصة عاجلة
          </label>
        </div>

        {/* نطاق الأسعار + المتوقّع — النقاط المتوقّعة يحسبها النظام من القواعد */}
        <div style={{ marginTop: '14px', borderTop: '1px solid #EEF2F7', paddingTop: '12px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#5A6478', marginBottom: '4px' }}>💰 نطاق الأسعار (د.ك)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <label style={label}>السعر الأول
              <input className="input" style={input} type="number" step="0.001" min="0" value={form.price_1_kwd} onChange={(e) => set('price_1_kwd', e.target.value)} />
            </label>
            <label style={label}>السعر الثاني
              <input className="input" style={input} type="number" step="0.001" min="0" value={form.price_2_kwd} onChange={(e) => set('price_2_kwd', e.target.value)} />
            </label>
            <label style={label}>السعر الثالث
              <input className="input" style={input} type="number" step="0.001" min="0" value={form.price_3_kwd} onChange={(e) => set('price_3_kwd', e.target.value)} />
            </label>
          </div>
          <label style={label}>السعر المتوقّع / الأنسب
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.expected_price_kwd}
              onChange={(e) => set('expected_price_kwd', e.target.value)} placeholder="تُحتسب منه النقاط المتوقّعة تلقائيًا" />
          </label>
          {lead && lead.expected_points > 0 && (
            <div style={{ fontSize: '12px', color: '#274A78', marginTop: '4px' }}>🏆 النقاط المتوقّعة الحالية: <b>{lead.expected_points}</b></div>
          )}
        </div>
        {/* بيانات المشروع — تُنقل لسجل المشاريع عند الفوز بالصفقة */}
        <div style={{ marginTop: '14px', borderTop: '1px solid #EEF2F7', paddingTop: '12px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#5A6478', marginBottom: '2px' }}>🏗️ بيانات المشروع</div>
          {lead?.project ? (
            <p style={{ fontSize: '12px', color: '#059669', margin: '4px 0 8px' }}>
              مرتبطة بمشروع «{lead.project.name}» ({lead.project.code}) في سجل المشاريع — يُدار الاسم من هناك.
            </p>
          ) : (
            <p style={{ fontSize: '11.5px', color: '#8A93A3', margin: '2px 0 8px' }}>
              يُنشأ مشروع تلقائيًا في سجل المشاريع بهذه البيانات عند تحويل الفرصة لصفقة رابحة.
            </p>
          )}
          <label style={label}>اسم المشروع
            <input className="input" style={input} value={form.project_name} disabled={!!lead?.project}
              onChange={(e) => set('project_name', e.target.value)} placeholder="مثال: فيلا العزب — تصميم داخلي" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label style={label}>المساحة (م²)
              <input className="input" style={input} type="number" step="0.01" min="0" value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} placeholder="مثال: 800" />
            </label>
            <label style={label}>المنطقة
              <input className="input" style={input} value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="مثال: السالمية" />
            </label>
            <label style={label}>نوع المشروع
              <input className="input" style={input} value={form.project_type} onChange={(e) => set('project_type', e.target.value)} placeholder="مثال: فيلا، مبنى إداري…" />
            </label>
            <label style={label}>العنوان
              <input className="input" style={input} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="القطعة، الشارع…" />
            </label>
          </div>
          <label style={label}>بيانات / تفاصيل المشروع
            <textarea className="input" style={{ ...input, minHeight: '50px' }} value={form.project_details}
              onChange={(e) => set('project_details', e.target.value)} placeholder="الموقع، المساحة، نوع الخدمة…" />
          </label>
        </div>

        <TagsSection tags={form.tags} onChange={(t) => set('tags', t)} />

        <label style={label}>التصنيف
          <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as ContactType)}>
            <option value="lead">عميل محتمل</option>
            <option value="client">عميل</option>
            <option value="contact">جهة اتصال</option>
          </select>
        </label>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '50px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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

/**
 * قسم الاختصارات (الوسوم) — طبق أصل V42: تبديل الاختصارات المعتمدة على الفرصة،
 * وإضافة اختصار جديد (المدير يعتمده مباشرة، وغيره يُرسل طلبًا للإدارة) + صندوق الطلبات المعلّقة.
 */
function TagsSection({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  // «المدير» = crm.delete (الموظف يملك crm.manage لكن ليس crm.delete): الموظف يطلب الاختصار، والمدير يعتمد.
  const isManager = usePermission('crm.delete');
  const { data: catalog } = useCrmTags();
  const createTag = useCreateCrmTag();
  const approveTag = useApproveCrmTag();
  const rejectTag = useRejectCrmTag();
  const [newTag, setNewTag] = useState('');

  const approved = (catalog ?? []).filter((t) => t.status === 'approved');
  const pending = (catalog ?? []).filter((t) => t.status === 'pending');
  const toggle = (name: string) => onChange(tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]);
  const add = () => {
    const name = newTag.trim();
    if (!name) return;
    createTag.mutate(name, { onSuccess: (t) => { if (t.status === 'approved') onChange([...new Set([...tags, t.name])]); } });
    setNewTag('');
  };

  return (
    <div style={label}>الاختصارات المهمة (المعتمدة من الإدارة)
      <div style={tagWrap}>
        {approved.length === 0 && <span style={{ fontSize: '12px', color: '#94A3B8' }}>لا اختصارات معتمدة بعد.</span>}
        {approved.map((t) => {
          const on = tags.includes(t.name);
          return (
            <button key={t.id} type="button" onClick={() => toggle(t.name)} style={{ ...tagToggle, ...(on ? tagToggleOn : null) }}>
              {on ? '✓ ' : '+ '}{t.name}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'stretch' }}>
        <input className="input" style={{ ...input, flex: 1 }} value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="اختصار جديد — مثال: حكومي" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn" onClick={add} disabled={createTag.isPending} style={{ whiteSpace: 'nowrap' }}>
          {isManager ? '➕ إضافة الاختصار' : '📨 إرسال طلب للإدارة'}
        </button>
      </div>
      <div style={tagNote}>
        {isManager
          ? 'الاختصار الذي تضيفه الإدارة يظهر مباشرة على السيستم.'
          : 'الاختصار الجديد يُسجَّل باسمك ويُرسل كطلب للإدارة — ولا يظهر إلا بعد اعتماده.'}
      </div>

      {pending.length > 0 && (
        <div style={pendingBox}>
          <div style={pendingTitle}>📨 اختصارات بانتظار اعتماد الإدارة ({pending.length})</div>
          {pending.map((r) => (
            <div key={r.id} style={pendingRow}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>{r.name}</span>
              <span style={{ fontSize: '10.5px', color: '#A16207', fontWeight: 700 }}>👤 {r.requested_by ?? '—'}</span>
              {isManager ? (
                <span style={{ display: 'flex', gap: '6px', marginInlineStart: 'auto' }}>
                  <button type="button" onClick={() => approveTag.mutate(r.id)} style={{ ...miniBtn, background: '#0F766E', color: '#fff' }}>✔ اعتماد</button>
                  <button type="button" onClick={() => rejectTag.mutate(r.id)} style={{ ...miniBtn, background: '#FEE2E2', color: '#B91C1C' }}>✕ رفض</button>
                </span>
              ) : <span style={{ fontSize: '10.5px', color: '#A16207', fontWeight: 800, marginInlineStart: 'auto' }}>بانتظار الإدارة</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tagWrap: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' };
const tagToggle: CSSProperties = { border: '1.5px solid #CBD5E1', background: '#fff', color: '#475569', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const tagToggleOn: CSSProperties = { background: '#0369A1', color: '#fff', borderColor: '#0369A1' };
const tagNote: CSSProperties = { fontSize: '11.5px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '7px 10px', lineHeight: 1.6, marginTop: '8px' };
const pendingBox: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' };
const pendingTitle: CSSProperties = { fontSize: '11.5px', fontWeight: 900, color: '#8A5A08' };
const pendingRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: '10px', padding: '7px 10px' };
const miniBtn: CSSProperties = { border: 'none', borderRadius: '8px', padding: '4px 9px', fontSize: '10.5px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' };

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const checkRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13.5px', fontWeight: 700, color: '#334155', cursor: 'pointer' };
