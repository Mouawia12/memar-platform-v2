import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useRenameProject } from '../hooks/useProjects';

interface Props {
  projectId: number;
  name: string;
  /** رقم المشروع (PRJ-0001) — يُعرض بجانب الاسم إن وُجد. */
  code?: string | null;
  /** بادئة اختيارية (أيقونة مثل 🏗️). */
  prefix?: string;
}

/**
 * اسم المشروع الموحّد قابلاً للتعديل من أي صفحة يظهر فيها (المهام، CRM…).
 * المشروع هو مصدر الحقيقة الوحيد للاسم، فالحفظ يكتب على سجل المشاريع
 * وينعكس تلقائياً في كل مكان. زرّ التعديل يظهر للطاقم المخوّل فقط (projects.manage).
 */
export function ProjectNameInline({ projectId, name, code, prefix }: Props) {
  const canManage = usePermission('projects.manage');
  const rename = useRenameProject();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [err, setErr] = useState('');

  const label = (
    <>
      {prefix ? `${prefix} ` : ''}
      {name}
      {code ? <span style={{ color: '#8A93A3' }}> · {code}</span> : null}
    </>
  );

  if (!canManage) return <span>{label}</span>;

  const submit = () => {
    const next = value.trim();
    if (next.length < 2) { setErr('اسم المشروع قصير جداً.'); return; }
    if (next === name) { setEditing(false); setErr(''); return; }
    rename.mutate({ id: projectId, name: next }, {
      onSuccess: () => { setEditing(false); setErr(''); },
      onError: () => setErr('تعذّر حفظ الاسم — حاول مجدداً.'),
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(name); setEditing(true); }}
        title="تعديل اسم المشروع — يُحدَّث في كل الصفحات"
        style={triggerBtn}
      >
        {label} <span style={{ fontSize: '11px', color: '#8A93A3' }}>✎</span>
      </button>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <input
        className="input"
        autoFocus
        value={value}
        onChange={(e) => { setValue(e.target.value); setErr(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setEditing(false); setErr(''); } }}
        style={{ fontSize: '13px', padding: '2px 8px', minWidth: '160px' }}
      />
      <button className="btn btn-primary btn-sm" type="button" disabled={rename.isPending} onClick={submit}>
        {rename.isPending ? '…' : 'حفظ'}
      </button>
      <button className="btn btn-sm" type="button" onClick={() => { setEditing(false); setErr(''); }}>إلغاء</button>
      {err && <span style={{ color: '#DC2626', fontSize: '11.5px' }}>{err}</span>}
    </span>
  );
}

const triggerBtn: CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' };
