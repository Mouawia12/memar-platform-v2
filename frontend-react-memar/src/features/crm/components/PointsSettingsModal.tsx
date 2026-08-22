import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useCrmSettings, useSaveCrmSettings } from '../../settings/hooks/useSettings';
import { useApproveCrmTag, useCreateCrmTag, useCrmTags, useRejectCrmTag, useUpdateCrmTag } from '../hooks/useCrm';
import { tagColor } from '../types';

/**
 * ⚙️ إعدادات النقاط والاختصارات (الإدارة) — طلب أيمن 2026-08-22.
 * ① النقاط المقترحة لكل سعر · ② خصوصية الأرقام المالية · ③ الاختصارات وألوانها.
 * الأرقام تُحفظ كتجاوزات على config/crm.php، والألوان على جدول الاختصارات.
 */
export function PointsSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, isLoading } = useCrmSettings();
  const saveSettings = useSaveCrmSettings();
  const { data: tags } = useCrmTags();
  const updateTag = useUpdateCrmTag();
  const createTag = useCreateCrmTag();
  const approveTag = useApproveCrmTag();
  const rejectTag = useRejectCrmTag();

  const [enabled, setEnabled] = useState('1');
  const [unitPoints, setUnitPoints] = useState('100');
  const [unitKwd, setUnitKwd] = useState('10');
  const [p1, setP1] = useState('10');
  const [p2, setP2] = useState('20');
  const [p3, setP3] = useState('50');
  const [hideTotals, setHideTotals] = useState('1');
  const [newTag, setNewTag] = useState('');

  // تعبئة الحقول من الإعدادات الفعّالة حال وصولها.
  useEffect(() => {
    setEnabled(settings.points.enabled ? '1' : '0');
    setUnitPoints(String(settings.points.unit_points));
    setUnitKwd(String(settings.points.unit_kwd));
    setP1(String(settings.points.suggested.price_1));
    setP2(String(settings.points.suggested.price_2));
    setP3(String(settings.points.suggested.price_3));
    setHideTotals(settings.finance_privacy.hide_totals_from_staff ? '1' : '0');
  }, [settings]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveSettings.mutate({
      'points.enabled': enabled === '1',
      'points.unit_points': Number(unitPoints) || 0,
      'points.unit_kwd': Number(unitKwd) || 0,
      'points.suggested.price_1': Number(p1) || 0,
      'points.suggested.price_2': Number(p2) || 0,
      'points.suggested.price_3': Number(p3) || 0,
      'finance_privacy.hide_totals_from_staff': hideTotals === '1',
    }, { onSuccess: onClose });
  };

  const approved = (tags ?? []).filter((t) => t.status === 'approved');
  // طلبات الموظفين المعلّقة — مكان الإدارة العام لملاحظتها واعتمادها.
  const pending = (tags ?? []).filter((t) => t.status === 'pending');
  const addTag = () => {
    const name = newTag.trim();
    if (!name) return;
    createTag.mutate(name);
    setNewTag('');
  };

  return (
    <div className="crm-scope" style={overlay} onClick={onClose}>
      <form className="crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={modalHeader}>
          <span style={modalTitle}>⚙️ إعدادات النقاط والاختصارات (الإدارة)</span>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>
          <div style={intro}>
            الأسعار تُسجّل <b>بدون نقاط</b>، والإدارة تدخل على الفرصة وتحدد نقاط كل سعر.
            تُمنح النقاط للموظف الذي ينقل الفرصة إلى عمود <b>تم الفوز</b>.
          </div>

          <div style={grid2}>
            <Field label="تفعيل نظام النقاط">
              <select className="input" style={input} value={enabled} onChange={(e) => setEnabled(e.target.value)}>
                <option value="1">مُفعّل</option>
                <option value="0">معطّل</option>
              </select>
            </Field>
            <Field label="عدد النقاط">
              <input className="input" style={input} type="number" min="1" step="1" value={unitPoints} onChange={(e) => setUnitPoints(e.target.value)} />
            </Field>
            <Field label="تساوي (د.ك)">
              <input className="input" style={input} type="number" min="0" step="0.001" value={unitKwd} onChange={(e) => setUnitKwd(e.target.value)} />
            </Field>
          </div>

          {/* ── ① النقاط المقترحة لكل سعر ── */}
          <Section n="①" title="النقاط المقترحة لكل سعر (أي رقم — تعبئة سريعة للإدارة)">
            <div style={grid2}>
              <Field label="نقاط السعر 1">
                <input className="input" style={input} type="number" min="0" step="1" value={p1} onChange={(e) => setP1(e.target.value)} />
              </Field>
              <Field label="نقاط السعر 2">
                <input className="input" style={input} type="number" min="0" step="1" value={p2} onChange={(e) => setP2(e.target.value)} />
              </Field>
              <Field label="نقاط السعر 3">
                <input className="input" style={input} type="number" min="0" step="1" value={p3} onChange={(e) => setP3(e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* ── ② خصوصية الأرقام المالية ── */}
          <Section n="②" title="خصوصية الأرقام المالية">
            <Field label="إجمالي قيمة العقود والفرص">
              <select className="input" style={input} value={hideTotals} onChange={(e) => setHideTotals(e.target.value)}>
                <option value="1">مخفي عن الموظفين (الإدارة فقط)</option>
                <option value="0">ظاهر للجميع</option>
              </select>
            </Field>
            <div style={noteBox}>الموظف يرى عدد النقاط فقط ولا يرى قيمتها بالدينار، والتصدير متاح للإدارة فقط.</div>
          </Section>

          {/* ── ③ الاختصارات وألوانها ── */}
          <Section n="③" title={<>الاختصارات وألوانها{pending.length > 0 && <span style={pendingBadge}>📨 {pending.length} بانتظار الاعتماد</span>}</>}>
            {pending.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {pending.map((r) => (
                  <div key={r.id} style={pendingRow}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#92400E' }}>{r.name}</span>
                    <span style={{ fontSize: '10.5px', color: '#A16207', fontWeight: 700 }}>👤 {r.requested_by ?? '—'}</span>
                    <span style={{ fontSize: '10.5px', color: '#A16207' }}>{r.created_at ?? ''}</span>
                    <span style={{ display: 'flex', gap: '6px', marginInlineStart: 'auto' }}>
                      <button type="button" onClick={() => approveTag.mutate(r.id)} style={{ ...miniBtn, background: '#0F766E', color: '#fff' }}>✔ اعتماد</button>
                      <button type="button" onClick={() => rejectTag.mutate(r.id)} style={{ ...miniBtn, background: '#FEE2E2', color: '#B91C1C' }}>✕ رفض</button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {approved.length === 0 && <div style={noteBox}>لا اختصارات معتمدة بعد.</div>}
            {approved.map((t, i) => {
              const c = t.color ?? tagColor(t.name);
              return (
                <div key={t.id} style={grid2}>
                  <Field label={`الاختصار ${i + 1}`}>
                    <input className="input" style={input} defaultValue={t.name}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.name) updateTag.mutate({ id: t.id, name: v }); }} />
                  </Field>
                  <Field label="اللون">
                    <span style={colorRow}>
                      <input type="color" value={c} style={colorInput}
                        onChange={(e) => updateTag.mutate({ id: t.id, color: e.target.value })} />
                      <span style={{ ...preview, borderColor: c, color: c }}>{t.name}</span>
                    </span>
                  </Field>
                </div>
              );
            })}

            <div style={grid2}>
              <Field label="إضافة اختصار جديد">
                <input className="input" style={input} value={newTag} onChange={(e) => setNewTag(e.target.value)}
                  placeholder="مثال: حكومي" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              </Field>
              <Field>
                <button type="button" className="btn" onClick={addTag} disabled={createTag.isPending} style={{ width: '100%' }}>➕ إضافة الاختصار</button>
              </Field>
            </div>
            <div style={noteBox}>تغيير الاسم يُحفظ عند مغادرة الحقل، واللون يُحفظ فور اختياره — لا ينتظران زر الحفظ.</div>
          </Section>

          {isLoading && <p style={{ fontSize: '12.5px', color: '#64748B' }}>جارٍ تحميل الإعدادات…</p>}
          {saveSettings.isError && <p style={{ color: '#ef4444', fontSize: '13px' }}>{apiErrorMessage(saveSettings.error, 'تعذّر حفظ الإعدادات')}</p>}
          {updateTag.isError && <p style={{ color: '#ef4444', fontSize: '13px' }}>تعذّر تحديث الاختصار.</p>}
        </div>

        <div style={footer}>
          <button className="btn btn-primary" type="submit" disabled={saveSettings.isPending}>
            {saveSettings.isPending ? 'جارٍ الحفظ…' : '💾 حفظ الإعدادات'}
          </button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: ReactNode; children: ReactNode }) {
  return (
    <div style={sectionCard}>
      <div style={secTitle}>{n} {title}</div>
      {children}
    </div>
  );
}

/** حقل بعنوانه — العنوان اختياري ليصطفّ الزر مع الحقل المجاور. */
function Field({ label: text, children }: { label?: string; children: ReactNode }) {
  return (
    <label style={label}>
      <span style={{ display: 'block', minHeight: '15px' }}>{text}</span>
      {children}
    </label>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,20,40,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', zIndex: 500, overflowY: 'auto' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(10,20,40,.3)', width: '620px', maxWidth: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', marginBottom: '40px' };
const modalHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #EEF2F7', background: 'linear-gradient(135deg,#fff 0%,#EBF5FF 100%)', borderRadius: '16px 16px 0 0', flexShrink: 0 };
const modalTitle: CSSProperties = { fontSize: '16px', fontWeight: 800, color: '#1E293B' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: 0 };
const modalBody: CSSProperties = { padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' };
const intro: CSSProperties = { fontSize: '12.5px', color: '#334155', lineHeight: 1.9 };
const sectionCard: CSSProperties = { border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', background: '#FCFDFE' };
const secTitle: CSSProperties = { fontSize: '12.5px', fontWeight: 800, color: '#1B6CA8', borderBottom: '1px dashed #E2E8F0', paddingBottom: '6px', marginBottom: '10px' };
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 14px' };
const label: CSSProperties = { display: 'block', marginTop: '4px', fontSize: '12.5px', fontWeight: 700, color: '#334155' };
const input: CSSProperties = { width: '100%', marginTop: '5px' };
const noteBox: CSSProperties = { fontSize: '11.5px', color: '#5A6478', background: '#F1F5F9', borderRadius: '8px', padding: '8px 11px', marginTop: '10px', lineHeight: 1.6 };
const pendingBadge: CSSProperties = { marginInlineStart: '8px', background: '#FFFBEB', color: '#B45309', border: '1px solid #F59E0B', borderRadius: '999px', padding: '2px 9px', fontSize: '10.5px', fontWeight: 900 };
const pendingRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: '10px', padding: '8px 11px' };
const miniBtn: CSSProperties = { border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '10.5px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' };
const footer: CSSProperties = { display: 'flex', gap: '8px', padding: '14px 22px', borderTop: '1px solid #EEF2F7', background: '#F8FAFC', borderRadius: '0 0 16px 16px', flexShrink: 0 };
const colorRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', marginTop: '5px' };
const colorInput: CSSProperties = { width: '52px', height: '34px', padding: '2px', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: 'pointer' };
const preview: CSSProperties = { border: '2px solid', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 800, background: '#fff', whiteSpace: 'nowrap' };
