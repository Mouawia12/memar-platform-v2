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
  onClose: () => void;
}

/**
 * نموذج «طلب جديد» البسيط — طلب تعديل/إضافة على مشروع قائم (مطابق لتصميم Atoms: p-new-request).
 * مختلف عن «طلب مشروع جديد» المفصّل. يُرسَل كـ ServiceRequest (type=modification) يظهر لدى الطاقم.
 */
export function NewRequestModal({ projects, onClose }: Props) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px' }}>طلب جديد</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8A93A3' }}>أرسل طلب تعديل أو إضافة على مشروعك</p>
          </div>
          <button type="button" onClick={onClose} style={backBtn}>→ العودة للطلبات</button>
        </div>

        {done ? (
          <div style={successBox}>✅ تم إرسال الطلب بنجاح — سيتواصل معك فريقنا قريبًا.</div>
        ) : (
          <>
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={fieldLabel}>المشروع</div>
                <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} style={input}>
                  <option value="">اختر المشروع…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <div style={fieldLabel}>نوع الطلب</div>
                <select className="input" value={requestType} onChange={(e) => setRequestType(e.target.value)} style={input}>
                  <option value="">اختر نوع الطلب…</option>
                  {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <div style={fieldLabel}>عنوان الطلب</div>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تعديل مخطط الدور الأول" style={input} />
              </div>

              <div>
                <div style={fieldLabel}>تفاصيل الطلب</div>
                <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={5}
                  placeholder="اشرح التعديل المطلوب بالتفصيل…" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div>
                <div style={fieldLabel}>مرفقات (اختياري)</div>
                <div
                  style={dropzone}
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                >
                  <div style={{ fontSize: '22px' }}>☁️</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#274A78' }}>اسحب الملفات هنا أو اختر ملفاً</div>
                  <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>PDF, JPG, PNG, DWG — حد أقصى 25MB</div>
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

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 70, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'auto' };
const input: CSSProperties = { width: '100%' };
const fieldLabel: CSSProperties = { fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '6px' };
const backBtn: CSSProperties = { background: '#EEF2F7', color: '#274A78', border: 'none', borderRadius: '9px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' };
const successBox: CSSProperties = { marginTop: '20px', padding: '20px', background: '#05966912', border: '1px solid #05966933', borderRadius: '12px', color: '#059669', fontWeight: 700, fontSize: '15px', textAlign: 'center' };
const dropzone: CSSProperties = { border: '2px dashed #C7D2E0', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' };
const fileRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', border: '1px solid #EEF2F7', borderRadius: '9px', fontSize: '13px' };
const removeBtn: CSSProperties = { background: 'none', border: 'none', color: '#DC2626', fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '0 4px' };
