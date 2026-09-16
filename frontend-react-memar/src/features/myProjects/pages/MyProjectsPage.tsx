import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { usePermission } from '../../auth/hooks/usePermission';
import { myProjectsApi, type MyProjectCard } from '../api/myProjectsApi';
import { FollowProjectModal } from '../components/FollowProjectModal';
import { MyProjectTile } from '../components/MyProjectTile';
import { useMyProjects } from '../hooks/useMyProjects';
import '../myProjects.css';

type Sort = 'activity' | 'progress' | 'name';
type Tab = 'all' | 'new' | 'running' | 'tasks' | 'late' | 'done';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'activity', label: 'الأحدث نشاطًا' },
  { key: 'progress', label: 'الأقلّ تقدّمًا' },
  { key: 'name', label: 'الاسم' },
];

/** التبويبات — كل واحدة سؤالٌ يسأله الموظف عن مشاريعه. */
const TABS: { key: Tab; label: string; icon: string; match: (c: MyProjectCard) => boolean }[] = [
  { key: 'all', label: 'الكل', icon: 'fa-layer-group', match: () => true },
  { key: 'new', label: 'فيها جديد', icon: 'fa-bolt', match: (c) => c.has_new },
  { key: 'running', label: 'جارية', icon: 'fa-play', match: (c) => c.status === 'active' },
  { key: 'tasks', label: 'لي فيها مهامّ', icon: 'fa-list-check', match: (c) => (c.my_open_tasks ?? 0) > 0 },
  { key: 'late', label: 'متأخّرة', icon: 'fa-triangle-exclamation', match: (c) => !!c.is_late || (c.my_overdue_tasks ?? 0) > 0 },
  { key: 'done', label: 'منتهية', icon: 'fa-flag-checkered', match: (c) => c.status === 'done' },
];

const norm = (s: string) => s.toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

function sortCards(list: MyProjectCard[], sort: Sort): MyProjectCard[] {
  const at = (c: MyProjectCard) => (c.last_activity_at ? new Date(c.last_activity_at).getTime() : 0);

  return [...list].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar');
    if (sort === 'progress') return a.progress - b.progress || at(b) - at(a);

    // الأحدث نشاطًا — وما فيه جديد يتقدّم دائمًا فهو ما ينتظر ردّي.
    return Number(b.has_new) - Number(a.has_new) || at(b) - at(a);
  });
}

/**
 * «مشاريعي» — مشاريعي وحدها لا سجل المكتب (طلب أيمن 2026-09-16): ما أُديره،
 * وما أُسنِد إليّ، وما لي فيه مهامّ. لوحةٌ بأرقامها وتبويباتها وبطاقاتها.
 */
export function MyProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canManage = usePermission('projects.manage');
  const [tab, setTab] = useState<Tab>('all');
  const [term, setTerm] = useState('');
  const [sort, setSort] = useState<Sort>('activity');
  const [following, setFollowing] = useState(false);
  const { data, isLoading, isError } = useMyProjects();

  const open = (id: number) => {
    myProjectsApi.markSeen(id).finally(() => qc.invalidateQueries({ queryKey: ['my-projects'] }));
    navigate(`/projects/${id}`);
  };

  const projects = useMemo(() => data?.projects ?? [], [data]);

  const counts = useMemo(() => {
    const map = {} as Record<Tab, number>;
    TABS.forEach((t) => { map[t.key] = projects.filter(t.match).length; });

    return map;
  }, [projects]);

  const shown = useMemo(() => {
    const t = norm(term.trim());
    const tabMatch = TABS.find((x) => x.key === tab)?.match ?? (() => true);
    const filtered = projects.filter((p) => {
      if (!tabMatch(p)) return false;
      if (!t) return true;

      return [p.name, p.code, p.client, p.manager, p.current_stage].some((v) => v && norm(v).includes(t));
    });

    return sortCards(filtered, sort);
  }, [projects, tab, term, sort]);

  const myTasks = projects.reduce((n, p) => n + (p.my_open_tasks ?? 0), 0);
  const overdue = projects.reduce((n, p) => n + (p.my_overdue_tasks ?? 0), 0);
  const newCount = data?.new_count ?? 0;

  return (
    <div>
      <div className="mypr-hero">
        <div className="mypr-hero-top">
          <div>
            <h1>🗂️ مشاريعي</h1>
            <p>ما أُديره أو أُسنِد إليّ أو لي فيه مهامّ — تقدّمه وجديده في لوحة واحدة.</p>
          </div>
          {canManage && (
            <button type="button" className="mypr-hero-btn" onClick={() => setFollowing(true)}>
              <i className="fas fa-plus" /> تابِع مشروعًا
            </button>
          )}
        </div>

        <div className="mypr-stats">
          <div className="mypr-stat">
            <i className="fas fa-diagram-project" />
            <span><b>{projects.length}</b> مشروع</span>
          </div>
          <div className="mypr-stat">
            <i className="fas fa-play" style={{ color: '#6EE7B7' }} />
            <span><b>{counts.running ?? 0}</b> جارٍ الآن</span>
          </div>
          <div className="mypr-stat">
            <i className="fas fa-list-check" style={{ color: '#C4B5FD' }} />
            <span><b>{myTasks}</b> مهمّة لي{overdue > 0 ? ` · ${overdue} متأخّرة` : ''}</span>
          </div>
          <div className="mypr-stat">
            <i className="fas fa-bolt" style={{ color: '#FCD34D' }} />
            <span><b>{newCount}</b> فيها جديد</span>
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="mypr-tools">
          <div className="mypr-chips">
            {TABS.filter((t) => t.key === 'all' || counts[t.key] > 0).map((t) => (
              <button key={t.key} type="button" className={`mypr-chip${tab === t.key ? ' is-on' : ''}`} onClick={() => setTab(t.key)}>
                <i className={`fas ${t.icon}`} /> {t.label}
                <span className="mypr-chip-n">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <input className="input mypr-search" placeholder="ابحث باسم المشروع أو رمزه أو عميله…" value={term} onChange={(e) => setTerm(e.target.value)} />
          <select className="input mypr-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>ترتيب: {s.label}</option>)}
          </select>
        </div>
      )}

      {isLoading && (
        <div className="mypr-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="mypr-skel" />)}
        </div>
      )}
      {isError && <p style={{ padding: 20, color: '#ef4444' }}>تعذّر تحميل مشاريعك.</p>}

      {data && projects.length === 0 && (
        <div className="mypr-empty">
          <div style={{ fontSize: '42px' }}>🗂️</div>
          <h3>لا مشروع لك فيه صلة بعد</h3>
          <p>يظهر هنا ما يُسنَد إليك، وما تُعيَّن مديرًا له، وما تُكلَّف فيه بمهمّة — ومعه تنبيهٌ بكل جديد فيه.</p>
          <div className="mypr-empty-actions">
            {canManage && <button className="btn btn-primary" type="button" onClick={() => setFollowing(true)}><i className="fas fa-plus" /> تابِع مشروعًا</button>}
            <button className="btn" type="button" onClick={() => navigate('/projects')}><i className="fas fa-list" /> سجل المشاريع</button>
          </div>
        </div>
      )}

      {projects.length > 0 && shown.length === 0 && (
        <div className="mypr-empty">
          <h3>لا مشروع يطابق ما تبحث عنه</h3>
          <div className="mypr-empty-actions">
            <button className="btn btn-sm" type="button" onClick={() => { setTerm(''); setTab('all'); }}>مسح البحث والتبويب</button>
          </div>
        </div>
      )}

      <div className="mypr-grid">
        {shown.map((c, i) => <MyProjectTile key={c.id} card={c} onOpen={open} index={i} />)}
      </div>

      {following && <FollowProjectModal followedIds={projects.map((p) => p.id)} onClose={() => setFollowing(false)} />}
    </div>
  );
}
