import type { CSSProperties } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import type { Appointment } from '../types';
import { MINE_ROW, MINE_TAG, OTHERS_MUTED } from './mineStyles';

const time = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const h = d.getHours();

  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'م' : 'ص'}`;
};
const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '');
const clientOf = (a: Appointment) => a.notes?.match(/العميل:\s*([^—\n]+)/)?.[1]?.trim() ?? a.project?.name ?? '';

/**
 * تمييز صفّ الموعد: ما يخصّني يُبرَز بحلقة ووسم، وما يخصّ غيري يخفت
 * (طلب أيمن 2026-08-31). بلا معرّف مستخدم لا تمييز أصلًا.
 */
function mineStyle(a: Appointment, meId: number | null | undefined, list: Appointment[]): CSSProperties {
  // بلا موعدٍ لي في القائمة لا معنى للتخفيت — وإلا بدت القائمة كلّها باهتة.
  if (!meId || !list.some((x) => x.assignee?.id === meId)) return {};

  return a.assignee?.id === meId ? MINE_ROW : OTHERS_MUTED;
}

/**
 * سطر المكلَّف: أحرف اسمه بلونه الثابت ثم اسمه المختصر (طلب أيمن 2026-08-31).
 * بلا مكلَّف يُقال ذلك صراحةً بدل أيقونة صامتة.
 */
function Assignee({ a, meId }: { a: Appointment; meId?: number | null }) {
  if (!a.assignee) {
    return <span style={noAssignee} title="لم يُكلَّف أحد بهذا الموعد">👤 غير مكلَّف</span>;
  }
  const color = personColor(a.assignee.id);
  const mine = !!meId && a.assignee.id === meId;

  return (
    <span style={assigneeRow} title={`المكلَّف: ${a.assignee.name}`}>
      <span style={{ ...avatar, background: color }}>{personInitials(a.assignee.name)}</span>
      <span style={{ color, fontWeight: 800 }}>{shortName(a.assignee.name)}</span>
      {mine && <span style={MINE_TAG}>موعدي</span>}
    </span>
  );
}

/** الشريط الجانبي: طلبات منتظرة + مواعيد مؤكّدة (طبق أصل لوحة المواعيد). */
export function AppointmentSidebar({ appointments, onEdit, onConfirm, canManage = true, meId }: { appointments: Appointment[]; onEdit: (a: Appointment) => void; onConfirm: (a: Appointment) => void; canManage?: boolean; meId?: number | null }) {
  const now = Date.now();
  const pending = appointments.filter((a) => a.status === 'pending').sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''));
  const confirmed = appointments
    .filter((a) => a.status === 'scheduled' && a.start_at && new Date(a.start_at).getTime() >= now)
    .sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* طلبات منتظرة */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '2px solid #FCD9A6' }}>
        <div style={{ ...panelHead, background: '#FEF3E2' }}>
          <span style={{ color: '#D97706', fontWeight: 800, fontSize: '14px' }}>⏳ طلبات منتظرة ({pending.length})</span>
        </div>
        <div style={panelBody}>
          {pending.length === 0 ? <div style={empty}>لا توجد طلبات معلّقة</div> : pending.map((a) => (
            <div key={a.id} style={{ ...reqCard, ...mineStyle(a, meId, pending) }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={cardTitle}>{a.title}</div>
                <div style={cardSub}>{clientOf(a)} · {shortDate(a.start_at)} {time(a.start_at)}</div>
                <div style={{ marginTop: '3px' }}><Assignee a={a} meId={meId} /></div>
              </div>
              {canManage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button className="btn btn-sm" type="button" onClick={() => onConfirm(a)} style={{ background: '#059669', color: '#fff', fontSize: '11px', padding: '3px 8px' }}>✓ تأكيد</button>
                  <button className="btn btn-sm" type="button" onClick={() => onEdit(a)} style={{ fontSize: '11px', padding: '3px 8px' }}>✏️</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* مواعيد مؤكّدة */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ ...panelHead, borderBottom: '1px solid #EEF2F7' }}>
          <span style={{ fontWeight: 800, fontSize: '14px' }}>🗓️ مواعيد مؤكّدة ({confirmed.length})</span>
        </div>
        <div style={panelBody}>
          {confirmed.length === 0 ? <div style={empty}>لا توجد مواعيد مؤكّدة</div> : confirmed.map((a) => (
            <div key={a.id} style={{ ...miniCard, ...mineStyle(a, meId, confirmed) }} onClick={() => onEdit(a)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={cardTitle}>{a.title}</div>
                <div style={cardSub}>{clientOf(a)}</div>
                <div style={{ marginTop: '3px' }}><Assignee a={a} meId={meId} /></div>
              </div>
              <div style={{ textAlign: 'left', minWidth: '72px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>{time(a.start_at)}</div>
                <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>{shortDate(a.start_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** السجل السابق — مواعيد منتهية أو مضت (طبق الأصل). */
export function AppointmentHistory({ appointments, onEdit, onDelete, canManage = true, canDelete = true, meId }: { appointments: Appointment[]; onEdit: (a: Appointment) => void; onDelete: (a: Appointment) => void; canManage?: boolean; canDelete?: boolean; meId?: number | null }) {
  const showActions = canManage || canDelete; // أزرار السجل تظهر فقط لمن يملك تعديلًا أو حذفًا
  const now = Date.now();
  const past = appointments
    .filter((a) => a.status === 'done' || (a.status === 'scheduled' && a.start_at && new Date(a.start_at).getTime() < now))
    .sort((a, b) => (b.start_at ?? '').localeCompare(a.start_at ?? ''));

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '18px' }}>
      <div style={{ ...panelHead, borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ fontWeight: 800, fontSize: '15px' }}>📋 السجل السابق ({past.length})</span>
      </div>
      <div>
        {past.length === 0 ? <div style={{ ...empty, padding: '32px' }}>لا يوجد سجل</div> : past.map((a) => (
          <div key={a.id} style={{ ...row, ...mineStyle(a, meId, past) }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={cardTitle}>{a.title}</div>
              <div style={cardSub}>{clientOf(a)}</div>
              <div style={{ marginTop: '3px' }}><Assignee a={a} meId={meId} /></div>
            </div>
            <div style={{ textAlign: 'left', minWidth: '90px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>{time(a.start_at)}</div>
              <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>{shortDate(a.start_at)}</div>
            </div>
            {showActions && (
              <div style={{ display: 'flex', gap: '5px' }}>
                {canManage && <button className="btn btn-sm" type="button" onClick={() => onEdit(a)} style={{ fontSize: '11px', padding: '3px 8px' }}>✏️</button>}
                {canDelete && <button className="btn btn-sm" type="button" onClick={() => onDelete(a)} style={{ fontSize: '11px', padding: '3px 8px', color: '#DC2626' }}>🗑</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const panelHead: CSSProperties = { padding: '12px 14px' };
const panelBody: CSSProperties = { padding: '12px', display: 'flex', flexDirection: 'column', gap: '9px' };
const empty: CSSProperties = { textAlign: 'center', padding: '18px', color: '#8A93A3', fontSize: '12.5px' };
const reqCard: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '9px' };
const miniCard: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #F1F5F9' };
const cardTitle: CSSProperties = { fontSize: '13px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const cardSub: CSSProperties = { fontSize: '11.5px', color: '#8A93A3', marginTop: '3px' };
const assigneeRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px' };
const avatar: CSSProperties = { width: '17px', height: '17px', borderRadius: '50%', color: '#fff', fontSize: '7.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const noAssignee: CSSProperties = { fontSize: '10.5px', color: '#B6BECC', fontWeight: 700 };
