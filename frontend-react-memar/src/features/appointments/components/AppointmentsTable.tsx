import type { CSSProperties } from 'react';

import { useCloseAppointment } from '../hooks/useAppointments';
import { LOCATION_KIND_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, type Appointment } from '../types';

interface Props {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (a: Appointment) => void;
  canManage?: boolean; // إظهار زر التعديل (appointments.manage)
  canDelete?: boolean; // إظهار زر الحذف (appointments.delete)
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/** اجتماع مضى موعده ولم يُعلَّم «تمّ» ولا «أُلغي» — يُعرض له زرّ الإنهاء. */
function needsClosing(a: Appointment): boolean {
  if (a.status === 'done' || a.status === 'cancelled') return false;
  const ends = a.end_at ?? a.start_at;

  return !!ends && new Date(ends).getTime() < Date.now();
}

export function AppointmentsTable({ appointments, onEdit, onDelete, canManage = true, canDelete = true }: Props) {
  const showActions = canManage || canDelete; // عمود الإجراءات يظهر فقط لمن يملك تعديلًا أو حذفًا
  const close = useCloseAppointment();
  if (appointments.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد مواعيد.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>العنوان</th>
            <th style={th}>النوع</th>
            <th style={th}>الموعد</th>
            <th style={th}>المكان</th>
            <th style={th}>فيديو</th>
            <th style={th}>الحالة</th>
            {showActions && <th style={th}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td style={td}>
                <b>{a.title}</b>
                {a.project && <div style={{ fontSize: '12px', opacity: 0.6 }}>🏗️ {a.project.name}</div>}
              </td>
              <td style={td}>{TYPE_LABELS[a.type]}</td>
              <td style={td}>{fmt(a.start_at)}</td>
              <td style={td}>
                {/* نوع المكان أوّلًا ثم تفصيله — الجدول كان يعرض النصّ الحرّ وحده. */}
                {a.location_kind ? (
                  <span title={a.location ?? undefined}>
                    {LOCATION_KIND_LABELS[a.location_kind]}
                    {a.location ? <span style={{ color: '#94A3B8' }}> · {a.location}</span> : null}
                  </span>
                ) : (a.location ?? '—')}
              </td>
              <td style={td}>
                {a.video_url
                  ? <a className="btn btn-sm" href={a.video_url} target="_blank" rel="noreferrer" style={{ background: '#059669', color: '#fff' }}>📹 دخول</a>
                  : '—'}
              </td>
              <td style={td}>
                <span style={{ ...badge, background: `${STATUS_COLORS[a.status]}1a`, color: STATUS_COLORS[a.status] }}>
                  {STATUS_LABELS[a.status]}
                </span>
              </td>
              {showActions && (
                <td style={td}>
                  {/* اجتماع فات موعده ولم يُعلَّم بعد: زرّ واحد يعلّمه «تمّ» فيُشطب
                      في التقويم. النظام لا يعرف أنه انعقد فعلًا (طلب أيمن
                      2026-08-30: مضيُّ الوقت لا يكفي)، فيسأل ويُجيب المستخدم بضغطة. */}
                  {canManage && needsClosing(a) && (
                    <>
                      <button
                        className="btn btn-sm"
                        type="button"
                        title="تعليم الاجتماع كمنتهٍ — يُشطب في التقويم"
                        onClick={() => close.mutate(a.id)}
                        disabled={close.isPending}
                        style={{ background: '#059669', color: '#fff' }}
                      >✓ تمّ</button>{' '}
                    </>
                  )}
                  {canManage && <button className="btn btn-sm" onClick={() => onEdit(a)} type="button">تعديل</button>}{' '}
                  {canDelete && <button className="btn btn-sm" onClick={() => onDelete(a)} type="button" style={{ color: '#ef4444' }}>حذف</button>}
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
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
