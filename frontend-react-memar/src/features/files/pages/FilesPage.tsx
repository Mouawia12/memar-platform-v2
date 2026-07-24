import { type CSSProperties, useState } from 'react';

import { filesApi } from '../api/filesApi';
import { FileUploadModal } from '../components/FileUploadModal';
import { useDeleteFile, useFileStats, useFiles } from '../hooks/useFiles';
import { fileIcon, humanSize, type StoredFile } from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');

/** مدير الملفات — رفع وتصفح وتنزيل ملفات المشاريع. */
export function FilesPage() {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading, isError } = useFiles({ search: search || undefined, folder: folder || undefined, page });
  const { data: stats } = useFileStats();
  const del = useDeleteFile();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const handleDownload = (f: StoredFile) => { void filesApi.download(f.id, f.original_name); };
  const handleDelete = (f: StoredFile) => { if (confirm(`حذف الملف "${f.name}"؟`)) del.mutate(f.id); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>مدير الملفات</h1>
        <button className="btn btn-primary" type="button" onClick={() => setUploadOpen(true)}>📤 رفع ملف</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={kpiVal}>{stats?.count ?? 0}</div><div style={kpiLbl}>📁 إجمالي الملفات</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#B45309' }}>{humanSize(stats?.total_size ?? 0)}</div><div style={kpiLbl}>💾 المساحة المستخدمة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#0F766E' }}>{stats?.folders.length ?? 0}</div><div style={kpiLbl}>🗂️ التصنيفات</div></div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="بحث باسم الملف…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '220px' }} />
          <select className="input" value={folder} onChange={(e) => { setFolder(e.target.value); setPage(1); }}>
            <option value="">كل التصنيفات</option>
            {stats?.folders.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الملفات.</p>}

        {data && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#5A6478' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🗂️</div>
            <p>لا توجد ملفات — ابدأ برفع أول ملف.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {rows.map((f) => (
              <div key={f.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ fontSize: '30px', lineHeight: 1 }}>{fileIcon(f.extension)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', wordBreak: 'break-word' }}>{f.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#5A6478', marginTop: '2px' }}>
                      {humanSize(f.size)} · {(f.extension ?? '—').toUpperCase()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#5A6478', lineHeight: 1.8, marginTop: '8px' }}>
                  {f.folder && <div>🗂️ {f.folder}</div>}
                  {f.project && <div>🏗️ {f.project.name}</div>}
                  <div>📅 {fmt(f.created_at)}{f.uploader ? ` · ${f.uploader.name}` : ''}</div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                  <button className="btn btn-sm" type="button" onClick={() => handleDownload(f)}>⬇️ تنزيل</button>
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(f)}>حذف</button>
                </div>
              </div>
            ))}
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

      {uploadOpen && <FileUploadModal folders={stats?.folders ?? []} onClose={() => setUploadOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '24px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
const card: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column' };
