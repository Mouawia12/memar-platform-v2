import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { PROJECT_STATUS_LABELS, type ProjectStatus } from '../../projects/types';
import { myProjectsApi, type MyProjectCard } from '../api/myProjectsApi';
import { AssignedProjectCard } from '../components/AssignedProjectCard';
import { useMyProjects } from '../hooks/useMyProjects';

type Sort = 'activity' | 'progress' | 'name' | 'new';
type Scope = 'mine' | 'all';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'activity', label: 'الأحدث نشاطًا' },
  { key: 'new', label: 'الجديد أولًا' },
  { key: 'progress', label: 'الأقلّ تقدّمًا' },
  { key: 'name', label: 'الاسم' },
];

/** ترتيب الحالات في شريط الفلترة — كما تمرّ في دورة حياة المشروع. */
const STATUS_ORDER: ProjectStatus[] = ['active', 'review', 'on_hold', 'draft', 'done', 'cancelled'];

const norm = (s: string) => s.toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

function sortCards(list: MyProjectCard[], sort: Sort): MyProjectCard[] {
  const at = (c: MyProjectCard) => (c.last_activity_at ? new Date(c.last_activity_at).getTime() : 0);

  return [...list].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar');
    if (sort === 'progress') return a.progress - b.progress || at(b) - at(a);
    if (sort === 'new') return Number(b.has_new) - Number(a.has_new) || at(b) - at(a);

    return at(b) - at(a);
  });
}

/**
 * «مشاريعي» — كل مشروع لي فيه صلة: مُسنَد إليّ، أو أُديره، أو لي فيه مهامّ
 * (طلب أيمن 2026-09-16؛ كانت الصفحة تعرض المُسنَد وحده فتبدو فارغة). ولمن
 * يملك «عرض المشاريع» خيار «كل المشاريع» فوقها.
 */
export function MyProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [scope, setScope] = useState<Scope>('mine');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState<'' | ProjectStatus>('');
  const [sort, setSort] = useState<Sort>('activity');
  // فتح «كل المشاريع» وحده لمن لا صلة له بمشروع بعد — صفحةٌ فارغة لا تفيده بشيء.
  const [autoAll, setAutoAll] = useState(false);
  /** اختيار صريح من المستخدم — بعده لا يُبدَّل المدى تلقائيًّا. */
  const [pinned, setPinned] = useState(false);
  const { data, isLoading, isError } = useMyProjects(scope);

  useEffect(() => {
    if (!pinned && scope === 'mine' && data && data.projects.length === 0 && data.can_view_all) {
      setScope('all');
      setAutoAll(true);
    }
  }, [scope, data, pinned]);

  const pick = (next: Scope) => { setScope(next); setAutoAll(false); setPinned(true); };

  const open = (id: number) => {
    myProjectsApi.markSeen(id).finally(() => qc.invalidateQueries({ queryKey: ['my-projects'] }));
    navigate(`/projects/${id}`);
  };

  const projects = useMemo(() => data?.projects ?? [], [data]);
  const newCount = data?.new_count ?? 0;
  const canViewAll = data?.can_view_all ?? false;

  // الحالات الموجودة فعلًا في مشاريعي — لا تُعرض حالة لا مشروع فيها.
  const statuses = useMemo(
    () => STATUS_ORDER.filter((s) => projects.some((p) => p.status === s)),
    [projects],
  );

  const shown = useMemo(() => {
    const t = norm(term.trim());
    const filtered = projects.filter((p) => {
      if (status && p.status !== status) return false;
      if (!t) return true;

      return [p.name, p.code, p.client, p.manager, p.current_stage].some((v) => v && norm(v).includes(t));
    });

    return sortCards(filtered, sort);
  }, [projects, term, status, sort]);

  const openTasks = projects.reduce((n, p) => n + (p.my_open_tasks ?? 0), 0);
  const running = projects.filter((p) => p.status === 'active').length;

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>🗂️ مشاريعي</h1>
          <p style={{ margin: '4px 0 0', color: '#5A6478', fontSize: '13px' }}>
            {scope === 'mine'
              ? 'ما أُديره أو أُسنِد إليّ أو لي فيه مهامّ — تابع تقدّمه ونقاشاته.'
              : 'كل مشاريع المكتب — وما لي فيه صلة مميّز بشارته.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={statChip}><b style={{ color: '#1B6CA8' }}>{projects.length}</b> مشروع</span>
          {running > 0 && <span style={statChip}><i className="fas fa-play" style={{ color: '#059669' }} /> {running} جارٍ</span>}
          {openTasks > 0 && <span style={statChip}><i className="fas fa-list-check" style={{ color: '#7C3AED' }} /> {openTasks} مهمّة لي</span>}
          {newCount > 0 && <span style={{ ...statChip, color: '#B87514', background: 'rgba(232,168,56,.1)', borderColor: 'rgba(232,168,56,.3)' }}><i className="fas fa-bolt" /> {newCount} فيها جديد</span>}
        </div>
      </div>

      {/* مدى العرض — «كل المشاريع» لمن يملك عرضها فقط. */}
      {canViewAll && (
        <div style={scopeRow}>
          <button type="button" onClick={() => pick('mine')} style={{ ...scopeBtn, ...(scope === 'mine' ? scopeOn : null) }}>مشاريعي</button>
          <button type="button" onClick={() => pick('all')} style={{ ...scopeBtn, ...(scope === 'all' ? scopeOn : null) }}>كل المشاريع</button>
          {autoAll && <span style={autoNote}><i className="fas fa-circle-info" /> لا مشروع لك فيه صلة بعد — هذه كل مشاريع المكتب.</span>}
        </div>
      )}

      {projects.length > 0 && (
        <div style={toolbar}>
          <input
            className="input"
            placeholder="ابحث باسم المشروع أو رمزه أو عميله…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ flex: '1 1 240px', minWidth: '200px' }}
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as '' | ProjectStatus)} style={selectStyle}>
            <option value="">كل الحالات</option>
            {statuses.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={selectStyle}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>ترتيب: {s.label}</option>)}
          </select>
        </div>
      )}

      {isLoading && <p style={{ padding: 20 }}>جارٍ التحميل…</p>}
      {isError && <p style={{ padding: 20, color: '#ef4444' }}>تعذّر تحميل مشاريعك.</p>}

      {data && projects.length === 0 && (
        <div style={empty}>
          <div style={{ fontSize: '40px' }}>📭</div>
          <p style={{ fontWeight: 700, margin: '10px 0 4px' }}>
            {scope === 'mine' ? 'لا مشروع لك فيه صلة بعد' : 'لا مشاريع في السجل بعد'}
          </p>
          <p style={{ color: '#8A93A3', fontSize: '13px', margin: 0 }}>
            {scope === 'mine'
              ? 'سيظهر هنا ما يُسنَد إليك، وما تُعيَّن مديرًا له، وما تُكلَّف فيه بمهمّة.'
              : 'أنشئ مشروعًا من سجل المشاريع ليظهر هنا.'}
          </p>
          {scope === 'mine' && canViewAll && (
            <button className="btn btn-primary" type="button" onClick={() => pick('all')} style={{ marginTop: '14px' }}>
              <i className="fas fa-layer-group" /> اعرض كل المشاريع
            </button>
          )}
        </div>
      )}

      {projects.length > 0 && shown.length === 0 && (
        <div style={empty}>
          <p style={{ fontWeight: 700, margin: 0 }}>لا مشروع يطابق البحث</p>
          <button className="btn btn-sm" type="button" onClick={() => { setTerm(''); setStatus(''); }} style={{ marginTop: '12px' }}>مسح الفلاتر</button>
        </div>
      )}

      <div style={grid}>
        {shown.map((c) => <AssignedProjectCard key={c.id} card={c} onOpen={open} />)}
      </div>
    </div>
  );
}

const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' };
const statChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '5px 14px' };
const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '7px 16px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
const autoNote: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#1B6CA8', background: '#E4F0FA', border: '1px solid #BFDBF0', borderRadius: '999px', padding: '6px 12px' };
const toolbar: CSSProperties = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' };
const selectStyle: CSSProperties = { width: 'auto', minWidth: '150px', flex: '0 0 auto' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' };
const empty: CSSProperties = { textAlign: 'center', padding: '48px 20px', background: '#fff', border: '1px dashed #D9E1EC', borderRadius: '16px' };
