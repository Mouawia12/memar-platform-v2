import { useState, type CSSProperties } from 'react';

import { useCalculate, usePricingOptions } from '../hooks/usePricing';
import { money } from '../types';

/**
 * المحرّك الأول — الحاسبة الهندسية: السعر من نوع المبنى ومساحته وطوابقه
 * ومستوى تصميمه والخدمات المطلوبة. الأسعار من سجلّ الخدمات لا من أرقام هنا.
 */
export function EngineCalculator() {
  const { data: opts } = usePricingOptions();
  const calc = useCalculate();

  const [type, setType] = useState('فيلا');
  const [area, setArea] = useState('800');
  const [floors, setFloors] = useState('2');
  const [level, setLevel] = useState('standard');
  const [picked, setPicked] = useState<number[]>([]);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const run = () => calc.mutate({
    building_type: type,
    area_sqm: Number(area) || 1,
    floors: Number(floors) || 1,
    design_level: level,
    service_ids: picked,
  });

  const r = calc.data;

  return (
    <div style={cols}>
      <div className="card" style={pane}>
        <b style={paneTitle}>🏗️ بيانات المشروع</b>

        <label style={lbl}>نوع المبنى
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {opts?.building_types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={lbl}>المساحة (م²)
            <input className="input" type="number" min={1} value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
          <label style={lbl}>عدد الطوابق
            <input className="input" type="number" min={1} value={floors} onChange={(e) => setFloors(e.target.value)} />
          </label>
        </div>

        <label style={lbl}>مستوى التصميم
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            {opts?.design_levels.map((l) => <option key={l.key} value={l.key}>{l.label} (×{l.factor})</option>)}
          </select>
        </label>

        <div style={{ ...lbl, marginBottom: '6px' }}>الخدمات المطلوبة</div>
        <div style={chips}>
          {opts?.services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              style={{ ...chip, ...(picked.includes(s.id) ? chipOn : null) }}
              title={`${s.price_kwd} د.ك/${s.unit ?? 'مقطوع'}`}
            >
              {picked.includes(s.id) ? '☑' : '☐'} {s.name}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" type="button" onClick={run} disabled={calc.isPending || picked.length === 0} style={{ marginTop: '14px', width: '100%' }}>
          {calc.isPending ? 'جارٍ الحساب…' : '🧮 احسب السعر'}
        </button>
        {picked.length === 0 && <p style={hintSm}>اختر خدمةً واحدة على الأقل.</p>}
      </div>

      <div className="card" style={pane}>
        <b style={paneTitle}>📊 نتيجة التسعير</b>

        {!r && <p style={{ color: '#8A93A6', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>املأ البيانات واضغط «احسب السعر».</p>}

        {r && (
          <>
            <div style={bigBox}>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#1B6CA8' }}>{money(r.total_kwd)}</div>
              <div style={{ fontSize: '12px', color: '#8A93A6' }}>السعر المقترح للمشروع</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '12px 0' }}>
              <div style={miniBox}><div style={miniLbl}>فريق العمل</div><b style={miniVal}>{r.team_size} مهندسين</b></div>
              <div style={miniBox}><div style={miniLbl}>المدة المتوقّعة</div><b style={miniVal}>{r.duration_days} يوم</b></div>
            </div>

            {/* تفصيل البنود — كي يُعرف من أين جاء الرقم لا أن يُصدَّق وحده */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <tbody>
                {r.lines.map((l) => (
                  <tr key={l.service_id}>
                    <td style={ltd}>{l.name} <span style={{ color: '#A0A8B8' }}>({l.qty} {l.unit ?? ''})</span></td>
                    <td style={{ ...ltd, textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(l.total_kwd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={factorNote}>
              المعامِلات: نوع المبنى ×{r.factors.building_type} · الطوابق ×{r.factors.floors} · {r.factors.design_level_label} ×{r.factors.design_level}
              <div style={{ marginTop: '3px', color: '#A0A8B8' }}>تُطبَّق على الخدمات المسعّرة بالمتر وحدها — الرسوم المقطوعة كالرخصة لا تتأثّر.</div>
            </div>

            {r.suggestions.length > 0 && (
              <div style={suggestBox}>
                <b style={{ fontSize: '12.5px', color: '#A5710F' }}>💡 خدمات لم تُختَر:</b>
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#7A8394', lineHeight: 1.9 }}>
                  {r.suggestions.map((s) => <div key={s.service_id}>▪ {s.name} — {s.price_kwd} د.ك/{s.unit ?? 'مقطوع'}</div>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const cols: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' };
const pane: CSSProperties = { padding: '18px' };
const paneTitle: CSSProperties = { fontSize: '15px', display: 'block', marginBottom: '14px', color: '#0F2A4A' };
const lbl: CSSProperties = { display: 'block', fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '10px' };
const chips: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' };
const chip: CSSProperties = { fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit' };
const chipOn: CSSProperties = { background: '#EEF6FC', borderColor: '#1B6CA8', color: '#1B6CA8' };
const bigBox: CSSProperties = { textAlign: 'center', background: '#F6F9FC', borderRadius: '12px', padding: '20px 14px' };
const miniBox: CSSProperties = { background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' };
const miniLbl: CSSProperties = { fontSize: '11px', color: '#8A93A6' };
const miniVal: CSSProperties = { fontSize: '15px', color: '#0F2A4A' };
const ltd: CSSProperties = { padding: '7px 0', borderBottom: '1px solid #F3F5F9', color: '#5A6478' };
const factorNote: CSSProperties = { marginTop: '12px', fontSize: '11.5px', color: '#8A93A6', background: '#FAFBFD', borderRadius: '9px', padding: '9px 11px', lineHeight: 1.7 };
const suggestBox: CSSProperties = { marginTop: '12px', background: '#FFFBF2', border: '1px solid #F0DFB8', borderRadius: '10px', padding: '11px 13px' };
const hintSm: CSSProperties = { fontSize: '11.5px', color: '#A0A8B8', textAlign: 'center', marginTop: '6px' };
