import { useRef, useState, type CSSProperties } from 'react';

import { clientPortalApi } from '../api/clientPortalApi';
import { useSubmitClientRequest } from '../hooks/useClientPortal';

/** أنواع المشاريع المتاحة في القائمة المنسدلة. */
const PROJECT_TYPES = ['فيلا سكنية', 'مجمع سكني', 'مجمع تجاري', 'مبنى إداري', 'مستودع / مصنع', 'ترميم وتجديد', 'تنسيق حدائق', 'أخرى'];

/** نطاقات الميزانية التقديرية (بالدينار الكويتي — استثناء مقصود عن Atoms). */
const BUDGET_RANGES = ['أقل من 50 ألف د.ك', '50 – 100 ألف د.ك', '100 – 250 ألف د.ك', '250 – 500 ألف د.ك', 'أكثر من 500 ألف د.ك'];

/** الخدمات المطلوبة (اختيار متعدّد) — طبق الأصل من Atoms. */
const SERVICES = ['تصميم معماري', 'تصميم إنشائي', 'تصميم كهربائي', 'تصميم صحي', 'إشراف هندسي', 'تصميم داخلي', 'تنسيق خارجي'];

/** الصيغ المدعومة للمرفقات (مطابقة لحد الباك‌إند). */
const ATTACH_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf'];
const MAX_ATTACH_BYTES = 25 * 1024 * 1024; // 25MB
const kb = (n: number) => (n < 1024 ? `${n}B` : n < 1_048_576 ? `${Math.round(n / 1024)}KB` : `${(n / 1_048_576).toFixed(1)}MB`);

interface Props {
  onBack: () => void;
}

/**
 * صفحة «طلب مشروع جديد» (CLIENT-2) — طبق الأصل من Atoms (p-new-project-request):
 * صفحة كاملة داخل البوابة (section-header + بطاقة النموذج) وليست نافذة منبثقة.
 * تجمع بيانات المشروع المبدئية وتُرسلها كطلب وارد يظهر لدى الطاقم في «الطلبات».
 */
export function NewProjectRequestSection({ onBack }: Props) {
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
          setTimeout(onBack, 1800); // يعود للوحة بعد النجاح (طبق الأصل: navigateTo('dashboard'))
        },
        onError: () => setErr('تعذّر إرسال الطلب — حاول مرة أخرى.'),
      },
    );
  };

  const busy = submit.isPending || uploading;

  return (
    <div>
      {/* ترويسة الصفحة — طبق الأصل: section-header + زر العودة */}
      <div className="section-header">
        <div>
          <h2 className="section-title">طلب مشروع جديد</h2>
          <p className="section-subtitle">سجّل بيانات مشروعك الجديد وسيتم دراسته من فريقنا الهندسي</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onBack}>
          <i className="fas fa-arrow-right" /> العودة
        </button>
      </div>

      <div className="new-request-form card">
        <div className="card-body">
          {done ? (
            <div style={successBox}>✅ تم إرسال طلبك بنجاح — سيتواصل معك فريقنا قريبًا.</div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-building" /> اسم المشروع</label>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فيلا سكنية - حي الرقة" />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-layer-group" /> نوع المشروع</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">اختر نوع المشروع…</option>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-map-location-dot" /> موقع المشروع</label>
                  <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="المدينة - المنطقة" />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-ruler-combined" /> المساحة التقريبية (م²)</label>
                  <input className="form-input" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: 500" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-coins" /> الميزانية التقديرية</label>
                  <select className="form-select" value={budget} onChange={(e) => setBudget(e.target.value)}>
                    <option value="">اختر النطاق…</option>
                    {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-calendar-alt" /> الموعد المتوقع للبدء</label>
                  <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><i className="fas fa-clipboard-list" /> الخدمات المطلوبة</label>
                <div className="services-checkboxes">
                  {SERVICES.map((s) => (
                    <label key={s} className="checkbox-label">
                      <input type="checkbox" checked={services.includes(s)} onChange={() => toggleService(s)} /> {s}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><i className="fas fa-comment-dots" /> ملاحظات إضافية</label>
                <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="أي تفاصيل أو متطلبات خاصة تود إضافتها…" />
              </div>

              <div className="form-group">
                <label className="form-label"><i className="fas fa-paperclip" /> مرفقات (اختياري)</label>
                <div
                  className="file-upload-area"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                >
                  <i className="fas fa-cloud-upload-alt" />
                  <p>اسحب الملفات هنا أو <span className="file-upload-link">اختر ملفاً</span></p>
                  <span className="file-upload-hint">صك ملكية، كروكي، صور الموقع — PDF, JPG, PNG, DWG (حد أقصى 25MB)</span>
                </div>
                <input ref={fileInput} type="file" hidden multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf"
                  onChange={(e) => { addFiles(e.target.files); if (e.target) e.target.value = ''; }} />
                {files.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} style={fileRow}>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name} <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>({kb(f.size)})</span></span>
                        <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} style={removeBtn} aria-label="إزالة">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {err && <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '4px' }}>{err}</div>}

              {/* أزرار الإجراء — طبق الأصل: إرسال طلب المشروع (btn-lg) + إلغاء */}
              <div className="form-actions">
                <button className="btn btn-primary btn-lg" type="button" disabled={busy} onClick={handleSubmit}>
                  <i className="fas fa-paper-plane" /> {uploading ? 'جارٍ رفع المرفقات…' : submit.isPending ? 'جارٍ الإرسال…' : 'إرسال طلب المشروع'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={onBack}>إلغاء</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const successBox: CSSProperties = { padding: '20px', background: 'var(--success-50)', border: '1px solid var(--success)', borderRadius: '12px', color: 'var(--success)', fontWeight: 700, fontSize: '15px', textAlign: 'center' };
const fileRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '9px', fontSize: '13px' };
const removeBtn: CSSProperties = { background: 'none', border: 'none', color: 'var(--danger)', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '0 4px' };
