import { useState } from 'react';

import type { CSSProperties } from 'react';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { usePermission } from '../../auth/hooks/usePermission';
import { employeesApi } from '../api/employeesApi';
import { EmployeeCards } from '../components/EmployeeCards';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { useDeleteEmployee, useEmployees, useEmployeeStats } from '../hooks/useEmployees';
import { STATUS_LABELS, type Employee, type EmployeeStatus } from '../types';

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | EmployeeStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const { data, isLoading, isError } = useEmployees({ search: search || undefined, status: status || undefined, page });
  const { data: stats } = useEmployeeStats();
  const del = useDeleteEmployee();
  // بوّابة الإجراءات: إضافة/تعديل = manage؛ حذف = delete. طلب أيمن 2026-08-12.
  const canManage = usePermission('hr.manage');
  const canDelete = usePermission('hr.delete');

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (e: Employee) => { setEditing(e); setModalOpen(true); };
  const handleDelete = (e: Employee) => { if (confirm(`حذف "${e.full_name}"؟`)) del.mutate(e.id); };

  const meta = data?.meta;

  /** يجلب كل الموظفين المطابقين للفلاتر الحالية لتصديرهم. */
  const fetchAllEmployees = async () => {
    const all = await employeesApi.list({ search: search || undefined, status: status || undefined, per_page: 500 });

    return all.data;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الموظفون</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportCsvButton
            filename="employees"
            fetchRows={fetchAllEmployees}
            columns={[
              { header: 'الاسم', value: (r: Employee) => r.full_name },
              { header: 'المسمّى الوظيفي', value: (r: Employee) => r.job_title },
              { header: 'القسم', value: (r: Employee) => r.department },
              { header: 'تاريخ التعيين', value: (r: Employee) => r.hire_date },
              { header: 'الراتب الأساسي (د.ك)', value: (r: Employee) => r.base_salary_kwd },
              { header: 'الهاتف', value: (r: Employee) => r.phone },
              { header: 'الحالة', value: (r: Employee) => STATUS_LABELS[r.status] },
            ]}
          />
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ موظف جديد</button>}
        </div>
      </div>

      {/* ملخّص الفريق — بطاقات مؤشّرات (إجماليات حقيقية من قاعدة البيانات) */}
      <div style={kpiRow}>
        <div style={{ ...kpi, borderColor: '#1B6CA8' }}><div style={kpiIcon('#1B6CA8')}><i className="fas fa-users" /></div><div><div style={kpiVal}>{stats?.total ?? '—'}</div><div style={kpiLbl}>إجمالي الموظفين</div></div></div>
        <div style={{ ...kpi, borderColor: '#2D9B6F' }}><div style={kpiIcon('#2D9B6F')}><i className="fas fa-user-check" /></div><div><div style={kpiVal}>{stats?.active ?? '—'}</div><div style={kpiLbl}>موظفون نشطون</div></div></div>
        <div style={{ ...kpi, borderColor: '#7C3AED' }}><div style={kpiIcon('#7C3AED')}><i className="fas fa-sitemap" /></div><div><div style={kpiVal}>{stats?.departments ?? '—'}</div><div style={kpiLbl}>الأقسام</div></div></div>
        <div style={{ ...kpi, borderColor: '#E8A838' }}><div style={kpiIcon('#E8A838')}><i className="fas fa-sack-dollar" /></div><div><div style={kpiVal}>{stats ? stats.total_payroll_kwd.toLocaleString('ar') : '—'} <span style={{ fontSize: '12px', color: '#64748B' }}>د.ك</span></div><div style={kpiLbl}>إجمالي الرواتب الشهرية</div></div></div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم/المسمّى/القسم…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | EmployeeStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as EmployeeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الموظفين.</p>}
        {data && <EmployeeCards employees={data.data} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <EmployeeFormModal employee={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiRow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '16px' };
const kpi: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #EEF2F7', borderRight: '3px solid', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(15,42,74,.04)' };
const kpiIcon = (c: string): CSSProperties => ({ width: '40px', height: '40px', borderRadius: '11px', display: 'grid', placeItems: 'center', fontSize: '17px', color: c, background: `${c}15`, flexShrink: 0 });
const kpiVal: CSSProperties = { fontSize: '20px', fontWeight: 800, color: '#0F2A4A', lineHeight: 1.1 };
const kpiLbl: CSSProperties = { fontSize: '12px', color: '#6B7688', marginTop: '3px', fontWeight: 600 };
