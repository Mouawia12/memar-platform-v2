import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveTemplate } from '../hooks/useDocuments';
import { TEMPLATE_TYPE_LABELS, type DocumentTemplate, type TemplateFormData, type TemplateType } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  template: DocumentTemplate | null;
  onClose: () => void;
}

const empty: TemplateFormData = { name: '', type: 'contract', body_html: '', is_active: true };

export function TemplateFormModal({ template, onClose }: Props) {
  const save = useSaveTemplate();
  const [form, setForm] = useState<TemplateFormData>(empty);
  const [mode, setMode] = useState<'rich' | 'html'>('rich');

  useEffect(() => {
    if (template) {
      setForm({ name: template.name, type: template.type, body_html: template.body_html, is_active: template.is_active });
    } else {
      setForm(empty);
    }
  }, [template]);

  const set = <K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: template?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{template ? 'تعديل قالب' : 'قالب جديد'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <label style={label}>اسم القالب
            <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label style={label}>النوع
            <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as TemplateType)}>
              {(Object.keys(TEMPLATE_TYPE_LABELS) as TemplateType[]).map((t) => <option key={t} value={t}>{TEMPLATE_TYPE_LABELS[t]}</option>)}
            </select>
          </label>
        </div>

        <div style={{ ...label, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <span>محتوى القالب — استخدم حقولاً متغيّرة مثل <code dir="ltr">{'{{client_name}}'}</code></span>
          <span style={{ display: 'flex', gap: '4px' }}>
            <button type="button" onClick={() => setMode('rich')} style={modeBtn(mode === 'rich')}>✍️ محرر غني</button>
            <button type="button" onClick={() => setMode('html')} style={modeBtn(mode === 'html')}>{'</>'} HTML</button>
          </span>
        </div>

        {mode === 'rich' ? (
          <RichTextEditor value={form.body_html} onChange={(html) => set('body_html', html)} resetKey={`${template?.id ?? 'new'}-${mode}`} minHeight="200px" />
        ) : (
          <textarea
            className="input"
            style={{ ...input, minHeight: '200px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}
            value={form.body_html}
            onChange={(e) => set('body_html', e.target.value)}
            required
            placeholder="<h2>عقد بين مجموعة معمار و {{client_name}}</h2>..."
          />
        )}
        <div style={{ fontSize: '12px', opacity: 0.7, background: '#F0F4F8', padding: '8px 10px', borderRadius: '8px' }}>
          حقول تلقائية جاهزة عند التوليد من مشروع: <code dir="ltr">{'{{client_name}}'}</code>، <code dir="ltr">{'{{project_name}}'}</code>، <code dir="ltr">{'{{project_code}}'}</code>، <code dir="ltr">{'{{date}}'}</code>. أي حقل آخر يُدخَل يدويًا.
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '10px 0' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          قالب مفعّل
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };

const modeBtn = (active: boolean): CSSProperties => ({
  padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  border: `1px solid ${active ? '#1B6CA8' : '#E4E8EF'}`,
  background: active ? '#1B6CA8' : '#fff',
  color: active ? '#fff' : '#5A6478',
});
