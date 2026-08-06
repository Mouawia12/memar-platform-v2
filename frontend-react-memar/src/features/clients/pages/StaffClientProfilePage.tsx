import { type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { InternalRating } from '../../../components/InternalRating';
import { apiPatch } from '../../../lib/api';
import { usePermission } from '../../auth/hooks/usePermission';
import { clientAccountCode, clientPortalApi } from '../../clientPortal/api/clientPortalApi';

/**
 * بروفيل العميل للموظف/الأدمن (اجتماع 2026-08-05): نفس بيانات صفحة العميل داخل
 * الداشبورد + قسم داخلي (تقييم/ملاحظات) لا يراه العميل. يُتاح بصلاحية crm.view.
 */
const money = (v: number | string) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: '#2D9B6F' },
  on_hold: { label: 'معلّق', color: '#D97706' },
  done: { label: 'مكتمل', color: '#1B6CA8' },
  cancelled: { label: 'ملغى', color: '#DC2626' },
};
const INVOICE_STATUS: Record<string, string> = { draft: 'مسودّة', sent: 'مُرسلة', partial: 'مدفوعة جزئيًا', paid: 'مدفوعة', cancelled: 'ملغاة' };

export function StaffClientProfilePage() {
  const { id } = useParams();
  const contactId = Number(id);
  const canEdit = usePermission('crm.manage');
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-client-profile', contactId],
    queryFn: () => clientPortalApi.staffProfile(contactId),
    enabled: Number.isFinite(contactId),
  });

  const saveRating = useMutation({
    mutationFn: (p: { internal_rating: number; internal_notes: string }) => apiPatch(`/contacts/${contactId}`, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-client-profile', contactId] }),
  });

  if (isLoading) return <p style={{ padding: 20 }}>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ padding: 20, color: '#ef4444' }}>تعذّر تحميل بروفيل العميل.</p>;

  const c = data.client;
  const stats = data.stats;
  const initial = (c?.name ?? 'ع').trim().charAt(0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Link to="/clients" style={backLink}><i className="fas fa-arrow-right" /> سجل العملاء</Link>
        <h1 style={{ margin: 0, fontSize: '20px' }}>بروفيل العميل</h1>
        <span style={teamBadge}><i className="fas fa-lock" /> عرض داخلي للفريق</span>
      </div>

      {/* بطاقة العميل — بستايل بوابة العميل */}
      <div style={hero}>
        <div style={heroAvatar}>{c?.avatar_url ? <img src={c.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{c?.name}</h2>
          {c?.position && <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}><i className="fas fa-crown" /> {c.position}</div>}
          <div style={heroMeta}>
            {c && <span style={chip}><i className="fas fa-hashtag" /> {clientAccountCode(c)}</span>}
            {c?.company && <span style={chip}><i className="fas fa-building" /> {c.company}</span>}
            {c?.since && <span style={chip}><i className="fas fa-calendar-check" /> منذ {c.since}</span>}
            {c?.phone && <span style={chip} dir="ltr"><i className="fas fa-phone" /> {c.phone}</span>}
          </div>
        </div>
      </div>

      {/* مؤشرات */}
      {stats && (
        <div style={kpiGrid}>
          <Kpi label="المشاريع" value={stats.projects} color="#1B6CA8" />
          <Kpi label="نشطة" value={stats.active_projects} color="#2D9B6F" />
          <Kpi label="مكتملة" value={stats.done_projects} color="#7C3AED" />
          <Kpi label="فواتير معلّقة" value={stats.unpaid_invoices} color="#D97706" />
          <Kpi label="المستحقّ" value={money(stats.total_due)} color="#DC2626" />
        </div>
      )}

      <div style={grid2}>
        {/* المشاريع */}
        <div className="card" style={panel}>
          <h3 style={panelTitle}>🏗️ مشاريع العميل ({data.projects.length})</h3>
          {data.projects.length === 0 && <p style={empty}>لا مشاريع.</p>}
          {data.projects.map((p: { id: number; name: string; status: string }) => (
            <div key={p.id} style={row}>
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ ...statusPill, color: PROJECT_STATUS[p.status]?.color ?? '#5A6478', background: `${PROJECT_STATUS[p.status]?.color ?? '#5A6478'}18` }}>{PROJECT_STATUS[p.status]?.label ?? p.status}</span>
            </div>
          ))}
        </div>

        {/* الفواتير */}
        <div className="card" style={panel}>
          <h3 style={panelTitle}>🧾 الفواتير ({data.invoices.length})</h3>
          {data.invoices.length === 0 && <p style={empty}>لا فواتير.</p>}
          {data.invoices.map((i: { id: number; number: string | null; total_kwd: string; status: string }) => (
            <div key={i.id} style={row}>
              <span style={{ flex: 1 }}>{i.number ?? `#${i.id}`}</span>
              <b style={{ marginInlineEnd: '10px' }}>{money(i.total_kwd)}</b>
              <span style={{ ...statusPill, color: '#5A6478', background: '#5A647818' }}>{INVOICE_STATUS[i.status] ?? i.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* القسم الداخلي — خاص بالفريق */}
      <div className="card" style={{ ...panel, marginTop: '18px', borderColor: '#FCD34D', background: 'rgba(232,168,56,.04)' }}>
        <h3 style={panelTitle}>⭐ التقييم الداخلي للعميل</h3>
        <InternalRating
          rating={data.internal.rating ?? 0}
          notes={data.internal.notes ?? ''}
          busy={saveRating.isPending}
          readOnly={!canEdit}
          onSave={canEdit ? (r, n) => saveRating.mutate({ internal_rating: r, internal_notes: n }) : undefined}
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '12.5px', color: '#5A6478', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

const backLink: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1B6CA8', textDecoration: 'none', fontSize: '13px', fontWeight: 700 };
const teamBadge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '999px', padding: '3px 12px' };
const hero: CSSProperties = { display: 'flex', alignItems: 'center', gap: '18px', background: 'linear-gradient(135deg,#0D4A7A 0%,#1B6CA8 100%)', color: '#fff', borderRadius: '16px', padding: '22px 24px', marginBottom: '18px', boxShadow: '0 6px 22px rgba(13,74,122,.2)' };
const heroAvatar: CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.15)', border: '3px solid rgba(255,255,255,.5)', fontSize: '28px', fontWeight: 800, flexShrink: 0 };
const heroMeta: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' };
const chip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.15)', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 };
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '18px' };
const grid2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' };
const panel: CSSProperties = { padding: '16px 18px' };
const panelTitle: CSSProperties = { margin: '0 0 12px', fontSize: '15px', fontWeight: 800 };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 2px', borderBottom: '1px solid #F1F5F9', fontSize: '13.5px' };
const statusPill: CSSProperties = { fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap' };
const empty: CSSProperties = { color: '#8A93A3', fontSize: '13px', padding: '8px 2px' };
