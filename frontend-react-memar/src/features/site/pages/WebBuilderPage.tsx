import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveSiteSettings, useSiteSettings } from '../hooks/useSite';
import { SETTING_GROUPS, type SiteSettings } from '../types';

export function WebBuilderPage() {
  const { data, isLoading, isError } = useSiteSettings();
  const save = useSaveSiteSettings();
  const [form, setForm] = useState<SiteSettings>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (key: string, value: string) => { setForm((f) => ({ ...f, [key]: value })); setSaved(false); };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>إدارة الموقع</h1>
      </div>
      <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '18px' }}>
        محتوى الموقع العام — يظهر في الصفحة الرئيسية والتذييل ومعلومات التواصل.
      </p>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الإعدادات.</p>}

      {data && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', maxWidth: '760px' }}>
          {SETTING_GROUPS.map((group) => (
            <div key={group.title} className="card" style={{ padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#274A78' }}>{group.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {group.fields.map((f) => (
                  <label key={f.key} style={{ ...label, gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto' }}>
                    {f.label}
                    {f.type === 'textarea' ? (
                      <textarea className="input" style={{ ...input, minHeight: '80px' }} value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} dir={f.dir} placeholder={f.placeholder} />
                    ) : (
                      <input className="input" style={input} value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} dir={f.dir} placeholder={f.placeholder} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}</button>
            {saved && <span style={{ color: '#059669', fontSize: '14px' }}>✓ تم الحفظ</span>}
          </div>
        </form>
      )}
    </div>
  );
}

const label: CSSProperties = { display: 'block', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
