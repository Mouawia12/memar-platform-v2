import { type CSSProperties, Fragment, useState } from 'react';

import { useActivityLog, useAuditFilters } from '../hooks/useAudit';
import { EVENT_COLORS, FIELD_LABELS, type Activity } from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const label = (field: string) => FIELD_LABELS[field] ?? field;
const shown = (v: string | number | boolean | null) => {
  if (v === null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'نعم' : 'لا';
  return String(v);
};

/** سجل التدقيق — من فعل ماذا ومتى، مع تفاصيل التغييرات. */
export function AuditPage() {
  const { data: options } = useAuditFilters();
  const [event, setEvent] = useState('');
  const [subject, setSubject] = useState('');
  const [causer, setCauser] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading, isError } = useActivityLog({
    event: event || undefined,
    subject_type: subject || undefined,
    causer_id: causer ? Number(causer) : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
  });

  const reset = () => { setEvent(''); setSubject(''); setCauser(''); setFrom(''); setTo(''); setPage(1); };
  const onFilter = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>سجل التدقيق</h1>
        {meta && <span style={{ fontSize: '13px', color: '#5A6478' }}>{meta.total} عملية مسجّلة</span>}
      </div>
      <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '18px' }}>
        سجل كامل لكل إنشاء وتعديل وحذف في المنصة — من نفّذ العملية، على أي كيان، ومتى، مع تفاصيل ما تغيّر.
      </p>

      <div className="card" style={{ padding: '16px' }}>
        {/* الفلاتر */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <select className="input" value={event} onChange={(e) => onFilter(setEvent)(e.target.value)}>
            <option value="">كل الإجراءات</option>
            {options?.events.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input" value={subject} onChange={(e) => onFilter(setSubject)(e.target.value)}>
            <option value="">كل الكيانات</option>
            {options?.subjects.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input" value={causer} onChange={(e) => onFilter(setCauser)(e.target.value)}>
            <option value="">كل المستخدمين</option>
            {options?.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input className="input" type="date" value={from} onChange={(e) => onFilter(setFrom)(e.target.value)} title="من تاريخ" />
          <input className="input" type="date" value={to} onChange={(e) => onFilter(setTo)(e.target.value)} title="إلى تاريخ" />
          <button className="btn btn-sm" type="button" onClick={reset}>مسح الفلاتر</button>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل السجل.</p>}

        {data && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>الوقت</th>
                  <th style={th}>المستخدم</th>
                  <th style={th}>الإجراء</th>
                  <th style={th}>الكيان</th>
                  <th style={th}>العنصر</th>
                  <th style={th}>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a: Activity) => (
                  <Fragment key={a.id}>
                    <tr>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmt(a.created_at)}</td>
                      <td style={td}>{a.causer?.name ?? <span style={{ opacity: 0.5 }}>النظام</span>}</td>
                      <td style={td}>
                        <span style={{ ...badge, background: `${EVENT_COLORS[a.event] ?? '#5A6478'}1a`, color: EVENT_COLORS[a.event] ?? '#5A6478' }}>{a.event_label}</span>
                      </td>
                      <td style={td}>{a.subject_label}</td>
                      <td style={td}><b>{a.title ?? `#${a.subject_id ?? '—'}`}</b></td>
                      <td style={td}>
                        {a.changes.length > 0 ? (
                          <button className="btn btn-sm" type="button" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                            {openId === a.id ? 'إخفاء' : `${a.changes.length} حقل`}
                          </button>
                        ) : <span style={{ opacity: 0.5 }}>—</span>}
                      </td>
                    </tr>
                    {openId === a.id && (
                      <tr>
                        <td colSpan={6} style={{ ...td, background: '#F7F9FC' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                            <thead>
                              <tr>
                                <th style={subTh}>الحقل</th>
                                <th style={subTh}>قبل</th>
                                <th style={subTh}>بعد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.changes.map((c) => (
                                <tr key={c.field}>
                                  <td style={subTd}><b>{label(c.field)}</b></td>
                                  <td style={{ ...subTd, color: '#DC4A3D' }}>{shown(c.old)}</td>
                                  <td style={{ ...subTd, color: '#2D9B6F' }}>{shown(c.new)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {rows.length === 0 && <tr><td style={{ ...td, opacity: 0.6, textAlign: 'center', padding: '28px' }} colSpan={6}>لا توجد عمليات مطابقة.</td></tr>}
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
    </div>
  );
}

const th: CSSProperties = { textAlign: 'start', padding: '10px 14px', borderBottom: '2px solid #E4E8EF', fontSize: '12.5px', color: '#5A6478', fontWeight: 700 };
const td: CSSProperties = { padding: '11px 14px', borderBottom: '1px solid #F1F5F9', fontSize: '13px' };
const subTh: CSSProperties = { textAlign: 'start', padding: '6px 10px', borderBottom: '1px solid #E4E8EF', color: '#5A6478', fontWeight: 700 };
const subTd: CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #EEF2F7' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' };
