import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { AssignedProjectCard, timeAgo } from '../components/AssignedProjectCard';
import { useTeamMemberProjects, useTeamProjects } from '../hooks/useMyProjects';

/** نظرة الأدمن على مشاريع الفريق (بند 11-14): كل موظف وعدد مشاريعه وما فيها جديد. */
export function TeamProjectsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTeamProjects();
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);
  const memberQ = useTeamMemberProjects(selected?.id ?? null);

  const team = data?.team ?? [];
  const totals = data?.totals;

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>👥 مشاريع الفريق</h1>
        <p style={{ margin: '4px 0 0', color: '#5A6478', fontSize: '13px' }}>تابع مشاريع كل موظف، الجديد فيها، وآخر دخول له.</p>
      </div>

      {totals && (
        <div style={statsGrid}>
          <Stat label="موظفون" value={totals.staff} color="#1B6CA8" icon="fa-users" />
          <Stat label="إسنادات" value={totals.assignments} color="#7C3AED" icon="fa-diagram-project" />
          <Stat label="لديهم جديد" value={totals.with_new} color="#E8A838" icon="fa-bolt" />
        </div>
      )}

      {isLoading && <p style={{ padding: 20 }}>جارٍ التحميل…</p>}
      {isError && <p style={{ padding: 20, color: '#ef4444' }}>تعذّر تحميل مشاريع الفريق.</p>}

      <div style={grid}>
        {team.map((m) => {
          const active = selected?.id === m.id;
          return (
            <button key={m.id} type="button" onClick={() => setSelected(active ? null : { id: m.id, name: m.name })}
              style={{ ...staffCard, borderColor: active ? '#1B6CA8' : m.new_count > 0 ? '#E8A838' : '#E7ECF3', boxShadow: active ? '0 4px 16px rgba(27,108,168,.16)' : undefined }}>
              <div style={avatar}>{m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (m.name?.[0] ?? 'م')}</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F2E4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                {m.role && <div style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600 }}>{m.role}</div>}
                <div style={{ fontSize: '10.5px', color: '#8A93A3', marginTop: '2px' }}><i className="fas fa-eye" /> آخر دخول: {m.last_seen_at ? timeAgo(m.last_seen_at) : '—'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={countPill}><b>{m.projects_count}</b> مشروع</span>
                {m.new_count > 0 && <span style={newPill}><i className="fas fa-bolt" /> {m.new_count} جديد</span>}
              </div>
            </button>
          );
        })}
      </div>
      {data && team.length === 0 && <p style={{ color: '#8A93A3', padding: '20px' }}>لا يوجد موظفون.</p>}

      {/* توسّع: مشاريع الموظف المختار */}
      {selected && (
        <div style={{ marginTop: '22px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 12px' }}>🗂️ مشاريع {selected.name}</h2>
          {memberQ.isLoading && <p>جارٍ التحميل…</p>}
          {memberQ.data && memberQ.data.projects.length === 0 && <p style={{ color: '#8A93A3' }}>لا مشاريع مُسنَدة لهذا الموظف.</p>}
          <div style={grid}>
            {memberQ.data?.projects.map((c) => (
              <AssignedProjectCard key={c.id} card={c} seenLabel="آخر دخول الموظف" onOpen={(id) => navigate(`/projects/${id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: `3px solid ${color}` }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${color}14`, color }}><i className={`fas ${icon}`} /></span>
      <div><div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div><div style={{ fontSize: '12px', color: '#5A6478' }}>{label}</div></div>
    </div>
  );
}

const statsGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '18px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' };
const staffCard: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #E7ECF3', borderInlineStartWidth: '4px', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' };
const avatar: CSSProperties = { width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#274A78,#1B6CA8)', color: '#fff', fontSize: '18px', fontWeight: 800, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(27,108,168,.2)' };
const countPill: CSSProperties = { fontSize: '11px', fontWeight: 600, color: '#1B6CA8', background: 'rgba(27,108,168,.08)', border: '1px solid rgba(27,108,168,.15)', borderRadius: '999px', padding: '2px 9px', whiteSpace: 'nowrap' };
const newPill: CSSProperties = { fontSize: '10px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#E8A838,#D4881F)', borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap' };
