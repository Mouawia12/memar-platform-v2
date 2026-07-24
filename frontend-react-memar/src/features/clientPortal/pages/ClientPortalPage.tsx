import { type CSSProperties, type ReactNode } from 'react';

import { STATUS_COLORS as CONTRACT_COLORS, STATUS_LABELS as CONTRACT_STATUS } from '../../contracts/types';
import { printDocument } from '../../documents/print';
import { STATUS_COLORS as INVOICE_COLORS, STATUS_LABELS as INVOICE_STATUS } from '../../invoices/types';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../projects/types';
import { useClientPortal } from '../hooks/useClientPortal';

const money = (v: string | number) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** بوابة العميل — يرى العميل مشاريعه وفواتيره وعقوده ومستنداته واجتماعاته. */
export function ClientPortalPage() {
  const { data, isLoading, isError } = useClientPortal();

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل بوابة العميل.</p>;

  if (!data.linked) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '620px', margin: '40px auto' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
        <h2 style={{ marginTop: 0 }}>هذا الحساب غير مرتبط بسجل عميل</h2>
        <p style={{ color: '#5A6478', lineHeight: 1.9 }}>
          بوابة العميل تعرض مشاريع وفواتير ومستندات عميل محدّد. لتفعيلها، يربط مدير النظام هذا الحساب
          بسجل العميل من صفحة <b>سجل المستخدمين</b> (حقل «العميل المرتبط»).
        </p>
      </div>
    );
  }

  const { client, stats, projects, invoices, contracts, documents, appointments } = data;

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ margin: 0 }}>أهلاً، {client?.name ?? 'عميلنا'} 🏛️</h1>
        <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '4px' }}>تابع مشاريعك وفواتيرك ومستنداتك مع مجموعة معمار.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        <Stat value={String(stats?.projects ?? 0)} label="🏗️ مشاريعي" color="#274A78" />
        <Stat value={String(stats?.active_projects ?? 0)} label="⚙️ قيد التنفيذ" color="#1B6CA8" />
        <Stat value={String(stats?.contracts ?? 0)} label="📄 عقودي" color="#7B2D8B" />
        <Stat value={String(stats?.invoices ?? 0)} label="🧾 فواتيري" color="#D97706" />
        <Stat value={money(stats?.total_due ?? 0)} label="💰 المستحق عليّ" color={(stats?.total_due ?? 0) > 0 ? '#DC4A3D' : '#2D9B6F'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Section title="🏗️ مشاريعي">
          {projects.length === 0 && <Empty text="لا توجد مشاريع بعد." />}
          {projects.map((p) => (
            <div key={p.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{p.code}</div>
              </div>
              <span style={{ ...chip, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>{PROJECT_STATUS_LABELS[p.status]}</span>
            </div>
          ))}
        </Section>

        <Section title="🧾 فواتيري">
          {invoices.length === 0 && <Empty text="لا توجد فواتير." />}
          {invoices.map((i) => (
            <div key={i.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{i.number ?? `#${i.id}`}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {money(i.total_kwd)} · المتبقّي <b style={{ color: Number(i.balance_kwd) > 0 ? '#DC4A3D' : '#2D9B6F' }}>{money(i.balance_kwd)}</b>
                  {i.due_date && ` · استحقاق ${fmtDate(i.due_date)}`}
                </div>
              </div>
              <span style={{ ...chip, background: `${INVOICE_COLORS[i.status]}1a`, color: INVOICE_COLORS[i.status] }}>{INVOICE_STATUS[i.status]}</span>
            </div>
          ))}
        </Section>

        <Section title="📄 عقودي">
          {contracts.length === 0 && <Empty text="لا توجد عقود." />}
          {contracts.map((c) => (
            <div key={c.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{c.number ?? `#${c.id}`}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{money(c.value_kwd)}</div>
              </div>
              <span style={{ ...chip, background: `${CONTRACT_COLORS[c.status]}1a`, color: CONTRACT_COLORS[c.status] }}>{CONTRACT_STATUS[c.status]}</span>
            </div>
          ))}
        </Section>

        <Section title="📑 مستنداتي">
          {documents.length === 0 && <Empty text="لا توجد مستندات." />}
          {documents.map((d) => (
            <div key={d.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{d.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{d.project?.name ?? '—'}</div>
              </div>
              <button className="btn btn-sm" type="button" onClick={() => printDocument(d.title, d.body_html)}>🖨️ عرض</button>
            </div>
          ))}
        </Section>

        <Section title="📅 اجتماعاتي القادمة">
          {appointments.length === 0 && <Empty text="لا توجد اجتماعات قادمة." />}
          {appointments.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{fmtDateTime(a.start_at)}{a.project ? ` · ${a.project.name}` : ''}</div>
              </div>
              {a.is_video && <span style={{ ...chip, background: '#2D9B6F1a', color: '#2D9B6F' }}>📹 فيديو</span>}
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="kpi-card">
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', opacity: 0.65, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ opacity: 0.6, fontSize: '13px', padding: '10px 0' }}>{text}</p>;
}

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F1F5F9' };
const chip: CSSProperties = { padding: '2px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' };
