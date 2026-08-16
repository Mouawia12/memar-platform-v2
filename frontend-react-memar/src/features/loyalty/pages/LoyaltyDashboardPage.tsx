import type { CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useApproveRedemption, useApproveTx, useCancelTx, useLoyaltyDashboard, useRejectRedemption } from '../hooks/useLoyaltyAdmin';

const money = (v: number) => `${Number(v || 0).toLocaleString('ar', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} د.ك`;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) : '');

export function LoyaltyDashboardPage() {
  const { data, isLoading, isError } = useLoyaltyDashboard();
  const canManage = usePermission('loyalty.manage');
  const approveTx = useApproveTx();
  const cancelTx = useCancelTx();
  const approveRd = useApproveRedemption();
  const rejectRd = useRejectRedemption();

  if (isLoading) return <p style={{ padding: 20 }}>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ padding: 20, color: '#DC2626' }}>تعذّر تحميل اللوحة.</p>;

  const { leads, points, financial, ranking, approvals } = data;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>لوحة الولاء والفرص</h1>
        <div style={{ fontSize: 12, color: '#8A93A3', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>Leads &amp; Loyalty Dashboard</div>
      </div>

      {/* مؤشّرات الفرص */}
      <div style={sectionLabel}>🎯 الفرص</div>
      <div style={grid}>
        <Kpi label="إجمالي الفرص" value={leads.total} color="#274A78" icon="📋" />
        <Kpi label="نشطة" value={leads.active} color="#1B6CA8" icon="🔄" />
        <Kpi label="عاجلة" value={leads.urgent} color="#DC2626" icon="🚨" />
        <Kpi label="VIP" value={leads.vip} color="#B45309" icon="⭐" />
        <Kpi label="متابعة اليوم" value={leads.due_today} color="#CA8A04" icon="🔔" />
        <Kpi label="متأخّرة" value={leads.overdue} color="#EA580C" icon="⚠️" />
        <Kpi label="رابحة" value={leads.won} color="#059669" icon="🏆" />
        <Kpi label="خاسرة" value={leads.lost} color="#6B7280" icon="✖️" />
      </div>

      {/* النقاط + المالية */}
      <div style={{ ...twoCol, marginTop: 18 }}>
        <div style={panel}>
          <div style={panelTitle}>🏆 النقاط</div>
          <div style={miniGrid}>
            <Mini label="مستحقة تنتظر الاعتماد" value={points.earned_pending} color="#D97706" />
            <Mini label="متاحة (كل الموظفين)" value={points.available_total} color="#059669" />
            <Mini label="مستبدلة" value={points.redeemed_total} color="#6B7280" />
          </div>
        </div>
        <div style={panel}>
          <div style={panelTitle}>💰 المالية</div>
          <div style={miniGrid}>
            <Mini label="قيمة مشاريع الإحالات" value={money(financial.referral_project_value_kwd)} color="#274A78" />
            <Mini label="خصومات مُنحت" value={money(financial.discounts_given_kwd)} color="#B45309" />
            <Mini label="مكافآت مُعتمدة" value={money(financial.rewards_paid_kwd)} color="#059669" />
            <Mini label="طلبات بانتظار الاعتماد" value={money(financial.pending_redemption_kwd)} color="#DC2626" />
          </div>
        </div>
      </div>

      {/* الاعتمادات المعلّقة */}
      <div style={{ ...twoCol, marginTop: 18 }}>
        {/* نقاط مستحقة تنتظر الاعتماد */}
        <div style={panel}>
          <div style={panelTitle}>✅ نقاط بانتظار الاعتماد <span style={badge}>{approvals.earned.length}</span></div>
          {approvals.earned.length === 0 && <p style={empty}>لا نقاط معلّقة.</p>}
          {approvals.earned.map((t) => (
            <div key={t.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.user ?? '—'} · <span style={{ color: '#D97706' }}>+{t.points} نقطة</span></div>
                <div style={rowSub} title={t.description ?? ''}>{t.description}</div>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" style={okBtn} disabled={approveTx.isPending} onClick={() => approveTx.mutate(t.id)}>اعتماد</button>
                  <button type="button" style={noBtn} disabled={cancelTx.isPending} onClick={() => cancelTx.mutate(t.id)}>إلغاء</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* طلبات استبدال بالراتب */}
        <div style={panel}>
          <div style={panelTitle}>💸 طلبات استبدال بالراتب <span style={badge}>{approvals.redemptions.length}</span></div>
          {approvals.redemptions.length === 0 && <p style={empty}>لا طلبات معلّقة.</p>}
          {approvals.redemptions.map((r) => (
            <div key={r.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.user ?? '—'}</div>
                <div style={rowSub}>{r.points} نقطة ← <b style={{ color: '#059669' }}>{money(Number(r.amount_kwd))}</b> · {fmt(r.created_at)}</div>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" style={okBtn} disabled={approveRd.isPending} onClick={() => approveRd.mutate(r.id)}>اعتماد</button>
                  <button type="button" style={noBtn} disabled={rejectRd.isPending}
                    onClick={() => rejectRd.mutate({ id: r.id, reason: window.prompt('سبب الرفض (اختياري):') ?? undefined })}>رفض</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ترتيب الموظفين */}
      <div style={{ ...panel, marginTop: 18 }}>
        <div style={panelTitle}>🥇 ترتيب الموظفين (بالنقاط)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                {['#', 'الموظف', 'نقاط مدى الحياة', 'المتاح', 'إحالات', 'تعاقدات'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#8A93A3' }}>لا بيانات بعد.</td></tr>}
              {ranking.map((r, i) => (
                <tr key={r.user_id}>
                  <td style={td}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{r.name}</td>
                  <td style={td}><b style={{ color: '#274A78' }}>{r.lifetime}</b></td>
                  <td style={td}>{r.available}</td>
                  <td style={td}>{r.referrals}</td>
                  <td style={td}>{r.contracts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div style={{ ...kpi, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{icon} {value}</div>
      <div style={{ fontSize: 12.5, color: '#5A6478', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={miniCard}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#8A93A3', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const sectionLabel: CSSProperties = { fontSize: 13, fontWeight: 800, color: '#5A6478', margin: '0 0 10px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 };
const kpi: CSSProperties = { background: '#fff', border: '1px solid #E9EEF4', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const twoCol: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 };
const panel: CSSProperties = { background: '#fff', border: '1px solid #E9EEF4', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const panelTitle: CSSProperties = { fontSize: 14, fontWeight: 800, color: '#1A1F2E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 };
const miniGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 };
const miniCard: CSSProperties = { background: '#F7F9FC', borderRadius: 9, padding: '10px 12px', textAlign: 'center' };
const badge: CSSProperties = { fontSize: 11, fontWeight: 800, background: '#EEF3FA', color: '#274A78', borderRadius: 999, padding: '1px 9px', marginInlineStart: 'auto' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid #F1F5F9' };
const rowSub: CSSProperties = { fontSize: 11.5, color: '#8A93A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const okBtn: CSSProperties = { background: '#059669', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const noBtn: CSSProperties = { background: '#fff', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const empty: CSSProperties = { color: '#8A93A3', fontSize: 13, margin: '4px 0' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const th: CSSProperties = { textAlign: 'right', padding: '8px 10px', color: '#8A93A3', fontSize: 11.5, fontWeight: 700, borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '9px 10px', borderBottom: '1px solid #F5F7FA', whiteSpace: 'nowrap' };
