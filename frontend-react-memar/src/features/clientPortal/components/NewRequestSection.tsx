import { useRef, useState, type CSSProperties } from 'react';

import { clientPortalApi } from '../api/clientPortalApi';
import { useSubmitClientRequest } from '../hooks/useClientPortal';

/** أنواع الطلب (تعديل/إضافة على مشروع قائم) — مطابقة لتصميم Atoms. */
const REQUEST_TYPES: { value: string; label: string }[] = [
  { value: 'modify', label: 'تعديل تصميم' },
  { value: 'add', label: 'إضافة عنصر' },
  { value: 'remove', label: 'حذف عنصر' },
  { value: 'material', label: 'تغيير مواد' },
  { value: 'other', label: 'أخرى' },
];

const ATTACH_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf'];
const MAX_ATTACH_BYTES = 25 * 1024 * 1024; // 25MB
const kb = (n: number) => (n < 1024 ? `${n}B` : n < 1_048_576 ? `${Math.round(n / 1024)}KB` : `${(n / 1_048_576).toFixed(1)}MB`);

interface Props {
  projects: { id: number; name: string }[];
  onBack: () => void;
}

/**
 * صفحة «طلب جديد» — طلب تعديل/إضافة على مشروع قائم، طبق الأصل من Atoms (p-new-request):
 * صفحة كاملة داخل البوابة (section-header + بطاقة النموذج) وليست نافذة منبثقة.
 * تُرسَل كـ ServiceRequest (type=modification) يظهر لدى الطاقم مع رفع المرفقات.
 */
export function NewRequestSection({ projects, onBack }: Props) {
  const submit = useSubmitClientRequest();
  const [projectId, setProjectId] = useState('');
  const [requestType, setRequestType] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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
    if (!title.trim() && !requestType && !note.trim()) { setErr('يرجى تعبئة نوع الطلب أو عنوانه أو تفاصيله.'); return; }
    setErr('');
    submit.mutate(
      {
        type: 'modification',
        project_id: projectId ? Number(projectId) : undefined,
        request_type: requestType || undefined,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: async (res) => {
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
          setTimeout(onBack, 1800); // يعود لقائمة الطلبات بعد النجاح (طبق الأصل: navigateTo('requests'))
        },
        onError: () => setErr('تعذّر إرسال الطلب — حاول مرة أخرى.'),
      },
    );
  };

  const busy = submit.isPending || uploading;

  return (
    <div>
      {/* ترويسة الصفحة — طبق الأصل: section-header + زر العودة للطلبات */}
      <div className="section-header">
        <div>
          <h2 className="section-title">طلب جديد</h2>
          <p className="section-subtitle">أرسل طلب تعديل أو إضافة على مشروعك</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={onBack}>
          <i className="fas fa-arrow-right" /> العودة للطلبات
        </button>
      </div>

      <div className="new-request-form card">
        <div className="card-body">
          {done ? (
            <div style={successBox}>✅ تم إرسال الطلب بنجاح — سيتواصل معك فريقنا قريبًا.</div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">المشروع</label>
                <select className="form-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">اختر المشروع…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع الطلب</label>
                <select className="form-select" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
                  <option value="">اختر نوع الطلب…</option>
                  {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">عنوان الطلب</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تعديل مخطط الدور الأول" />
              </div>

              <div className="form-group">
                <label className="form-label">تفاصيل الطلب</label>
                <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="اشرح التعديل المطلوب بالتفصيل…" />
              </div>

              <div className="form-group">
                <label className="form-label">مرفقات (اختياري)</label>
                <div
                  className="file-upload-area"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                >
                  <i className="fas fa-cloud-upload-alt" />
                  <p>اسحب الملفات هنا أو <span className="file-upload-link">اختر ملفاً</span></p>
                  <span className="file-upload-hint">PDF, JPG, PNG, DWG — حد أقصى 25MB</span>
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

              {/* أزرار الإجراء — طبق الأصل: إرسال الطلب (btn-lg) + إلغاء */}
              <div className="form-actions">
                <button className="btn btn-primary btn-lg" type="button" disabled={busy} onClick={handleSubmit}>
                  <i className="fas fa-paper-plane" /> {uploading ? 'جارٍ رفع المرفقات…' : submit.isPending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
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
