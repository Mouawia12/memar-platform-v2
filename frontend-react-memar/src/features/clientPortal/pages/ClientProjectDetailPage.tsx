import { type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';

import { STATUS_COLORS as INVOICE_COLORS, STATUS_LABELS as INVOICE_STATUS } from '../../invoices/types';
import { PROJECT_STATUS_LABELS, STAGE_STATUS_COLORS, STAGE_STATUS_LABELS } from '../../projects/types';
import { useClientProject } from '../hooks/useClientPortal';

const money = (v: string | number) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

/** صفحة مشروع العميل (CLIENT-4) — عرض للقراءة فقط: مراحل + تقدّم + دفعات، بلا أي بيانات داخلية. */
export function ClientProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data, isLoading, isError } = useClientProject(projectId);

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل المشروع أو لا صلاحية لك عليه.</p>;

  const { project, stages, payments } = data;
  const collected = payments.invoiced_kwd > 0 ? Math.round((payments.paid_kwd / payments.invoiced_kwd) * 100) : 0;

  return (
    <div>
      {/* زر عودة بارز وثابت أعلى الصفحة — يمنع «حبس» العميل داخل صفحة المشروع (طلب أيمن، اجتماع 4) */}
      <div style={backBar}>
        <Link to="/client-portal" style={backBtn}><i className="fas fa-arrow-right" /> الرجوع إلى بوابة العميل</Link>
      </div>

      {/* الترويسة */}
      <div style={banner}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#fff' }}>{project.name}</h1>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)', marginTop: '4px' }}>
              {project.code} · مدير المشروع: {project.manager ?? '—'}
            </div>
          </div>
          <span style={{ ...chip, background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.25)' }}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        {/* تواريخ المشروع — كما في تصميم صفحة العميل المرجعي */}
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12.5px', color: 'rgba(255,255,255,.85)' }}>
          <span>🚩 البداية: {fmtDate(project.start_date)}</span>
          <span>🏁 التسليم المتوقع: {fmtDate(project.end_date)}</span>
        </div>
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#fff', marginBottom: '6px' }}>
            <span>تقدّم المراحل</span><b>{project.stage_progress}%</b>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,.2)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${project.stage_progress}%`, height: '100%', background: '#6EE7B7', borderRadius: '6px', transition: 'width .3s' }} />
          </div>
        </div>
      </div>

      {/* المراحل */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>🧭 مراحل المشروع</h3>
        {stages.length === 0 ? <Empty text="لم تُحدَّد مراحل هذا المشروع بعد." /> : (
          <div style={{ position: 'relative', paddingInlineStart: '20px', marginTop: '10px' }}>
            <span style={line} />
            {stages.map((s) => (
              <div key={s.id} style={stageItem}>
                <span style={{ ...stageDot, background: STAGE_STATUS_COLORS[s.status], boxShadow: s.status === 'active' ? `0 0 0 4px ${STAGE_STATUS_COLORS.active}33` : '0 0 0 2px #E4E8EF' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '2px' }}>
                    <span style={{ color: STAGE_STATUS_COLORS[s.status], fontWeight: 700 }}>{STAGE_STATUS_LABELS[s.status]}</span>
                    {s.status === 'done' && s.completed_at && ` · اكتملت ${fmtDate(s.completed_at)}`}
                    {s.status === 'active' && s.started_at && ` · بدأت ${fmtDate(s.started_at)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الدفعات */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>💰 دفعاتي</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '6px' }}>
          <Tile label="إجمالي الفواتير" value={money(payments.invoiced_kwd)} color="#274A78" />
          <Tile label="المدفوع" value={money(payments.paid_kwd)} color="#059669" />
          <Tile label="المتبقّي عليّ" value={money(payments.remaining_kwd)} color={payments.remaining_kwd > 0 ? '#DC4A3D' : '#059669'} />
          <Tile label="نسبة السداد" value={`${collected}%`} color="#1B6CA8" />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {payments.invoices.length === 0 && <Empty text="لا توجد فواتير بعد." />}
          {payments.invoices.map((i) => (
            <div key={i.id} style={invRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{i.number ?? `فاتورة #${i.id}`}
                  <span style={{ ...chip, background: `${INVOICE_COLORS[i.status]}1a`, color: INVOICE_COLORS[i.status], marginInlineStart: '8px' }}>{INVOICE_STATUS[i.status]}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '3px' }}>
                  {money(i.paid_kwd)} من {money(i.total_kwd)}{i.due_date && ` · استحقاق ${fmtDate(i.due_date)}`}
                </div>
              </div>
              <div style={{ textAlign: 'left', minWidth: '104px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: Number(i.balance_kwd) > 0 ? '#DC4A3D' : '#059669' }}>{money(i.balance_kwd)}</div>
                <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>المتبقّي</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ fontSize: '16px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '3px' }}>{label}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ opacity: 0.6, fontSize: '13px', padding: '8px 0' }}>{text}</p>;
}

const backBar: CSSProperties = { position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(#F5F7FB 70%, rgba(245,247,251,0))', padding: '8px 0 12px', marginBottom: '4px' };
const backBtn: CSSProperties = { fontSize: '14px', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#274A78,#1B6CA8)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', boxShadow: '0 4px 14px rgba(39,74,120,.28)' };
const banner: CSSProperties = { background: 'linear-gradient(135deg,#274A78,#1B6CA8)', borderRadius: '14px', padding: '22px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(39,74,120,.25)' };
const chip: CSSProperties = { padding: '3px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '5px', top: '8px', bottom: '8px', width: '2px', background: '#E4E8EF' };
const stageItem: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '9px 0', position: 'relative' };
const stageDot: CSSProperties = { width: '12px', height: '12px', borderRadius: '50%', marginTop: '4px', flexShrink: 0, marginInlineStart: '-20px', border: '2px solid #fff' };
const invRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1px solid #EEF2F7', borderRadius: '10px' };
