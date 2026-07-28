import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useChangeStatus } from '../hooks/useProjectStatus';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types';

const STATUSES: ProjectStatus[] = ['draft', 'active', 'review', 'on_hold', 'done', 'cancelled'];

/** شارة حالة المشروع + تغييرها مع سبب إلزامي (PROJ-5) — التغيير للطاقم المخوّل. */
export function ProjectStatusControl({ project }: { project: Project }) {
  const canManage = usePermission('projects.manage');
  const change = useChangeStatus(project.id);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const badge = (
    <span style={{ ...badgeBase, background: `${PROJECT_STATUS_COLORS[project.status]}1a`, color: PROJECT_STATUS_COLORS[project.status] }}>
      {PROJECT_STATUS_LABELS[project.status]}
    </span>
  );

  if (!canManage) return badge;

  const submit = () => {
    if (reason.trim().length < 3) { setErr('اذكر سبب تغيير الحالة (٣ أحرف على الأقل).'); return; }
    if (status === project.status) { setErr('اختر حالة مختلفة عن الحالية.'); return; }
    change.mutate({ status, reason: reason.trim() }, { onSuccess: () => { setOpen(false); setReason(''); setErr(''); } });
  };

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => { setOpen((o) => !o); setStatus(project.status); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
        {badge} <span style={{ fontSize: '11px', color: '#8A93A3' }}>✎</span>
      </button>

      {open && (
        <div style={popover}>
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>تغيير حالة المشروع</div>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} style={{ width: '100%', marginBottom: '8px' }}>
            {STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
          </select>
          <textarea
            className="input"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setErr(''); }}
            rows={2}
            placeholder="سبب التغيير (إلزامي) — يُسجَّل في التايم‌لاين"
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
          {err && <div style={{ color: '#DC2626', fontSize: '11.5px', marginTop: '4px' }}>{err}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="btn btn-primary btn-sm" type="button" disabled={change.isPending} onClick={submit}>{change.isPending ? '…' : 'حفظ'}</button>
            <button className="btn btn-sm" type="button" onClick={() => { setOpen(false); setErr(''); }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

const badgeBase: CSSProperties = { padding: '4px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' };
const popover: CSSProperties = { position: 'absolute', insetInlineEnd: 0, top: 'calc(100% + 8px)', zIndex: 20, width: '280px', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,.14)', padding: '14px' };
