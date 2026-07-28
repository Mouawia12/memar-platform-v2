import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import type { InvoiceStatus, ProjectInvoice } from '../api/projectsApi';
import { useProjectPayments, useRecordPayment } from '../hooks/useProjectPayments';

const money = (v: number | string) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;
const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const INV_STATUS: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: '#6B7280' },
  sent: { label: 'مُرسَلة', color: '#1B6CA8' },
  partial: { label: 'مدفوعة جزئيًا', color: '#D97706' },
  paid: { label: 'مدفوعة', color: '#059669' },
  cancelled: { label: 'ملغاة', color: '#DC2626' },
};

const METHODS = [
  { value: 'knet', label: 'كي‌نت' },
  { value: 'cash', label: 'نقدًا' },
  { value: 'transfer', label: 'تحويل' },
  { value: 'cheque', label: 'شيك' },
];

/** لوحة دفعات المشروع (PROJ-3): فواتير المشروع + محصّل/متبقّي + تسجيل دفعة. */
export function ProjectPaymentsPanel({ projectId }: { projectId: number }) {
  const canPay = usePermission('finance.manage');
  const { data, isLoading, isError } = useProjectPayments(projectId);
  const [payFor, setPayFor] = useState<ProjectInvoice | null>(null);

  if (isLoading) return <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>جارٍ تحميل الدفعات…</div>;
  if (isError || !data) return null;

  const { summary, invoices } = data;
  const collectedPct = summary.invoiced_kwd > 0 ? Math.round((summary.paid_kwd / summary.invoiced_kwd) * 100) : 0;

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>💰 الدفعات</h3>
        <span style={{ fontSize: '13px', color: '#5A6478' }}>{summary.count} فاتورة · محصّل {collectedPct}%</span>
      </div>

      {/* ملخّص */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '14px' }}>
        <Tile label="إجمالي الفواتير" value={money(summary.invoiced_kwd)} color="#274A78" />
        <Tile label="المحصّل" value={money(summary.paid_kwd)} color="#059669" />
        <Tile label="المتبقّي" value={money(summary.remaining_kwd)} color={summary.remaining_kwd > 0 ? '#D97706' : '#059669'} />
      </div>

      {/* الفواتير */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {invoices.length === 0 && <p style={{ color: '#8A93A3', fontSize: '13px' }}>لا توجد فواتير لهذا المشروع بعد.</p>}
        {invoices.map((inv) => {
          const st = INV_STATUS[inv.status];
          const remaining = Number(inv.balance_kwd);

          return (
            <div key={inv.id} style={{ ...invRow, ...(inv.is_overdue ? { border: '1px solid #FCA5A5', background: '#FEF6F6' } : null) }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{inv.number ?? `فاتورة #${inv.id}`}
                  <span style={{ ...pill, background: `${st.color}1a`, color: st.color, marginInlineStart: '8px' }}>{st.label}</span>
                  {inv.is_overdue && <span style={{ ...pill, background: '#FEE2E2', color: '#DC2626', marginInlineStart: '6px' }}>متأخرة</span>}
                </div>
                <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '3px' }}>
                  استحقاق: {shortDate(inv.due_date)} · {money(inv.paid_kwd)} من {money(inv.total_kwd)}
                </div>
              </div>
              <div style={{ textAlign: 'left', minWidth: '110px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: remaining > 0 ? '#D97706' : '#059669' }}>{money(inv.balance_kwd)}</div>
                <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>متبقٍّ</div>
              </div>
              {canPay && remaining > 0 && inv.status !== 'cancelled' && (
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setPayFor(inv)}>💳 تسجيل دفعة</button>
              )}
            </div>
          );
        })}
      </div>

      {payFor && <PayModal projectId={projectId} invoice={payFor} onClose={() => setPayFor(null)} />}
    </div>
  );
}

function PayModal({ projectId, invoice, onClose }: { projectId: number; invoice: ProjectInvoice; onClose: () => void }) {
  const record = useRecordPayment(projectId);
  const remaining = Number(invoice.balance_kwd);
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('knet');
  const [reference, setReference] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const amt = Number(amount);
    if (!(amt > 0)) { setErr('أدخل مبلغًا صحيحًا.'); return; }
    if (amt > remaining + 0.0005) { setErr(`المبلغ يتجاوز المتبقّي (${remaining.toLocaleString('ar')} د.ك).`); return; }
    record.mutate(
      { invoiceId: invoice.id, amount_kwd: amt, method, reference: reference.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>تسجيل دفعة — {invoice.number ?? `فاتورة #${invoice.id}`}</h3>
        <div style={{ fontSize: '12.5px', color: '#5A6478', marginBottom: '14px' }}>المتبقّي: {money(invoice.balance_kwd)}</div>

        <label style={lbl}>المبلغ (د.ك)</label>
        <input className="input" type="number" step="0.001" min={0} value={amount} onChange={(e) => { setAmount(e.target.value); setErr(''); }} style={{ width: '100%' }} autoFocus />

        <label style={lbl}>طريقة الدفع</label>
        <select className="input" value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%' }}>
          {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <label style={lbl}>مرجع (اختياري)</label>
        <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="رقم العملية / الشيك…" style={{ width: '100%' }} />

        {err && <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '8px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="button" disabled={record.isPending} onClick={submit}>{record.isPending ? 'جارٍ الحفظ…' : 'تأكيد الدفعة'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
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

const invRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1px solid #EEF2F7', borderRadius: '10px' };
const pill: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' };
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' };
const modal: CSSProperties = { width: '100%', maxWidth: '400px', padding: '22px' };
const lbl: CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#5A6478', margin: '12px 0 5px' };
