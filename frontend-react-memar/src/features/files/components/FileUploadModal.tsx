import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useUploadFile } from '../hooks/useFiles';
import { humanSize } from '../types';

interface Props {
  folders: string[];
  onClose: () => void;
}

export function FileUploadModal({ folders, onClose }: Props) {
  const upload = useUploadFile();
  const { data: projects } = useProjects({ per_page: 100 });
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    if (name.trim()) form.append('name', name.trim());
    if (folder.trim()) form.append('folder', folder.trim());
    if (projectId) form.append('project_id', projectId);
    if (notes.trim()) form.append('notes', notes.trim());
    upload.mutate(form, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>رفع ملف جديد</h2>

        <label style={dropzone}>
          <input
            type="file"
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !name) setName(f.name); }}
          />
          <div style={{ fontSize: '34px' }}>📤</div>
          {file ? (
            <>
              <div style={{ fontWeight: 700, marginTop: '6px' }}>{file.name}</div>
              <div style={{ fontSize: '12px', color: '#5A6478' }}>{humanSize(file.size)}</div>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#5A6478', marginTop: '6px' }}>اضغط لاختيار ملف (حتى 20 م.ب)</div>
          )}
        </label>

        <label style={label}>اسم معروض
          <input className="input" style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مخطط الفيلا – نسخة نهائية" />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المجلد / التصنيف
            <input className="input" style={input} value={folder} onChange={(e) => setFolder(e.target.value)} list="file-folders" placeholder="مخططات، عقود، صور…" />
            <datalist id="file-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
          </label>
          <label style={label}>المشروع
            <select className="input" style={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">بدون مشروع</option>
              {projects?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '50px' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {upload.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(upload.error, 'تعذّر رفع الملف')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={!file || upload.isPending}>{upload.isPending ? 'جارٍ الرفع…' : 'رفع الملف'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const dropzone: CSSProperties = { position: 'relative', display: 'block', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '22px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFF' };
