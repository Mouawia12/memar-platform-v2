import type { CSSProperties } from 'react';

import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type Project } from '../types';

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}

const fmtMoney = (v: string | null) =>
  v === null ? '—' : `${Number(v).toLocaleString('ar')} د.ك`;

export function ProjectsTable({ projects, onEdit, onDelete }: Props) {
  if (projects.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد مشاريع.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الكود</th>
            <th style={th}>المشروع</th>
            <th style={th}>العميل</th>
            <th style={th}>المدير</th>
            <th style={th}>الحالة</th>
            <th style={th}>الميزانية</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td style={td}><code>{p.code ?? '—'}</code></td>
              <td style={td}><b>{p.name}</b></td>
              <td style={td}>{p.client?.name ?? '—'}</td>
              <td style={td}>{p.manager?.name ?? '—'}</td>
              <td style={td}>
                <span style={{ ...badge, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>
                  {PROJECT_STATUS_LABELS[p.status]}
                </span>
              </td>
              <td style={td}>{fmtMoney(p.budget_kwd)}</td>
              <td style={td}>
                <button className="btn btn-sm" onClick={() => onEdit(p)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(p)} type="button" style={{ color: '#ef4444' }}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
