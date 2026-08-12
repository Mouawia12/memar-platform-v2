import { useState, type CSSProperties } from 'react';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { usePermission } from '../../auth/hooks/usePermission';
import { projectsApi } from '../api/projectsApi';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsTable } from '../components/ProjectsTable';
import { useDeleteProject, useProjects } from '../hooks/useProjects';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ProjectStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  // قيمة المشروع تُعرض فقط لأصحاب الصلاحية المالية (محاسب/مدير/أدمن). المهندسون يديرون المشاريع بلا سعر. طلب أيمن 2026-08-09.
  const canFinance = usePermission('finance.view');
  // بوّابة الإجراءات: عرض فقط = قراءة؛ إضافة/تعديل = manage؛ حذف = delete. طلب أيمن 2026-08-12.
  const canManage = usePermission('projects.manage');
  const canDelete = usePermission('projects.delete');

  const { data, isLoading, isError } = useProjects({ search: search || undefined, status: status || undefined, page });
  const allQuery = useProjects({ per_page: 500 });
  const del = useDeleteProject();

  const all = allQuery.data?.data ?? [];
  const count = (s: ProjectStatus) => all.filter((p) => p.status === s).length;
  const totalBudget = all.reduce((sum, p) => sum + Number(p.budget_kwd ?? 0), 0);
  const vipCount = all.filter((p) => p.is_vip).length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setModalOpen(true); };
  const handleDelete = (p: Project) => { if (confirm(`حذف مشروع "${p.name}"؟`)) del.mutate(p.id); };

  const meta = data?.meta;

  /** يجلب كل المشاريع المطابقة للفلاتر الحالية لتصديرها. */
  const fetchAllProjects = async () => {
    const all = await projectsApi.list({ search: search || undefined, status: status || undefined, per_page: 500 });

    return all.data;
  };

  return (
    <div>
      {/* بانر المشاريع مع مؤشرات سريعة (PROJ-6) */}
      <div style={banner}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>🏗️ المشاريع</h1>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)', marginTop: '4px' }}>إدارة مشاريع المكتب الهندسي ومتابعة مراحلها وتحصيلها</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ExportCsvButton
              filename="projects"
              fetchRows={fetchAllProjects}
              columns={[
                { header: 'الكود', value: (r: Project) => r.code },
                { header: 'المشروع', value: (r: Project) => r.name },
                { header: 'العميل', value: (r: Project) => r.client?.name },
                { header: 'مدير المشروع', value: (r: Project) => r.manager?.name },
                { header: 'الحالة', value: (r: Project) => PROJECT_STATUS_LABELS[r.status] },
                ...(canFinance ? [{ header: 'الميزانية (د.ك)', value: (r: Project) => r.budget_kwd }] : []),
                { header: 'البداية', value: (r: Project) => r.start_date },
                { header: 'النهاية', value: (r: Project) => r.end_date },
              ]}
            />
            {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ مشروع جديد</button>}
          </div>
        </div>

        <div style={kpiRow}>
          <Kpi label="إجمالي المشاريع" value={String(all.length)} />
          <Kpi label="نشطة" value={String(count('active'))} accent="#6EE7B7" />
          <Kpi label="قيد المراجعة" value={String(count('review'))} accent="#C4B5FD" />
          <Kpi label="معلّقة" value={String(count('on_hold'))} accent="#FCD34D" />
          <Kpi label="منجزة" value={String(count('done'))} accent="#93C5FD" />
          <Kpi label="عملاء VIP" value={String(vipCount)} accent="#FDBA74" />
          {canFinance && <Kpi label="إجمالي الميزانيات" value={`${totalBudget.toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`} />}
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم أو الكود…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | ProjectStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المشاريع.</p>}
        {data && <ProjectsTable projects={data.data} onEdit={openEdit} onDelete={handleDelete} showBudget={canFinance} canManage={canManage} canDelete={canDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ProjectFormModal project={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function Kpi({ label, value, accent = '#fff' }: { label: string; value: string; accent?: string }) {
  return (
    <div style={kpiTile}>
      <div style={{ fontSize: '19px', fontWeight: 800, color: accent }}>{value}</div>
      <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,.75)', marginTop: '2px', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

const banner: CSSProperties = { background: 'linear-gradient(135deg,#274A78,#1B6CA8)', borderRadius: '14px', padding: '22px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(39,74,120,.25)' };
const kpiRow: CSSProperties = { display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' };
const kpiTile: CSSProperties = { flex: '1 1 auto', minWidth: '110px', background: 'rgba(255,255,255,.1)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,.14)' };
