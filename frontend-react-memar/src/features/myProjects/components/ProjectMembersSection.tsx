import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { timeAgo } from './AssignedProjectCard';
import { useAssignableMembers, useAssignMember, useProjectMembers, useUnassignMember } from '../hooks/useMyProjects';

/**
 * الفريق المكلّف بالمشروع — الأدمن يُسنِد/يزيل موظفين (يجيه إشعار)، ويظهر آخر دخول كلٍّ
 * منهم. يدعم المشاركة (أكثر من موظف على نفس المشروع). (بند 11-14)
 */
export function ProjectMembersSection({ projectId }: { projectId: number }) {
  const canManage = usePermission('projects.manage');
  const { data: members, isLoading } = useProjectMembers(projectId);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState<number | ''>('');
  const [role, setRole] = useState('');
  const { data: assignable } = useAssignableMembers(projectId, adding);
  const assign = useAssignMember(projectId);
  const unassign = useUnassignMember(projectId);

  const submit = () => {
    if (!pick) return;
    assign.mutate({ userId: Number(pick), role: role.trim() || null }, {
      onSuccess: () => { setPick(''); setRole(''); setAdding(false); },
    });
  };

  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>👥 الفريق المكلّف {members && <span style={{ color: '#8A93A3', fontSize: '13px', fontWeight: 400 }}>({members.length})</span>}</h3>
        {canManage && !adding && <button className="btn btn-sm btn-primary" type="button" onClick={() => setAdding(true)}><i className="fas fa-user-plus" /> إسناد موظف</button>}
      </div>

      {canManage && adding && (
        <div style={addBox}>
          <select className="input" value={pick} onChange={(e) => setPick(e.target.value ? Number(e.target.value) : '')} style={{ flex: 1, minWidth: '160px' }} autoFocus>
            <option value="">اختر موظفًا…</option>
            {(assignable ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="input" placeholder="الدور في المشروع (اختياري)" value={role} onChange={(e) => setRole(e.target.value)} style={{ flex: 1, minWidth: '160px' }} />
          <button className="btn btn-sm btn-primary" type="button" disabled={!pick || assign.isPending} onClick={submit}>إسناد</button>
          <button className="btn btn-sm" type="button" onClick={() => { setAdding(false); setPick(''); setRole(''); }}>إلغاء</button>
        </div>
      )}

      {isLoading && <p style={{ color: '#8A93A3', fontSize: '13px', marginTop: '12px' }}>جارٍ التحميل…</p>}
      {members && members.length === 0 && !adding && <p style={{ color: '#8A93A3', fontSize: '13px', marginTop: '12px' }}>لا موظفين مُسنَدين بعد.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
        {members?.map((m) => (
          <div key={m.id} style={row}>
            <div style={avatar}>{m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (m.name?.[0] ?? 'م')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F2E4D' }}>{m.name}</div>
              <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {m.role_on_project && <span style={{ color: '#7C3AED', fontWeight: 600 }}><i className="fas fa-user-tag" /> {m.role_on_project}</span>}
                <span><i className="fas fa-eye" /> آخر دخول: {m.last_seen_at ? timeAgo(m.last_seen_at) : 'لم يفتحه بعد'}</span>
              </div>
            </div>
            {canManage && (
              <button type="button" title="إلغاء الإسناد" onClick={() => { if (confirm(`إزالة ${m.name} من المشروع؟`)) unassign.mutate(m.id); }} style={removeBtn}>
                <i className="fas fa-user-minus" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const addBox: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px', padding: '12px', background: '#F8FAFC', border: '1px solid #E7ECF3', borderRadius: '10px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#fff', border: '1px solid #EEF2F7', borderRadius: '10px' };
const avatar: CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#274A78,#1B6CA8)', color: '#fff', fontSize: '15px', fontWeight: 800 };
const removeBtn: CSSProperties = { flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' };
