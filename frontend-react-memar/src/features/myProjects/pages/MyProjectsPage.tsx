import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { myProjectsApi } from '../api/myProjectsApi';
import { AssignedProjectCard } from '../components/AssignedProjectCard';
import { useMyProjects } from '../hooks/useMyProjects';

/** «مشاريعي» — المشاريع المُسنَدة للموظف الحالي مع تمييز الجديد (بند 11-14). */
export function MyProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useMyProjects();

  const open = (id: number) => {
    myProjectsApi.markSeen(id).finally(() => qc.invalidateQueries({ queryKey: ['my-projects'] }));
    navigate(`/projects/${id}`);
  };

  const projects = data?.projects ?? [];
  const newCount = data?.new_count ?? 0;

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>🗂️ مشاريعي</h1>
          <p style={{ margin: '4px 0 0', color: '#5A6478', fontSize: '13px' }}>المشاريع المُسنَدة إليك — تابع تقدّمها ونقاشاتها.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={statChip}><b style={{ color: '#1B6CA8' }}>{projects.length}</b> مشروع</span>
          {newCount > 0 && <span style={{ ...statChip, color: '#B87514', background: 'rgba(232,168,56,.1)', borderColor: 'rgba(232,168,56,.3)' }}><i className="fas fa-bolt" /> {newCount} فيها جديد</span>}
        </div>
      </div>

      {isLoading && <p style={{ padding: 20 }}>جارٍ التحميل…</p>}
      {isError && <p style={{ padding: 20, color: '#ef4444' }}>تعذّر تحميل مشاريعك.</p>}

      {data && projects.length === 0 && (
        <div style={empty}>
          <div style={{ fontSize: '40px' }}>📭</div>
          <p style={{ fontWeight: 700, margin: '10px 0 4px' }}>لا مشاريع مُسنَدة إليك بعد</p>
          <p style={{ color: '#8A93A3', fontSize: '13px', margin: 0 }}>عندما يُسنِد إليك المدير مشروعًا سيظهر هنا مع تنبيه.</p>
        </div>
      )}

      <div style={grid}>
        {projects.map((c) => <AssignedProjectCard key={c.id} card={c} onOpen={open} />)}
      </div>
    </div>
  );
}

const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' };
const statChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '5px 14px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' };
const empty: CSSProperties = { textAlign: 'center', padding: '48px 20px', background: '#fff', border: '1px dashed #D9E1EC', borderRadius: '16px' };
