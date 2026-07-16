import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useGenerateDocument, useTemplates } from '../hooks/useDocuments';
import { printDocument } from '../print';
import { extractPlaceholders } from '../types';

interface Props {
  onClose: () => void;
}

export function GenerateModal({ onClose }: Props) {
  const gen = useGenerateDocument();
  const { data: templates } = useTemplates();
  const { data: projects } = useProjects({ per_page: 100 });
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  const template = templates?.data.find((t) => t.id === templateId);
  const placeholders = useMemo(() => (template ? extractPlaceholders(template.body_html) : []), [template]);

  const onTemplateChange = (id: string) => {
    const tid = id ? Number(id) : '';
    setTemplateId(tid);
    const t = templates?.data.find((x) => x.id === Number(id));
    if (t && !title) setTitle(t.name);
  };

  const onProjectChange = (id: string) => {
    const pid = id ? Number(id) : '';
    setProjectId(pid);
    const p = projects?.data.find((x) => x.id === Number(id));
    if (p) {
      const auto: Record<string, string> = {
        client_name: p.client?.name ?? '',
        project_name: p.name,
        project_code: p.code ?? '',
        date: new Date().toLocaleDateString('ar'),
      };
      setValues((v) => ({ ...v, ...auto }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    gen.mutate(
      { template_id: templateId, project_id: projectId === '' ? null : projectId, title, data: values },
      {
        onSuccess: (doc) => {
          printDocument(doc.title, doc.body_html);
          onClose();
        },
      },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>توليد مستند</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>القالب
            <select className="input" style={input} value={templateId} onChange={(e) => onTemplateChange(e.target.value)} required>
              <option value="">— اختر —</option>
              {templates?.data.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label style={label}>المشروع (تعبئة تلقائية)
            <select className="input" style={input} value={projectId} onChange={(e) => onProjectChange(e.target.value)}>
              <option value="">— بدون —</option>
              {projects?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>

        <label style={label}>عنوان المستند
          <input className="input" style={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        {template && placeholders.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <b style={{ fontSize: '14px' }}>الحقول المتغيّرة</b>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              {placeholders.map((key) => (
                <label key={key} style={{ fontSize: '13px' }}>
                  <code dir="ltr">{`{{${key}}}`}</code>
                  <input className="input" style={input} value={values[key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
                </label>
              ))}
            </div>
          </div>
        )}

        {gen.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(gen.error, 'تعذّر التوليد')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={gen.isPending || !templateId}>{gen.isPending ? 'جارٍ التوليد…' : 'توليد وطباعة'}</button>
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
