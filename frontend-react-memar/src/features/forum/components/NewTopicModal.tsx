import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useCreateTopic, useForumCategories } from '../hooks/useForum';
import type { TopicFormData } from '../types';

export function NewTopicModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTopic();
  const { data: categories } = useForumCategories();
  const [form, setForm] = useState<TopicFormData>({ category_id: '', title: '', body: '' });

  const set = <K extends keyof TopicFormData>(key: K, value: TopicFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>موضوع جديد</h2>
        <label style={label}>القسم
          <select className="input" style={input} value={form.category_id} onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : '')} required>
            <option value="">— اختر —</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label style={label}>العنوان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <label style={label}>المحتوى
          <textarea className="input" style={{ ...input, minHeight: '120px' }} value={form.body} onChange={(e) => set('body', e.target.value)} required />
        </label>
        {create.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(create.error, 'تعذّر النشر')}</p>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={create.isPending}>{create.isPending ? 'جارٍ النشر…' : 'نشر'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
