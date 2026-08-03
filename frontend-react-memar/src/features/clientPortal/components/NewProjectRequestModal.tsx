import { useRef, useState, type CSSProperties } from 'react';

import { clientPortalApi } from '../api/clientPortalApi';
import { useSubmitClientRequest } from '../hooks/useClientPortal';

/** أنواع المشاريع المتاحة في القائمة المنسدلة. */
const PROJECT_TYPES = ['فيلا سكنية', 'عمارة سكنية', 'مبنى تجاري', 'مجمع تجاري', 'استراحة', 'تجديد / ترميم', 'أخرى'];

/** نطاقات الميزانية التقديرية (بالدينار الكويتي). */
const BUDGET_RANGES = ['أقل من 50 ألف د.ك', '50 – 100 ألف د.ك', '100 – 250 ألف د.ك', '250 – 500 ألف د.ك', 'أكثر من 500 ألف د.ك'];

/** الخدمات المطلوبة (اختيار متعدّد) — مطابقة لتصميم صفحة العميل. */
const SERVICES = ['تصميم معماري', 'تصميم إنشائي', 'تصميم كهربائي', 'تصميم صحي', 'إشراف هندسي', 'تصميم داخلي', 'تنسيق خارجي'];

/** الصيغ المدعومة للمرفقات (مطابقة لحد الباك‌إند). */
const ATTACH_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf'];
const MAX_ATTACH_BYTES = 25 * 1024 * 1024; // 25MB
const kb = (n: number) => (n < 1024 ? `${n}B` : n < 1_048_576 ? `${Math.round(n / 1024)}KB` : `${(n / 1_048_576).toFixed(1)}MB`);

interface Props {
  onClose: () => void;
}

/**
 * نموذج «طلب مشروع جديد» من بوابة العميل (CLIENT-2).
 * يجمع بيانات المشروع المبدئية ويُرسلها كطلب وارد يظهر لدى الطاقم في «الطلبات».
 */
export function NewProjectRequestModal({ onClose }: Props) {
  const submit = useSubmitClientRequest();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const accepted: File[] = [];
    for (const f of Array.from(picked)) {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ATTACH_EXT.includes(ext)) { setErr(`صيغة غير مدعومة: ${f.name}`); continue; }
      if (f.size > MAX_ATTACH_BYTES) { setErr(`الملف أكبر من 25MB: ${f.name}`); continue; }
      accepted.push(f);
    }
    if (accepted.length) { setErr(''); setFiles((prev) => [...prev, ...accepted]); }
  };

  const handleSubmit = () => {
    if (name.trim().length < 2) { setErr('يرجى إدخال اسم المشروع.'); return; }
    setErr('');
    submit.mutate(
      {
        type: 'project',
        project_name: name.trim(),
        project_type: type || undefined,
        location: location.trim() || undefined,
        area_sqm: area ? Number(area) : null,
        budget_range: budget || undefined,
        start_date: startDate || undefined,
        services: services.length ? services : undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: async (res) => {
          // رفع المرفقات بعد إنشاء الطلب (لكلٍّ منها نقطة رفع مستقلة)
          if (files.length && res?.id) {
            setUploading(true);
            try {
              for (const f of files) await clientPortalApi.uploadRequestAttachment(res.id, f);
            } catch {
              setErr('تم إرسال الطلب، لكن تعذّر رفع بعض المرفقات.');
            }
            setUploading(false);
          }
          setDone(true);
          setTimeout(onClose, 1800);
        },
        onError: () => setErr('تعذّر إرسال الطلب — حاول مرة أخرى.'),
      },
    );
  };

  const busy = submit.isPending || uploading;

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        {/* رأس + زر العودة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px' }}>🏗️ طلب مشروع جديد</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8A93A3' }}>سجّل بيانات مشروعك الجديد وسيتم دراسته من فريقنا الهندسي.</p>
          </div>
          <button type="button" onClick={onClose} style={backBtn}>→ العودة</button>
        </div>

        {done ? (
          <div style={successBox}>
            ✅ تم إرسال طلبك بنجاح — سيتواصل معك فريقنا قريبًا.
          </div>
        ) : (
          <>
            <div style={grid}>
              <Field label="اسم المشروع" required>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فيلا سكنية - حي الرقة" style={input} />
              </Field>
              <Field label="نوع المشروع">
                <select className="input" value={type} onChange={(e) => setType(e.target.value)} style={input}>
                  <option value="">اختر نوع المشروع…</option>
                  {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="موقع المشروع">
                <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="المدينة - المنطقة" style={input} />
              </Field>
              <Field label="المساحة التقريبية (م²)">
                <input className="input" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: 500" style={input} />
              </Field>
              <Field label="الميزانية التقديرية">
                <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)} style={input}>
                  <option value="">اختر النطاق…</option>
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="الموعد المتوقع للبدء">
                <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
              </Field>
            </div>

            {/* الخدمات المطلوبة */}
            <div style={{ marginTop: '16px' }}>
              <div style={fieldLabel}>🧰 الخدمات المطلوبة</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SERVICES.map((s) => {
                  const on = services.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleService(s)} style={{ ...serviceChip, ...(on ? serviceChipOn : null) }}>
                      {on ? '✓ ' : ''}{s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ملاحظات */}
            <div style={{ marginTop: '16px' }}>
              <div style={fieldLabel}>💬 ملاحظات إضافية</div>
              <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="أي تفاصيل أو متطلبات خاصة تود إضافتها…" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* المرفقات (اختياري) */}
            <div style={{ marginTop: '16px' }}>
              <div style={fieldLabel}>📎 مرفقات (اختياري)</div>
              <div
                style={dropzone}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              >
                <div style={{ fontSize: '22px' }}>☁️</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#274A78' }}>اسحب الملفات هنا أو اختر ملفاً</div>
                <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>صك ملكية، كروكي، صور الموقع — PDF, JPG, PNG, DWG (حد أقصى 25MB)</div>
              </div>
              <input ref={fileInput} type="file" hidden multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf"
                onChange={(e) => { addFiles(e.target.files); if (e.target) e.target.value = ''; }} />
              {files.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} style={fileRow}>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name} <span style={{ color: '#8A93A3', fontSize: '11px' }}>({kb(f.size)})</span></span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} style={removeBtn} aria-label="إزالة">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {err && <div style={{ color: '#DC2626', fontSize: '13px', marginTop: '12px' }}>{err}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="btn btn-primary" type="button" disabled={busy} onClick={handleSubmit} style={{ flex: 1 }}>
                {uploading ? 'جارٍ رفع المرفقات…' : submit.isPending ? 'جارٍ الإرسال…' : '📨 إرسال الطلب'}
              </button>
              <button className="btn" type="button" onClick={onClose}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={fieldLabel}>{label} {required && <span style={{ color: '#DC2626' }}>*</span>}</div>
      {children}
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 70, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflow: 'auto' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px' };
const input: CSSProperties = { width: '100%' };
const fieldLabel: CSSProperties = { fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '6px' };
const backBtn: CSSProperties = { background: '#EEF2F7', color: '#274A78', border: 'none', borderRadius: '9px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' };
const serviceChip: CSSProperties = { padding: '7px 14px', borderRadius: '999px', border: '1.5px solid #E4E8EF', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#5A6478' };
const serviceChipOn: CSSProperties = { background: '#274A7815', borderColor: '#274A78', color: '#274A78' };
const successBox: CSSProperties = { marginTop: '20px', padding: '20px', background: '#05966912', border: '1px solid #05966933', borderRadius: '12px', color: '#059669', fontWeight: 700, fontSize: '15px', textAlign: 'center' };
const dropzone: CSSProperties = { border: '2px dashed #C7D2E0', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' };
const fileRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', border: '1px solid #EEF2F7', borderRadius: '9px', fontSize: '13px' };
const removeBtn: CSSProperties = { background: 'none', border: 'none', color: '#DC2626', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '0 4px' };
