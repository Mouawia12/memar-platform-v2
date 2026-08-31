import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type Project } from '../types';

interface Props {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  showBudget?: boolean; // قيمة المشروع تُعرض فقط لمن يملك finance.view (طلب أيمن 2026-08-09)
  canManage?: boolean;  // إظهار زر التعديل (projects.manage)
  canDelete?: boolean;  // إظهار زر الحذف (projects.delete)
}

const fmtMoney = (v: string | null | undefined) =>
  v === null || v === undefined ? '—' : `${Number(v).toLocaleString('ar')} د.ك`;

export function ProjectsTable({ projects, onEdit, onDelete, showBudget = true, canManage = true, canDelete = true }: Props) {
  const showActions = canManage || canDelete; // عمود الإجراءات يظهر فقط لمن يملك تعديلًا أو حذفًا
  // اسم العميل يقود إلى ملفّه (طلب أيمن 2026-08-31) — لمن يملك عرض العملاء فقط،
  // وإلا بقي نصًّا كي لا يصطدم غيره بصفحة محجوبة.
  const canViewClients = usePermission('clients.view');
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
            <th style={th}>المراحل</th>
            <th style={th}>الحالة</th>
            {showBudget && <th style={th}>الميزانية</th>}
            {showActions && <th style={th}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td style={td}><code>{p.code ?? '—'}</code></td>
              <td style={td}><Link to={`/projects/${p.id}`} style={{ color: '#1B6CA8', textDecoration: 'none', fontWeight: 700 }}>{p.name}</Link></td>
              <td style={td}>
                {p.client
                  ? (canViewClients
                    ? <Link to={`/clients/${p.client.id}/profile`} style={linkStyle} title={`ملف العميل: ${p.client.name}`}>{p.client.name}</Link>
                    : p.client.name)
                  : '—'}
              </td>
              <td style={td}>{p.manager?.name ?? '—'}</td>
              {/* اختصار لمراحل المشروع — كانت مخبوءة خلف فتح المشروع ثم تبويب
                  «المراحل»، فلا يهتدي إليها أحد (طلب أيمن 2026-08-31). */}
              <td style={td}>
                <Link to={`/projects/${p.id}?tab=stages`} style={stagesBtn} title={`مراحل ${p.name}`}>🧭 المراحل</Link>
              </td>
              <td style={td}>
                <span style={{ ...badge, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>
                  {PROJECT_STATUS_LABELS[p.status]}
                </span>
              </td>
              {showBudget && <td style={td}>{fmtMoney(p.budget_kwd)}</td>}
              {showActions && (
                <td style={td}>
                  {canManage && <button className="btn btn-sm" onClick={() => onEdit(p)} type="button">تعديل</button>}{' '}
                  {canDelete && <button className="btn btn-sm" onClick={() => onDelete(p)} type="button" style={{ color: '#ef4444' }}>حذف</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const stagesBtn: CSSProperties = { display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#1B6CA8', background: '#EFF6FC', border: '1px solid #BFDBF0', borderRadius: '999px', padding: '3px 10px', textDecoration: 'none', whiteSpace: 'nowrap' };
const linkStyle: CSSProperties = { color: '#1B6CA8', textDecoration: 'none', fontWeight: 700 };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
