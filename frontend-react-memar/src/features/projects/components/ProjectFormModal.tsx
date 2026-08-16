import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { queryClient } from '../../../lib/queryClient';
import { usePermission } from '../../auth/hooks/usePermission';
import { contactsApi } from '../../clients/api/contactsApi';
import { CLIENT_KIND_LABELS, type ClientKind } from '../../clients/types';
import { useContacts } from '../../clients/hooks/useContacts';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useSaveProject } from '../hooks/useProjects';
import { PROJECT_STATUS_LABELS, type Project, type ProjectFormData, type ProjectStatus } from '../types';

interface Props {
  project: Project | null;
  onClose: () => void;
}

const empty: ProjectFormData = {
  name: '', client_id: '', manager_id: '', status: 'draft',
  budget_kwd: '', start_date: '', end_date: '', description: '',
};

const emptyClient = { full_name: '', client_kind: 'individual' as ClientKind, phone: '', email: '', company: '' };

export function ProjectFormModal({ project, onClose }: Props) {
  const save = useSaveProject();
  // القيمة المالية تظهر وتُحرَّر فقط لأصحاب صلاحية finance.view. طلب أيمن 2026-08-09.
  const canFinance = usePermission('finance.view');
  const { data: clientsData } = useContacts({ type: 'client', per_page: 100 });
  const { data: usersData } = useAssignableUsers();
  const [form, setForm] = useState<ProjectFormData>(empty);

  // إضافة بيانات عميل جديد أثناء إنشاء المشروع + نوعه فرد/شركة (طلب أيمن 2026-08-14).
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [newClient, setNewClient] = useState(emptyClient);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        client_id: project.client?.id ?? '',
        manager_id: project.manager?.id ?? '',
        status: project.status,
        budget_kwd: project.budget_kwd ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        description: project.description ?? '',
      });
    } else {
      setForm(empty);
    }
    setClientMode('existing');
    setNewClient(emptyClient);
    setErr(null);
  }, [project]);

  const set = <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setNC = <K extends keyof typeof emptyClient>(key: K, value: (typeof emptyClient)[K]) => setNewClient((c) => ({ ...c, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);

    let clientId: number | '' = form.client_id;

    // عميل جديد: نُنشئه أولًا (type=client) ثم نربطه بالمشروع.
    if (clientMode === 'new') {
      if (!newClient.full_name.trim()) { setErr('اسم العميل الجديد مطلوب.'); return; }
      try {
        setBusy(true);
        const created = await contactsApi.create({
          full_name: newClient.full_name.trim(),
          type: 'client',
          client_kind: newClient.client_kind,
          phone: newClient.phone.trim() || null,
          email: newClient.email.trim() || null,
          company: newClient.client_kind === 'company' ? (newClient.company.trim() || null) : null,
        });
        clientId = created.id;
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } catch (error) {
        setErr(apiErrorMessage(error, 'تعذّر إنشاء العميل الجديد.'));
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    save.mutate({ id: project?.id, data: { ...form, client_id: clientId } }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{project ? `تعديل مشروع ${project.code ?? ''}` : 'مشروع جديد'}</h2>

        <label style={label}>اسم المشروع
          <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>

        {/* ── العميل: موجود أو جديد ── */}
        <div style={{ marginTop: '12px', border: '1px solid #E4E8EF', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>العميل</span>
            <div style={{ display: 'flex', gap: '6px', marginInlineStart: 'auto' }}>
              <button type="button" onClick={() => setClientMode('existing')} style={{ ...seg, ...(clientMode === 'existing' ? segOn : null) }}>عميل موجود</button>
              <button type="button" onClick={() => setClientMode('new')} style={{ ...seg, ...(clientMode === 'new' ? segOn : null) }}>+ عميل جديد</button>
            </div>
          </div>

          {clientMode === 'existing' ? (
            <select className="input" style={input} value={form.client_id} onChange={(e) => set('client_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {clientsData?.data.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ ...label, marginTop: 0, gridColumn: '1 / -1' }}>نوع العميل
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {(Object.keys(CLIENT_KIND_LABELS) as ClientKind[]).map((k) => (
                    <button key={k} type="button" onClick={() => setNC('client_kind', k)} style={{ ...seg, ...(newClient.client_kind === k ? segOn : null) }}>
                      {k === 'company' ? '🏢 ' : '👤 '}{CLIENT_KIND_LABELS[k]}
                    </button>
                  ))}
                </div>
              </label>
              <label style={{ ...label, marginTop: 0 }}>{newClient.client_kind === 'company' ? 'اسم جهة الاتصال' : 'الاسم'}
                <input className="input" style={input} value={newClient.full_name} onChange={(e) => setNC('full_name', e.target.value)} placeholder="مثال: أحمد المنصور" />
              </label>
              {newClient.client_kind === 'company' && (
                <label style={{ ...label, marginTop: 0 }}>اسم الشركة
                  <input className="input" style={input} value={newClient.company} onChange={(e) => setNC('company', e.target.value)} placeholder="مثال: شركة المنصور للاستثمار" />
                </label>
              )}
              <label style={{ ...label, marginTop: 0 }}>الهاتف
                <input className="input" style={input} value={newClient.phone} onChange={(e) => setNC('phone', e.target.value)} />
              </label>
              <label style={{ ...label, marginTop: 0 }}>البريد
                <input className="input" style={input} type="email" value={newClient.email} onChange={(e) => setNC('email', e.target.value)} />
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <label style={label}>مدير المشروع
            <select className="input" style={input} value={form.manager_id} onChange={(e) => set('manager_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          {canFinance && (
            <label style={label}>الميزانية (د.ك)
              <input className="input" style={input} type="number" step="0.001" min="0" value={form.budget_kwd} onChange={(e) => set('budget_kwd', e.target.value)} />
            </label>
          )}
          <label style={label}>تاريخ البدء
            <input className="input" style={input} type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </label>
          <label style={label}>تاريخ الانتهاء
            <input className="input" style={input} type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </label>
        </div>

        <label style={label}>الوصف
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>

        {(err || save.isError) && <p style={{ color: '#ef4444' }}>{err ?? apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending || busy}>
            {busy ? 'جارٍ إنشاء العميل…' : save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const seg: CSSProperties = { padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#334155', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' };
const segOn: CSSProperties = { borderColor: '#274A78', background: '#EBF2FB', color: '#274A78' };
