import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { ROW_NO_CELL } from '../../../lib/rowNumber';
import { usePermission } from '../../auth/hooks/usePermission';
import { CLIENT_KIND_LABELS, CONTACT_TYPE_LABELS, type Contact } from '../types';

interface Props {
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
  onViewProfile?: (c: Contact) => void;
  canManage?: boolean; // إظهار زر التعديل (crm.manage)
  canDelete?: boolean; // إظهار زر الحذف (crm.delete)
  /** إزاحة الترقيم في الجداول المقسّمة صفحات — الصفحة الثانية تبدأ بعد الأولى. */
  rowOffset?: number;
}

const typeColor: Record<string, string> = {
  lead: '#D97706',
  client: '#059669',
  contact: '#274A78',
};

const money = (v: string | undefined) =>
  v === undefined || Number(v) === 0 ? '—' : `${Number(v).toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;

/** تاريخ قريب القراءة: «اليوم» · «أمس» · «منذ N يومًا» · ثم التاريخ. */
function sinceLabel(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} يومًا`;

  return d.toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** نجوم التقييم الداخلي — تُقرأ سريعًا تحت اسم العميل. */
function Stars({ value }: { value: number }) {
  return (
    <span style={stars} title={`تقييم داخلي: ${value} من 5`}>
      {'★'.repeat(Math.min(5, value))}<span style={{ color: '#E2E8F0' }}>{'★'.repeat(Math.max(0, 5 - value))}</span>
    </span>
  );
}

/**
 * سجل العملاء (طلب أيمن 2026-09-09): العميل بتقييمه وملاحظته، ونوعه ووسائل
 * الاتصال به، وعدد مشاريعه وإجمالي عقوده وآخر تواصل معه وحالته.
 *
 * «إجمالي العقود» بيانات مالية: يرسلها الخادم لمن يملك clients.finance.view
 * وحده (الإدارة، أو موظف بعينه تمنحه الإدارة استثناءً)، والعمود يغيب عن غيره.
 */
export function ContactsTable({ contacts, onEdit, onDelete, onViewProfile, canManage = true, canDelete = true, rowOffset = 0 }: Props) {
  // عمود الإجراءات يظهر لمن يملك عرض البروفيل أو التعديل أو الحذف
  const showActions = !!onViewProfile || canManage || canDelete;
  const canSeeFinance = usePermission('clients.finance.view');
  const canViewProfile = usePermission('clients.view');

  if (contacts.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا يوجد عملاء.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
        <thead>
          <tr>
            <th style={{ ...th, ...ROW_NO_CELL }}>#</th>
            <th style={th}>العميل</th>
            <th style={th}>النوع</th>
            <th style={th}>الهاتف</th>
            <th style={th}>البريد</th>
            <th style={th}>المشاريع</th>
            <th style={th}>الفرص</th>
            {/* المسؤول عن العميل — «زي ما أنا بشوفها» في سجل المشاريع (طلب أيمن 2026-09-17). */}
            <th style={th}>المسؤول</th>
            {canSeeFinance && <th style={th}>إجمالي العقود</th>}
            <th style={th}>آخر تواصل</th>
            <th style={th}>الحالة</th>
            {showActions && <th style={th}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr key={c.id} style={c.is_vip ? vipRow : undefined}>
              <td style={{ ...td, ...ROW_NO_CELL }}>{rowOffset + i + 1}</td>
              <td style={td}>
                {/*
                  الاسم يفتح ملف العميل — نفس ما يفعله زرّ 👁 (طلب أيمن 2026-09-09).
                  ومن لا يملك صلاحية الملف يرى الاسم نصًّا: كان الرابط يظهر للجميع
                  فيصطدم الموظف بحائط صلاحية عند الضغط.
                */}
                {canViewProfile
                  ? <Link to={`/clients/${c.id}/profile`} style={nameLink} title={`ملف العميل: ${c.full_name}`}>{c.full_name}</Link>
                  : <span style={{ fontWeight: 800, color: '#1A1F2E' }}>{c.full_name}</span>}
                {!!c.internal_rating && <Stars value={c.internal_rating} />}
                {/* المسمّى والشركة سطرًا واحدًا تحت الاسم — يُعرف الشخص بموقعه. */}
                {(c.position || c.company) && (
                  <div style={roleLine}>{[c.position, c.company].filter(Boolean).join(' — ')}</div>
                )}
                {c.notes && <div style={noteLine} title={c.notes}>💬 {c.notes}</div>}
              </td>
              <td style={td}>
                <div>{CLIENT_KIND_LABELS[c.client_kind] ?? '—'}</div>
                <div style={{ fontSize: '11px', color: typeColor[c.type] ?? '#8A93A3', fontWeight: 700 }}>
                  {CONTACT_TYPE_LABELS[c.type]}
                </div>
              </td>
              <td style={{ ...td, direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.phone || '—'}</td>
              <td style={{ ...td, direction: 'ltr', textAlign: 'right' }}>{c.email || '—'}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                <span style={countPill}>{c.projects_count ?? 0}</span>
              </td>
              {/* الفرص المنسوبة للعميل — الضغط يفتح لوحة «عميل جديد» مفلترةً باسمه. */}
              <td style={{ ...td, textAlign: 'center' }}>
                {(c.opportunities_count ?? 0) > 0
                  ? (
                    <Link to={`/crm?search=${encodeURIComponent(c.full_name)}`} style={oppPill} title={`عرض فرص ${c.full_name}`}>
                      {c.opportunities_count}
                    </Link>
                  )
                  : <span style={{ ...countPill, background: '#F1F5F9', color: '#94A3B8' }}>0</span>}
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>{c.owner?.name ?? '—'}</td>
              {canSeeFinance && (
                <td style={{ ...td, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{money(c.contracts_total_kwd)}</td>
              )}
              <td style={{ ...td, whiteSpace: 'nowrap', color: '#64748B' }}>{sinceLabel(c.last_contact_at)}</td>
              <td style={td}>
                {c.is_vip
                  ? <span style={{ ...badge, background: '#FEF3C7', color: '#B45309' }}><span style={{ ...dot, background: '#B45309' }} />VIP</span>
                  : <span style={{ ...badge, background: '#ECFDF5', color: '#059669' }}><span style={{ ...dot, background: '#059669' }} />نشط</span>}
                {/* متعاقد = له عقد موقّع/نشط/منتهٍ؛ شارة لا مبلغ فتظهر للجميع. */}
                {c.has_signed_contract && (
                  <span style={{ ...badge, background: '#EAF2FB', color: '#1B6CA8', marginInlineStart: '4px' }} title="له عقد موقّع مع المكتب">📄 متعاقد</span>
                )}
              </td>
              {showActions && (
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  {onViewProfile && <button className="btn btn-sm" onClick={() => onViewProfile(c)} type="button" title="ملف العميل">👁</button>}{' '}
                  {canManage && <button className="btn btn-sm" onClick={() => onEdit(c)} type="button">تعديل</button>}{' '}
                  {canDelete && <button className="btn btn-sm" onClick={() => onDelete(c)} type="button" style={{ color: '#ef4444' }}>حذف</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '12.5px', color: '#5A6478', fontWeight: 800, whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px', verticalAlign: 'middle' };
// العميل المميّز يُبرَز صفّه بخلفية هادئة — لا يحتاج البحث عن شارته.
const vipRow: CSSProperties = { background: '#FFFCF3' };
const stars: CSSProperties = { color: '#E8A838', fontSize: '11px', letterSpacing: '1px' };
const nameLink: CSSProperties = { display: 'inline-block', fontWeight: 800, color: '#1B6CA8', textDecoration: 'none', borderBottom: '1px dotted #9CC3E0' };
const roleLine: CSSProperties = { fontSize: '11.5px', color: '#5A6478', marginTop: '3px' };
const noteLine: CSSProperties = { fontSize: '11.5px', color: '#8A93A3', marginTop: '3px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
// شارة الفرص كهرمانية وقابلة للضغط — تميّزها عن عدّاد المشاريع الأزرق.
const oppPill: CSSProperties = { display: 'inline-block', minWidth: '26px', fontSize: '12.5px', fontWeight: 800, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '20px', padding: '2px 9px', textDecoration: 'none' };
const countPill: CSSProperties = { display: 'inline-block', minWidth: '26px', fontSize: '12.5px', fontWeight: 800, color: '#1B6CA8', background: '#E4F0FA', borderRadius: '20px', padding: '2px 9px' };
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, whiteSpace: 'nowrap' };
const dot: CSSProperties = { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 };
