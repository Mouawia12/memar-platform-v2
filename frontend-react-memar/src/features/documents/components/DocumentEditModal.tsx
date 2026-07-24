import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useUpdateDocument } from '../hooks/useDocuments';
import { printDocument } from '../print';
import type { GeneratedDocument } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  document: GeneratedDocument;
  onClose: () => void;
}

/** تحرير مستند مولّد — عنوان + محرر غني، مع معاينة/طباعة. */
export function DocumentEditModal({ document, onClose }: Props) {
  const save = useUpdateDocument();
  const [title, setTitle] = useState(document.title);
  const [body, setBody] = useState(document.body_html);

  useEffect(() => { setTitle(document.title); setBody(document.body_html); }, [document]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: document.id, data: { title, body_html: body } }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>تحرير المستند</h2>
          <button className="btn btn-sm" type="button" onClick={() => printDocument(title, body)}>🖨️ معاينة / PDF</button>
        </div>

        <label style={label}>عنوان المستند
          <input className="input" style={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>محتوى المستند</div>
          <RichTextEditor value={body} onChange={setBody} resetKey={document.id} />
        </div>

        {save.isError && <p style={{ color: '#ef4444', marginTop: '10px' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '780px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '12px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
