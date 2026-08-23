import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useAddLeadReminder, useApproveCrmTag, useCreateCrmTag, useCrmTags, useLeads, useRejectCrmTag, useSaveLead, useSimilarContacts } from '../hooks/useCrm';
import { usePipelineStages } from '../hooks/usePipelineStages';
import {
  FOLLOWUP_PRESETS, LEAD_SOURCE_META, LEAD_SOURCE_ORDER, PRIORITY_META, PRIORITY_ORDER, PROJECT_TYPES,
  TEMPERATURE_ORDER, TEMPERATURE_META,
  tagColor,
  type ContactType, type Lead, type LeadFormData, type LeadSource, type Priority, type Stage, type Temperature,
} from '../types';

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
  area_sqm: '', region: '', block_no: '', plot_no: '', project_type: '', source: '',
  tags: [], address: '', parent_contact_id: '',
  client_kind: 'individual', internal_rating: 0, internal_notes: '', owner_id: '',
};

const num = (v: string | null) => (Number(v) ? String(v) : '');
/** التاريخ بصيغة input[type=date] (YYYY-MM-DD) بالتوقيت المحلي لا UTC. */
const toDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * نموذج «إضافة فرصة / عميل محتمل جديد» — خمسة أقسام مرقّمة بنفس لغة نافذة التفاصيل
 * (طلب أيمن 2026-08-22): ① العميل · ② المشروع · ③ رينج السعر · ④ تذكير التواصل · ⑤ الفرصة.
 * الحقول المعلّمة بـ * إجبارية: اسم العميل، الهاتف، نوع المشروع، السعر 1، منشئ الفرصة.
 */
export function LeadFormModal({ lead, onClose }: Props) {
  const save = useSaveLead();
  const addReminder = useAddLeadReminder();
  const { data: stages } = usePipelineStages();
  const { data: staff } = useAssignableUsers();
  // سجل العملاء لقائمة «عميل مسجّل سابقًا» — الفرصة تُربط بالعميل الأصل عبر parent_contact_id.
  const { data: clients } = useLeads({ type: 'client', per_page: 200 });
  const meId = useAuthStore((s) => s.user?.id);

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
    area_sqm: num(lead.area_sqm), region: lead.region ?? '',
    block_no: lead.block_no ?? '', plot_no: lead.plot_no ?? '',
    project_type: lead.project_type ?? '',
    source: lead.source ?? '',
    tags: lead.tags ?? [],
    address: lead.address ?? '', parent_contact_id: lead.parent_contact_id ?? '',
    client_kind: lead.client_kind ?? 'individual',
    internal_rating: lead.internal_rating ?? 0,
    internal_notes: lead.internal_notes ?? '',
    owner_id: lead.owner?.id ?? '',
  } : { ...empty, owner_id: meId ?? '' }), [lead, meId]);

  const [form, setForm] = useState<LeadFormData>(initialForm);
  useEffect(() => setForm(initialForm), [initialForm]);

  // ④ تذكير التواصل — يُنشأ بعد حفظ الفرصة عبر endpoint التذكيرات.
  const [followup, setFollowup] = useState('');
  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('10:00');

  const set = <K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  /**
   * «الأنسب» صار تأشيرًا على أحد الأسعار الثلاثة بدل حقل مستقلّ (طلب أيمن
   * 2026-08-23): التأشير يملأ expected_price_kwd بقيمة السعر المؤشَّر، وتعديل
   * سعرٍ مؤشَّر يحدّث القيمة معه، وإفراغه يلغي التأشير.
   */
  const PRICE_KEYS = ['price_1_kwd', 'price_2_kwd', 'price_3_kwd'] as const;
  const bestKey = PRICE_KEYS.find(
    (k) => form.expected_price_kwd !== '' && form[k] !== '' && Number(form[k]) === Number(form.expected_price_kwd),
  );

  const setPrice = (key: (typeof PRICE_KEYS)[number], value: string) => {
    setForm((f) => ({
      ...f,
      [key]: value,
      // السعر المؤشَّر «الأنسب» يتبع قيمته الجديدة، ويسقط التأشير إن أُفرغ.
      ...(key === bestKey ? { expected_price_kwd: value } : null),
    }));
  };

  const markBest = (key: (typeof PRICE_KEYS)[number]) => {
    const v = form[key];
    if (!v || Number(v) <= 0) return;
    set('expected_price_kwd', bestKey === key ? '' : v);
  };

  /** اختيار مدة المتابعة يملأ تاريخ التذكير تلقائيًا (ويبقى قابلًا للتعديل يدويًا). */
  const pickFollowup = (key: string) => {
    setFollowup(key);
    const days = FOLLOWUP_PRESETS.find((p) => p.key === key)?.days ?? null;
    if (days === null) { setRemindDate(''); return; }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setRemindDate(toDateInput(d));
  };

  // «نوع المشروع» قائمة جاهزة + «أخرى…» لإدخال حر (لا نفقد القيم القديمة خارج القائمة).
  // تنبيه التكرار: بحث مؤجَّل عن أسماء مشابهة كي لا تُسجَّل الفرصة مرّتين
  // (طلب أيمن 2026-08-22). تنبيه فقط — لا يمنع الحفظ.
  const [nameProbe, setNameProbe] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setNameProbe(form.full_name.trim()), 500);
    return () => window.clearTimeout(t);
  }, [form.full_name]);
  const { data: similar } = useSimilarContacts(nameProbe, lead?.id ?? null);

  const [otherType, setOtherType] = useState(false);
  useEffect(() => {
    setOtherType(!!initialForm.project_type && !PROJECT_TYPES.includes(initialForm.project_type));
  }, [initialForm.project_type]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // «قيمة الصفقة» لم تعد حقلًا يُملأ يدويًا (طلب أيمن 2026-08-23): تُشتقّ من
    // السعر المؤشَّر «الأنسب»، وإلا من السعر الأول — فتبقى إجماليات الأعمدة
    // ومؤشّرات اللوحة والتصدير صحيحة بلا إدخال مكرّر.
    const payload: LeadFormData = {
      ...form,
      deal_value_kwd: form.expected_price_kwd || form.price_1_kwd || '',
    };
    save.mutate({ id: lead?.id, data: payload }, {
      onSuccess: (saved) => {
        if (remindDate) {
          addReminder.mutate(
            { id: saved.id, remind_at: `${remindDate} ${remindTime || '10:00'}:00`, note: `متابعة الفرصة: ${form.full_name}` },
            { onSettled: onClose },
          );
          return;
        }
        onClose();
      },
    });
  };

  // النقر خارج النموذج مع وجود بيانات غير محفوظة يطلب تأكيدًا — حتى لا تُفقد الداتا
  // بنقرة عرضية (طلب أيمن 2026-08-07).
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const handleBackdrop = () => {
    if (isDirty && !window.confirm('لديك بيانات غير محفوظة في هذا النموذج — إغلاقه وتجاهلها؟')) return;
    onClose();
  };

  const busy = save.isPending || addReminder.isPending;
  const createdAt = lead?.created_at ? new Date(lead.created_at) : new Date();

  return (
    <div className="crm-scope" style={overlay} onClick={handleBackdrop}>
      <form className="crm-modal-in crm-form-compact" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={modalHeader}>
          <span style={modalTitle}>🎯 {lead ? 'تعديل الفرصة' : 'إضافة فرصة / عميل محتمل جديد'}</span>
          <button type="button" onClick={handleBackdrop} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>
          <div style={formHint}>كل قسم محدد بعنوانه ورقمه — والحقول المعلّمة بـ <b style={{ color: '#DC4A3D' }}>*</b> إجبارية.</div>

          {/* ── ① بيانات العميل ── */}
          <Section n="①" title="بيانات العميل">
            <div style={grid2}>
              <Field label="عميل مسجّل سابقاً">
                <select className="input" style={input} value={form.parent_contact_id}
                  onChange={(e) => set('parent_contact_id', e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">— عميل جديد (إدخال يدوي) —</option>
                  {(clients?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </Field>
              <Field label="نوع العميل">
                <select className="input" style={input} value={form.client_kind}
                  onChange={(e) => set('client_kind', e.target.value as 'individual' | 'company')}>
                  <option value="individual">عميل فرد</option>
                  <option value="company">شركة / جهة</option>
                </select>
              </Field>
              <Field label="اسم العميل" required>
                <input className="input" style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="أحمد السالم" required />
                {(similar?.length ?? 0) > 0 && (
                  <div style={dupWarn}>
                    ⚠️ يوجد {similar!.length === 1 ? 'اسم مشابه مسجّل' : `${similar!.length} أسماء مشابهة مسجّلة`}:
                    <ul style={{ margin: '5px 0 0', paddingInlineStart: '18px' }}>
                      {similar!.slice(0, 3).map((c) => (
                        <li key={c.id} style={{ fontWeight: 700 }}>
                          {c.full_name}{c.phone ? ` — ${c.phone}` : ''}{c.project_name ? ` · ${c.project_name}` : ''}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '4px', fontWeight: 600 }}>تأكّد أنك لا تكرّر تسجيل الفرصة نفسها.</div>
                  </div>
                )}
              </Field>
              <Field label="رقم الهاتف" required>
                <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+965 9912 3456" dir="ltr" required />
              </Field>
              <Field label="البريد الإلكتروني">
                <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@email.com" dir="ltr" />
              </Field>
              {form.client_kind === 'company' && (
                <>
                  <Field label="الشركة / الجهة">
                    <input className="input" style={input} value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="شركة الخليج للمقاولات" />
                  </Field>
                  <Field label="المنصب">
                    <input className="input" style={input} value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="مدير تنفيذي" />
                  </Field>
                </>
              )}
              <Field label="تقييم العميل (نجوم)">
                {/* نجوم قابلة للنقر بدل قائمة منسدلة: النظام يرسم عناصر القائمة
                    بنفسه فلا تُلوَّن نجومها ذهبيًا (طلب أيمن 2026-08-23). */}
                <div style={starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set('internal_rating', form.internal_rating === n ? 0 : n)}
                      style={{ ...starBtn, color: n <= form.internal_rating ? '#E8A838' : '#D1D5DB' }}
                      title={`${n} من 5`}
                      aria-label={`تقييم ${n} من 5`}
                    >★</button>
                  ))}
                  <span style={starsHint}>
                    {form.internal_rating > 0 ? `${form.internal_rating}/5` : 'غير مقيّم'}
                  </span>
                </div>
              </Field>
              <Field label="تعليق تقييم العميل">
                <input className="input" style={input} value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} placeholder="ملاحظة على تعامل العميل" />
              </Field>
            </div>
            <div style={noteBox}>
              {form.parent_contact_id === ''
                ? 'عميل جديد — سيُضاف لسجل العملاء تلقائياً بعد الحفظ.'
                : 'فرصة جديدة لعميل مسجّل — ستُربط بملفه في سجل العملاء.'}
            </div>
          </Section>

          {/* ── ② بيانات المشروع ── */}
          <Section n="②" title="بيانات المشروع">
            <div style={grid2}>
              <Field label="اسم المشروع">
                <input className="input" style={input} value={form.project_name} disabled={!!lead?.project}
                  onChange={(e) => set('project_name', e.target.value)} placeholder="فيلا العائلة" />
              </Field>
              <Field label="نوع المشروع" required>
                <select className="input" style={input} value={otherType ? '__other' : form.project_type}
                  onChange={(e) => {
                    if (e.target.value === '__other') { setOtherType(true); set('project_type', ''); return; }
                    setOtherType(false);
                    set('project_type', e.target.value);
                  }}
                  required={!otherType}>
                  <option value="">— اختر نوع المشروع —</option>
                  {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="__other">أخرى…</option>
                </select>
              </Field>
              {otherType && (
                <Field label="نوع المشروع (إدخال حر)" required>
                  <input className="input" style={input} value={form.project_type} onChange={(e) => set('project_type', e.target.value)} placeholder="اكتب نوع المشروع" required />
                </Field>
              )}
              <Field label="العنوان أو الموقع">
                <input className="input" style={input} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="الفنطاس — شارع 12" />
              </Field>
              <Field label="المنطقة">
                <input className="input" style={input} value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="الفنطاس" />
              </Field>
              <Field label="قطعة">
                <input className="input" style={input} value={form.block_no} onChange={(e) => set('block_no', e.target.value)} placeholder="4" />
              </Field>
              <Field label="قسيمة">
                <input className="input" style={input} value={form.plot_no} onChange={(e) => set('plot_no', e.target.value)} placeholder="118" />
              </Field>
              <Field label="المساحة (م²)">
                <input className="input" style={input} type="number" step="0.01" min="0" value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} placeholder="600" />
              </Field>
              <Field label="مصدر الفرصة">
                <select className="input" style={input} value={form.source} onChange={(e) => set('source', e.target.value as LeadSource | '')}>
                  <option value="">غير محدّد</option>
                  {LEAD_SOURCE_ORDER.map((k) => <option key={k} value={k}>{LEAD_SOURCE_META[k].icon} {LEAD_SOURCE_META[k].label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="ملاحظات وتفاصيل المشروع">
              <textarea className="input" style={{ ...input, minHeight: '78px' }} value={form.project_details}
                onChange={(e) => set('project_details', e.target.value)} placeholder="عدد الأدوار، متطلبات العميل، ملاحظات التسعير…" />
            </Field>
            {lead?.project && (
              <div style={noteBox}>مرتبطة بمشروع «{lead.project.name}» ({lead.project.code}) في سجل المشاريع — يُدار الاسم من هناك.</div>
            )}
          </Section>

          {/* ── ③ رينج السعر ── */}
          <Section n="③" title="رينج السعر — 3 أسعار في صف واحد (الأول إجباري)">
            <div style={grid3}>
              {PRICE_KEYS.map((k, i) => (
                <Field key={k} label={`السعر ${i + 1}`} required={i === 0}>
                  {/* مربّع التأشير داخل حقل السعر نفسه — واحد فقط من الثلاثة هو «الأنسب». */}
                  <span style={priceWrap}>
                    <input className="input" style={{ ...input, marginTop: 0, paddingInlineEnd: '32px' }}
                      type="number" step="0.001" min="0" value={form[k]}
                      onChange={(e) => setPrice(k, e.target.value)}
                      placeholder={['18000', '24000', '32000'][i]} required={i === 0} />
                    <input type="checkbox" style={bestBox} checked={bestKey === k} disabled={!form[k]}
                      onChange={() => markBest(k)}
                      title={bestKey === k ? 'هذا هو السعر الأنسب' : 'تأشير هذا السعر كالأنسب'}
                      aria-label={`تأشير السعر ${i + 1} كالأنسب`} />
                  </span>
                </Field>
              ))}
            </div>
            <div style={noteBox}>أدخل الأسعار وأشّر «الأنسب» على أحدها — تُحتسب منه النقاط المتوقّعة، والنقاط يحددها المدير لاحقاً.</div>
            <div style={sectionNote}>
              النقاط تحت كل سعر <b>يحددها المدير</b> بعد الحفظ من نافذة تفاصيل الفرصة (100 نقطة = 10 د.ك)،
              وتُمنح للموظف الذي ينقل الفرصة إلى عمود «تم الفوز».
            </div>
            {lead && lead.expected_points > 0 && (
              <div style={{ fontSize: '12px', color: '#274A78', marginTop: '6px' }}>🏆 النقاط المتوقّعة الحالية: <b>{lead.expected_points}</b></div>
            )}
          </Section>

          {/* ── ④ تذكير التواصل ── */}
          <Section n="④" title="تذكير التواصل">
            <div style={grid2}>
              <Field label="يحتاج تواصل">
                <select className="input" style={input} value={followup} onChange={(e) => pickFollowup(e.target.value)}>
                  {FOLLOWUP_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="تاريخ التذكير">
                <input className="input" style={input} type="date" value={remindDate} onChange={(e) => setRemindDate(e.target.value)} />
              </Field>
              <Field label="وقت التذكير">
                <input className="input" style={input} type="time" value={remindTime} onChange={(e) => setRemindTime(e.target.value)} />
              </Field>
            </div>
            <div style={sectionNote}>يُضبط التذكير بعد حفظ الفرصة، ويظهر في تنبيه «فرص تحتاج تواصل» أعلى لوحة CRM.</div>
          </Section>

          {/* ── ⑤ بيانات الفرصة ── */}
          <Section n="⑤" title="بيانات الفرصة">
            <div style={grid2}>
              <Field label="منشئ الفرصة" required>
                <select className="input" style={input} value={form.owner_id}
                  onChange={(e) => set('owner_id', e.target.value === '' ? '' : Number(e.target.value))} required>
                  <option value="">— اختر الموظف —</option>
                  {(staff?.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="تاريخ الفرصة (تلقائي)">
                <input className="input" style={{ ...input, background: '#F1F5F9' }} value={createdAt.toLocaleDateString('ar-KW')} disabled />
              </Field>
              <Field label="المرحلة">
                <select className="input" style={input} value={form.stage} onChange={(e) => set('stage', e.target.value as Stage)}>
                  {(stages ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="مستوى أهمية الفرصة">
                <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
                  {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{PRIORITY_META[p].icon} أهمية {PRIORITY_META[p].label}</option>)}
                </select>
              </Field>
              <Field label="حرارة الفرصة">
                <select className="input" style={input} value={form.temperature} onChange={(e) => set('temperature', e.target.value as Temperature)}>
                  {TEMPERATURE_ORDER.map((t) => <option key={t} value={t}>{TEMPERATURE_META[t].icon} {TEMPERATURE_META[t].label}</option>)}
                </select>
              </Field>
              <Field label="التصنيف">
                <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as ContactType)}>
                  <option value="lead">عميل محتمل</option>
                  <option value="client">عميل</option>
                  <option value="contact">جهة اتصال</option>
                </select>
              </Field>
            </div>

            <div style={{ display: 'flex', gap: '18px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={checkRow}>
                <input type="checkbox" checked={form.is_vip} onChange={(e) => set('is_vip', e.target.checked)} /> ⭐ عميل VIP
              </label>
              <label style={checkRow}>
                <input type="checkbox" checked={form.is_urgent} onChange={(e) => set('is_urgent', e.target.checked)} /> 🚨 فرصة عاجلة
              </label>
            </div>

            <TagsSection tags={form.tags} onChange={(t) => set('tags', t)} />

            <Field label="ملاحظات عامة">
              <textarea className="input" style={{ ...input, minHeight: '56px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="أي ملاحظة إضافية على الفرصة" />
            </Field>
          </Section>

          {save.isError && <p style={{ color: '#ef4444', fontSize: '13px' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}
          {addReminder.isError && <p style={{ color: '#ef4444', fontSize: '13px' }}>حُفظت الفرصة، لكن تعذّر ضبط التذكير.</p>}
        </div>

        <div style={footer}>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'جارٍ الحفظ…' : '💾 حفظ الفرصة'}</button>
          <button className="btn" type="button" onClick={handleBackdrop}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

/** قسم مرقّم بعنوانه — نفس لغة نافذة تفاصيل الفرصة. */
function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div style={sectionCard}>
      <div style={secTitle}>{n} {title}</div>
      {children}
    </div>
  );
}

/** حقل بعنوانه — النجمة الحمراء تعني إجباري. */
function Field({ label: text, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label style={label}>
      <span>{text}{required && <b style={{ color: '#DC4A3D' }}> *</b>}</span>
      {children}
    </label>
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
          // كل اختصار بلونه: مفرَّغ بحدّ ونصّ ملوّنين، ويمتلئ باللون نفسه حين يُختار.
          const c = t.color ?? tagColor(t.name);
          return (
            <button key={t.id} type="button" onClick={() => toggle(t.name)}
              style={{ ...tagToggle, borderColor: c, color: on ? '#fff' : c, background: on ? c : '#fff' }}>
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
const tagToggle: CSSProperties = { border: '2px solid', borderRadius: '999px', padding: '6px 15px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s, color .15s' };
const tagNote: CSSProperties = { fontSize: '11.5px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '7px 10px', lineHeight: 1.6, marginTop: '8px' };
const pendingBox: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' };
const pendingTitle: CSSProperties = { fontSize: '11.5px', fontWeight: 900, color: '#8A5A08' };
const pendingRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: '10px', padding: '7px 10px' };
const miniBtn: CSSProperties = { border: 'none', borderRadius: '8px', padding: '4px 9px', fontSize: '10.5px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' };

// الشريط العلوي الموروث عليه z-index: 999999 !important، فنعلو فوقه كي لا يغطّي
// رأس النافذة (طلب أيمن 2026-08-23). طبقات النظام: نوافذ < احتفال < إشعارات عائمة.
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,20,40,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', zIndex: 1000000, overflowY: 'auto' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(10,20,40,.3)', width: '640px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', marginBottom: '40px' };
const modalHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid #EEF2F7', background: 'linear-gradient(135deg,#fff 0%,#EBF5FF 100%)', borderRadius: '16px 16px 0 0', flexShrink: 0 };
const modalTitle: CSSProperties = { fontSize: '14.5px', fontWeight: 800, color: '#1E293B' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: 0 };
const modalBody: CSSProperties = { padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '11px', overflowY: 'auto' };
// شريط الإرشاد أعلى النموذج (يشرح ترقيم الأقسام ومعنى النجمة).
const formHint: CSSProperties = { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B23B30', borderRadius: '9px', padding: '8px 11px', fontSize: '11.5px', fontWeight: 700 };
const sectionCard: CSSProperties = { border: '1px solid #E2E8F0', borderRadius: '11px', padding: '11px 13px', background: '#FCFDFE' };
const secTitle: CSSProperties = { fontSize: '11.5px', fontWeight: 800, color: '#1B6CA8', borderBottom: '1px dashed #E2E8F0', paddingBottom: '5px', marginBottom: '8px' };
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '8px 12px' };
const grid3: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px 12px' };
const label: CSSProperties = { display: 'block', marginTop: '3px', fontSize: '11.5px', fontWeight: 700, color: '#334155' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const dupWarn: CSSProperties = { background: '#FFFBEB', border: '1px solid #F59E0B', color: '#8A5A08', borderRadius: '8px', padding: '8px 11px', fontSize: '11.5px', lineHeight: 1.7, marginTop: '6px', fontWeight: 700 };
// مربّع «الأنسب» داخل حقل السعر (طلب أيمن 2026-08-23): مربّع فقط بلا كلمة،
// وعلامة صحّه خضراء. الحقل يحجز فراغًا في طرفه كي لا يركب الرقمَ المكتوب.
// نجوم التقييم — ذهبية للمختار ورمادية لما بعده، والنقر على نجمة مختارة يصفّر التقييم.
const starsRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '4px 9px', background: '#fff', height: '32px' };
const starBtn: CSSProperties = { background: 'none', border: 'none', padding: '0 1px', fontSize: '17px', lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' };
const starsHint: CSSProperties = { fontSize: '10.5px', color: '#94A3B8', fontWeight: 700, marginInlineStart: '6px' };
const priceWrap: CSSProperties = { position: 'relative', display: 'block', marginTop: '4px' };
const bestBox: CSSProperties = { position: 'absolute', insetInlineEnd: '10px', top: '50%', transform: 'translateY(-50%)', accentColor: '#2D9B6F', width: '15px', height: '15px', cursor: 'pointer', margin: 0 };
const noteBox: CSSProperties = { fontSize: '10.5px', color: '#5A6478', background: '#F1F5F9', borderRadius: '8px', padding: '7px 10px', marginTop: '8px', lineHeight: 1.55 };
const sectionNote: CSSProperties = { fontSize: '10.5px', color: '#5A6478', marginTop: '7px', lineHeight: 1.65 };
const footer: CSSProperties = { display: 'flex', gap: '8px', padding: '11px 18px', borderTop: '1px solid #EEF2F7', background: '#F8FAFC', borderRadius: '0 0 16px 16px', flexShrink: 0 };
const checkRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' };
