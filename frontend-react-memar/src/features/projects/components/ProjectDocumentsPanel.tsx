import type { CSSProperties } from 'react';

import type { ContractStatus, ProjectDocFile } from '../api/projectsApi';
import { useProjectDocuments } from '../hooks/useProjectDocuments';

const money = (v: string | null) => (v ? `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك` : '—');
const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} ب`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
};
const fileIcon = (ext: string | null) => {
  const e = (ext ?? '').toLowerCase();
  if (['pdf'].includes(e)) return '📕';
  if (['doc', 'docx'].includes(e)) return '📘';
  if (['xls', 'xlsx', 'csv'].includes(e)) return '📗';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return '🖼️';
  if (['dwg', 'dxf'].includes(e)) return '📐';

  return '📄';
};

const CONTRACT_STATUS: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: '#6B7280' },
  signed: { label: 'موقّع', color: '#059669' },
  active: { label: 'ساري', color: '#1B6CA8' },
  closed: { label: 'منتهٍ', color: '#274A78' },
  cancelled: { label: 'ملغى', color: '#DC2626' },
};

/** تبويب العقد (PROJ-3): عقود المشروع وتفاصيلها. */
export function ProjectContractTab({ projectId }: { projectId: number }) {
  const { data, isLoading, isError } = useProjectDocuments(projectId);

  if (isLoading) return <div className="card" style={card}>جارٍ التحميل…</div>;
  if (isError || !data) return <div className="card" style={card}>تعذّر تحميل العقد.</div>;

  if (data.contracts.length === 0) {
    return <div className="card" style={card}><Empty icon="📜" text="لا يوجد عقد مرتبط بهذا المشروع بعد." /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.contracts.map((c) => {
        const st = CONTRACT_STATUS[c.status];

        return (
          <div key={c.id} className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>📜 عقد {c.number ?? `#${c.id}`}</div>
                <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '3px' }}>العميل: {c.client?.name ?? '—'}</div>
              </div>
              <span style={{ ...pill, background: `${st.color}1a`, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '14px' }}>
              <Meta label="قيمة العقد" value={money(c.value_kwd)} />
              <Meta label="تاريخ البداية" value={shortDate(c.start_date)} />
              <Meta label="تاريخ الانتهاء" value={shortDate(c.end_date)} />
            </div>
            {c.notes && <div style={{ fontSize: '12.5px', color: '#5A6478', marginTop: '12px', whiteSpace: 'pre-wrap' }}>{c.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** تبويب المستندات (PROJ-3): المستندات المولّدة + ملفات المشروع. */
export function ProjectDocumentsTab({ projectId }: { projectId: number }) {
  const { data, isLoading, isError } = useProjectDocuments(projectId);

  if (isLoading) return <div className="card" style={card}>جارٍ التحميل…</div>;
  if (isError || !data) return <div className="card" style={card}>تعذّر تحميل المستندات.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="card" style={{ padding: '18px' }}>
        <h4 style={h4}>📑 المستندات المولّدة ({data.documents.length})</h4>
        {data.documents.length === 0 ? <Empty icon="📑" text="لا توجد مستندات مولّدة." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.documents.map((d) => (
              <div key={d.id} style={row}>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>📄 {d.title}</span>
                <span style={{ fontSize: '11px', color: '#8A93A3' }}>{shortDate(d.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '18px' }}>
        <h4 style={h4}>🗂️ ملفات المشروع ({data.files.length})</h4>
        {data.files.length === 0 ? <Empty icon="🗂️" text="لا توجد ملفات مرفوعة." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.files.map((f) => <FileRow key={f.id} file={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FileRow({ file }: { file: ProjectDocFile }) {
  return (
    <a href={`/api/v1/files/${file.id}/download`} target="_blank" rel="noreferrer" style={{ ...row, textDecoration: 'none', color: 'inherit' }}>
      <span style={{ fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span>{fileIcon(file.extension)}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.original_name ?? file.name}</span>
      </span>
      <span style={{ fontSize: '11px', color: '#8A93A3', display: 'flex', gap: '8px', flexShrink: 0 }}>
        {fileSize(file.size) && <span>{fileSize(file.size)}</span>}
        <span>⬇️ تنزيل</span>
      </span>
    </a>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#274A78' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return <div style={{ textAlign: 'center', padding: '24px', color: '#8A93A3' }}><div style={{ fontSize: '26px', marginBottom: '6px' }}>{icon}</div><div style={{ fontSize: '13px' }}>{text}</div></div>;
}

const card: CSSProperties = { padding: '20px' };
const h4: CSSProperties = { margin: '0 0 12px', fontSize: '14px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '9px 11px', border: '1px solid #EEF2F7', borderRadius: '8px' };
const pill: CSSProperties = { fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '10px', whiteSpace: 'nowrap' };
