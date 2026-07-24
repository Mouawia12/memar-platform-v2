import { type CSSProperties, useState } from 'react';

import { applicationsApi } from '../api/careersApi';
import { useApplications, useDeleteApplication, useUpdateApplication } from '../hooks/useCareers';
import {
  APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS,
  type ApplicationStatus, type JobApplication,
} from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');

/** طلبات التوظيف الواردة من صفحة /jobs العامة — مراجعة وتغيير الحالة وتنزيل السيرة. */
export function ApplicationsTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ApplicationStatus>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useApplications({ search: search || undefined, status: status || undefined, page });
  const update = useUpdateApplication();
  const del = useDeleteApplication();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const downloadCv = (a: JobApplication) => { void applicationsApi.downloadCv(a.id, a.cv_name ?? `cv-${a.id}.pdf`); };
  const remove = (a: JobApplication) => { if (confirm(`حذف طلب "${a.applicant_name}"؟`)) del.mutate(a.id); };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input className="input" placeholder="بحث بالاسم أو الهاتف…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '220px' }} />
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | ApplicationStatus); setPage(1); }}>
          <option value="">كل الحالات</option>
          {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((k) => <option key={k} value={k}>{APPLICATION_STATUS_LABELS[k]}</option>)}
        </select>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الطلبات.</p>}

      {data && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#5A6478' }}>
          <div style={{ fontSize: '42px', marginBottom: '10px' }}>📭</div>
          <p>لا توجد طلبات توظيف — الطلبات الواردة من صفحة التوظيف العامة تظهر هنا.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>المتقدّم</th>
                <th style={th}>الوظيفة</th>
                <th style={th}>الخبرة</th>
                <th style={th}>المهارات</th>
                <th style={th}>التاريخ</th>
                <th style={th}>الحالة</th>
                <th style={th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td style={td}>
                    <b>{a.applicant_name}</b>
                    <div style={{ fontSize: '12px', opacity: 0.6, direction: 'ltr', textAlign: 'right' }}>{a.phone}</div>
                    {a.email && <div style={{ fontSize: '12px', opacity: 0.6, direction: 'ltr', textAlign: 'right' }}>{a.email}</div>}
                  </td>
                  <td style={td}>{a.job?.title ?? a.position ?? '—'}</td>
                  <td style={td}>{a.experience ?? '—'}</td>
                  <td style={{ ...td, maxWidth: '200px' }}>{a.skills ?? '—'}</td>
                  <td style={td}>{fmt(a.created_at)}</td>
                  <td style={td}>
                    <select
                      className="input"
                      value={a.status}
                      onChange={(e) => update.mutate({ id: a.id, data: { status: e.target.value } })}
                      style={{ ...statusSelect, color: APPLICATION_STATUS_COLORS[a.status], borderColor: APPLICATION_STATUS_COLORS[a.status] }}
                    >
                      {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((k) => <option key={k} value={k}>{APPLICATION_STATUS_LABELS[k]}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {a.has_cv
                      ? <button className="btn btn-sm" type="button" onClick={() => downloadCv(a)}>⬇️ السيرة</button>
                      : <span style={{ fontSize: '12px', opacity: 0.5 }}>بلا سيرة</span>}{' '}
                    <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => remove(a)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
          <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
        </div>
      )}
    </div>
  );
}

const th: CSSProperties = { textAlign: 'start', padding: '10px 14px', borderBottom: '2px solid #E4E8EF', fontSize: '12.5px', color: '#5A6478', fontWeight: 700 };
const td: CSSProperties = { padding: '11px 14px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' };
const statusSelect: CSSProperties = { fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderWidth: '1.5px', borderStyle: 'solid', borderRadius: '6px', background: '#fff' };
