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

/** آخر تحديث بصيغة قريبة: «اليوم» · «أمس» · «منذ 5 أيام» · ثم التاريخ. */
function lastUpdate(iso: string | null | undefined): { text: string; title: string } {
  if (!iso) return { text: '—', title: '' };
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  const title = d.toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
  if (days <= 0) return { text: 'اليوم', title };
  if (days === 1) return { text: 'أمس', title };
  if (days < 30) return { text: `منذ ${days} يومًا`, title };

  return { text: d.toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }), title };
}

/** نسبة الإنجاز: المخزّنة إن وُجدت، وإلا مشتقّة من حالة المشروع (كما في بوابة العميل). */
const progressOf = (p: Project): number =>
  p.progress ?? ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[p.status] ?? 30);

/** لون شريط الإنجاز بحسب قربه من الاكتمال. */
const barColor = (pct: number): string => (pct >= 80 ? '#2D9B6F' : pct >= 40 ? '#1B6CA8' : '#E8A838');

/**
 * سجل المشاريع (طلب أيمن 2026-09-09): جدول يقرأ حال كل مشروع بلمحة —
 * رقمه واسمه وعميله ونوعه، ومرحلته الجارية، ونسبة إنجازه شريطًا، وحالته،
 * ومسؤوله. كان يعرض الكود والاسم والعميل والحالة فقط.
 */
export function ProjectsTable({ projects, onEdit, onDelete, showBudget = true, canManage = true, canDelete = true }: Props) {
  const showActions = canManage || canDelete; // عمود الإجراءات يظهر فقط لمن يملك تعديلًا أو حذفًا
  // اسم العميل يقود إلى ملفّه — لمن يملك عرض العملاء فقط، وإلا بقي نصًّا.
  const canViewClients = usePermission('clients.view');

  if (projects.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد مشاريع.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            <th style={th}>رقم المشروع</th>
            <th style={th}>اسم المشروع</th>
            <th style={th}>العميل</th>
            <th style={th}>النوع</th>
            <th style={th}>المرحلة</th>
            <th style={th}>الإنجاز</th>
            <th style={th}>الحالة</th>
            <th style={th}>المسؤول</th>
            <th style={th}>آخر تحديث</th>
            {showBudget && <th style={th}>الميزانية</th>}
            {showActions && <th style={th}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const pct = progressOf(p);
            // المشروع المنجَز خرج من العمل الجاري، فيهدأ صفّه كلّه (طلب أيمن 2026-09-09).
            const done = p.status === 'done';
            const upd = lastUpdate(p.updated_at);

            return (
              <tr key={p.id} style={done ? doneRow : undefined}>
                <td style={td}><code style={codeCell}>{p.code ?? '—'}</code></td>
                <td style={td}>
                  <Link to={`/projects/${p.id}`} style={linkStyle}>{p.name}</Link>
                  {p.is_vip && <span style={vipTag}>VIP</span>}
                </td>
                <td style={td}>
                  {p.client
                    ? (canViewClients
                      ? <Link to={`/clients/${p.client.id}/profile`} style={linkStyle} title={`ملف العميل: ${p.client.name}`}>{p.client.name}</Link>
                      : p.client.name)
                    : '—'}
                </td>
                <td style={td}>{p.type ? <span style={typeCell}>{p.type}</span> : <span style={dim}>—</span>}</td>
                <td style={td}>
                  {p.current_stage
                    ? <span style={stagePill}><span style={stageDot} />{p.current_stage}</span>
                    : <Link to={`/projects/${p.id}?tab=stages`} style={{ ...dim, textDecoration: 'none' }}>بلا مرحلة</Link>}
                </td>
                <td style={td}>
                  <div style={barTrack}><span style={{ ...barFill, width: `${pct}%`, background: barColor(pct) }} /></div>
                  <div style={pctLabel}>{pct}%</div>
                </td>
                <td style={td}>
                  <span style={{ ...badge, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>
                    <span style={{ ...stageDot, background: PROJECT_STATUS_COLORS[p.status] }} />
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td style={td}>{p.manager?.name ?? <span style={dim}>—</span>}</td>
                <td style={{ ...td, whiteSpace: 'nowrap' }} title={upd.title}>
                  <span style={updCell}>{upd.text}</span>
                </td>
                {showBudget && <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmtMoney(p.budget_kwd)}</td>}
                {showActions && (
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <Link to={`/projects/${p.id}`} className="btn btn-sm" title="عرض تفاصيل المشروع" style={{ textDecoration: 'none' }}>👁</Link>{' '}
                    {canManage && <button className="btn btn-sm" onClick={() => onEdit(p)} type="button">تعديل</button>}{' '}
                    {canDelete && <button className="btn btn-sm" onClick={() => onDelete(p)} type="button" style={{ color: '#ef4444' }}>حذف</button>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '12.5px', color: '#5A6478', fontWeight: 800, whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const linkStyle: CSSProperties = { color: '#1B6CA8', textDecoration: 'none', fontWeight: 700 };
const codeCell: CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#0F2A4A', background: '#F1F5F9', borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap' };
const typeCell: CSSProperties = { fontSize: '12.5px', color: '#475569' };
const dim: CSSProperties = { color: '#B6BECC', fontSize: '12.5px' };
const vipTag: CSSProperties = { marginInlineStart: '6px', fontSize: '9px', fontWeight: 900, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '20px', padding: '1px 6px' };
// المرحلة الجارية: شارة بنقطة — تُقرأ بلمحة كما في الحالة.
const stagePill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700, color: '#1B6CA8', background: '#E4F0FA', borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap' };
const stageDot: CSSProperties = { width: '6px', height: '6px', borderRadius: '50%', background: '#1B6CA8', flexShrink: 0 };
const barTrack: CSSProperties = { width: '86px', height: '6px', background: '#EEF2F7', borderRadius: '4px', overflow: 'hidden' };
const barFill: CSSProperties = { display: 'block', height: '100%', borderRadius: '4px', transition: 'width .3s ease' };
const pctLabel: CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#475569', marginTop: '3px', fontVariantNumeric: 'tabular-nums' };
// صفّ المشروع المنجَز: رمادي هادئ — حاضرٌ للمراجعة لا يزاحم الجاري.
const doneRow: CSSProperties = { background: '#F4F6F9', color: '#8A93A3', filter: 'grayscale(1)' };
const updCell: CSSProperties = { fontSize: '12px', color: '#64748B', fontVariantNumeric: 'tabular-nums' };
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, whiteSpace: 'nowrap' };
