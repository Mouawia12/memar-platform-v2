import { useState, type CSSProperties } from 'react';

import { useCostBased } from '../hooks/usePricing';
import { money, type CostRow, type StaffRow } from '../types';

const emptyStaff = (): StaffRow => ({ role: '', hours: '', rate_kwd: '' });
const emptyCost = (): CostRow => ({ label: '', amount_kwd: '' });

/**
 * المحرّك الثالث — التسعير حسب التكلفة: ساعات الفريق وأجرها، وتكاليف أخرى،
 * ثم هامش الربح. والمقارنة بمتوسّط عروضك المقبولة لا بـ«سوق» لا مصدر له.
 */
export function EngineCostBased() {
  const run = useCostBased();
  const [staff, setStaff] = useState<StaffRow[]>([
    { role: 'مهندس معماري', hours: '40', rate_kwd: '8' },
    { role: 'مهندس إنشائي', hours: '30', rate_kwd: '7' },
  ]);
  const [costs, setCosts] = useState<CostRow[]>([{ label: 'مصاريف تشغيلية', amount_kwd: '180' }]);
  const [margin, setMargin] = useState('50');

  const setS = (i: number, patch: Partial<StaffRow>) => setStaff((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setC = (i: number, patch: Partial<CostRow>) => setCosts((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const submit = () => run.mutate({
    staff: staff.filter((s) => s.role.trim() && s.hours).map((s) => ({ role: s.role.trim(), hours: Number(s.hours), rate_kwd: Number(s.rate_kwd) || 0 })),
    other_costs: costs.filter((c) => c.label.trim() && c.amount_kwd).map((c) => ({ label: c.label.trim(), amount_kwd: Number(c.amount_kwd) })),
    margin_percent: Number(margin) || 0,
  });

  const r = run.data;

  return (
    <div style={cols}>
      <div className="card" style={pane}>
        <b style={paneTitle}>💰 حاسبة التكلفة</b>

        <div style={sectionLbl}>تكلفة الموظفين</div>
        {staff.map((s, i) => (
          <div key={i} style={row}>
            <input className="input" value={s.role} onChange={(e) => setS(i, { role: e.target.value })} placeholder="الدور" style={{ flex: 1, minWidth: '110px' }} />
            <input className="input" type="number" min={0} value={s.hours} onChange={(e) => setS(i, { hours: e.target.value })} placeholder="ساعات" style={{ width: '80px' }} />
            <input className="input" type="number" min={0} value={s.rate_kwd} onChange={(e) => setS(i, { rate_kwd: e.target.value })} placeholder="د.ك/ساعة" style={{ width: '90px' }} />
            <button type="button" onClick={() => setStaff((x) => x.filter((_, j) => j !== i))} disabled={staff.length === 1} style={xBtn}>✕</button>
          </div>
        ))}
        <button className="btn btn-sm" type="button" onClick={() => setStaff((x) => [...x, emptyStaff()])}>＋ موظف</button>

        <div style={{ ...sectionLbl, marginTop: '16px' }}>تكاليف أخرى</div>
        {costs.map((c, i) => (
          <div key={i} style={row}>
            <input className="input" value={c.label} onChange={(e) => setC(i, { label: e.target.value })} placeholder="البند" style={{ flex: 1, minWidth: '130px' }} />
            <input className="input" type="number" min={0} value={c.amount_kwd} onChange={(e) => setC(i, { amount_kwd: e.target.value })} placeholder="د.ك" style={{ width: '100px' }} />
            <button type="button" onClick={() => setCosts((x) => x.filter((_, j) => j !== i))} disabled={costs.length === 1} style={xBtn}>✕</button>
          </div>
        ))}
        <button className="btn btn-sm" type="button" onClick={() => setCosts((x) => [...x, emptyCost()])}>＋ بند</button>

        <label style={{ ...sectionLbl, marginTop: '16px', display: 'block' }}>هامش الربح المطلوب (%)
          <input className="input" type="number" min={0} value={margin} onChange={(e) => setMargin(e.target.value)} style={{ marginTop: '6px' }} />
        </label>

        <button className="btn btn-primary" type="button" onClick={submit} disabled={run.isPending} style={{ marginTop: '14px', width: '100%' }}>
          {run.isPending ? 'جارٍ الحساب…' : '🧮 احسب السعر النهائي'}
        </button>
      </div>

      <div className="card" style={pane}>
        <b style={paneTitle}>📊 السعر النهائي</b>

        {!r && <p style={{ color: '#8A93A6', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>أدخل الساعات والتكاليف ثم احسب.</p>}

        {r && (
          <>
            <div style={calcBox}>
              <div style={calcLine}><span style={calcLbl}>التكلفة</span><b style={{ color: '#DC4A3D', fontSize: '20px' }}>{money(r.cost_kwd)}</b></div>
              <div style={{ textAlign: 'center', color: '#A0A8B8', margin: '6px 0' }}>+</div>
              <div style={calcLine}><span style={calcLbl}>هامش الربح ({r.margin_percent}%)</span><b style={{ color: '#067A4B', fontSize: '20px' }}>{money(r.margin_kwd)}</b></div>
              <div style={{ borderTop: '1px dashed #D9E1EC', margin: '12px 0 10px' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11.5px', color: '#8A93A6' }}>السعر النهائي المقترح</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#1B6CA8' }}>{money(r.final_price_kwd)}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginTop: '12px' }}>
              <tbody>
                {r.staff.map((s, i) => (
                  <tr key={`s${i}`}>
                    <td style={ltd}>{s.role} <span style={{ color: '#A0A8B8' }}>({s.hours} ساعة × {s.rate_kwd} د.ك)</span></td>
                    <td style={ltdEnd}>{money(s.total_kwd)}</td>
                  </tr>
                ))}
                {r.other_costs.map((c, i) => (
                  <tr key={`c${i}`}>
                    <td style={ltd}>{c.label}</td>
                    <td style={ltdEnd}>{money(c.amount_kwd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* المقارنة من بياناتك — وإن لم تكن فالصراحة أولى من رقمٍ مخترَع */}
            <div style={r.benchmark_kwd !== null ? benchBox : benchEmpty}>
              {r.benchmark_kwd !== null ? (
                <>
                  <b style={{ fontSize: '12.5px', color: '#1B6CA8' }}>📈 المقارنة:</b>
                  <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '4px', lineHeight: 1.9 }}>
                    ▪ {r.benchmark_label}: {money(r.benchmark_kwd)}<br />
                    ▪ سعرك {r.diff_percent === 0 ? 'مطابق للمتوسّط' : r.diff_percent! > 0 ? `أعلى بـ ${r.diff_percent}%` : `أقلّ بـ ${Math.abs(r.diff_percent!)}%`}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '12px', color: '#8A93A6' }}>
                  لا مقارنة بعد — لم يُقبَل عرضُ سعرٍ واحد حتى الآن. مع أوّل عرضٍ مقبول يظهر المتوسّط هنا.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cols: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' };
const pane: CSSProperties = { padding: '18px' };
const paneTitle: CSSProperties = { fontSize: '15px', display: 'block', marginBottom: '14px', color: '#0F2A4A' };
const sectionLbl: CSSProperties = { fontSize: '12.5px', color: '#5A6478', fontWeight: 800, marginBottom: '8px' };
const row: CSSProperties = { display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' };
const xBtn: CSSProperties = { background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '12px', padding: '4px' };
const calcBox: CSSProperties = { background: '#F6F9FC', borderRadius: '12px', padding: '16px' };
const calcLine: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' };
const calcLbl: CSSProperties = { fontSize: '12px', color: '#8A93A6' };
const ltd: CSSProperties = { padding: '7px 0', borderBottom: '1px solid #F3F5F9', color: '#5A6478' };
const ltdEnd: CSSProperties = { ...ltd, textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' };
const benchBox: CSSProperties = { marginTop: '12px', background: '#F2F8FD', border: '1px solid #C9E0F2', borderRadius: '10px', padding: '11px 13px' };
const benchEmpty: CSSProperties = { marginTop: '12px', background: '#FAFBFD', border: '1px solid #EDF1F6', borderRadius: '10px', padding: '11px 13px' };
